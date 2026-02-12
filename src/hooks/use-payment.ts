import { useState, useCallback } from "react";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { approve } from "thirdweb/extensions/erc20";
import { prepareContractCall, waitForReceipt } from "thirdweb";
import { useThirdwebClient } from "./use-thirdweb";
import {
  getUsdcContract,
  getVaultContract,
  getNodeContract,
  getVIPContract,
  usdToUsdcUnits,
  VAULT_CONTRACT_ADDRESS,
  NODE_CONTRACT_ADDRESS,
  VIP_CONTRACT_ADDRESS,
  VAULT_ABI,
  NODE_ABI,
  VIP_ABI,
  BASE_CHAIN,
} from "@/lib/contracts";

export type PaymentStatus =
  | "idle"
  | "approving"
  | "paying"
  | "confirming"
  | "recording"
  | "success"
  | "error";

export function usePayment() {
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const account = useActiveAccount();
  const { client } = useThirdwebClient();
  const { mutateAsync: sendTransaction } = useSendTransaction();

  const reset = useCallback(() => {
    setStatus("idle");
    setTxHash(null);
    setError(null);
  }, []);

  const markSuccess = useCallback(() => {
    setStatus("success");
  }, []);

  /**
   * Shared approve + call + confirm flow.
   * @param contractAddress - The payment contract to call
   * @param spenderAddress - Address to approve USDC to
   * @param amountUsd - USD amount for approval
   * @param prepareTx - Function that prepares the contract call transaction
   */
  const _executePayment = useCallback(
    async (
      spenderAddress: string,
      amountUsd: number,
      prepareTx: () => ReturnType<typeof prepareContractCall>,
    ): Promise<string> => {
      if (!account) throw new Error("Wallet not connected");
      if (!client) throw new Error("Thirdweb client not ready");

      setStatus("approving");
      setError(null);
      setTxHash(null);

      try {
        const usdcContract = getUsdcContract(client);

        // Step 1: Approve USDC spend
        const approveTx = approve({
          contract: usdcContract,
          spender: spenderAddress,
          amount: amountUsd,
        });
        const approveResult = await sendTransaction(approveTx);
        await waitForReceipt({
          client,
          chain: BASE_CHAIN,
          transactionHash: approveResult.transactionHash,
        });

        // Step 2: Execute contract call
        setStatus("paying");
        const tx = prepareTx();
        const payResult = await sendTransaction(tx);

        // Step 3: Wait for on-chain confirmation
        setStatus("confirming");
        const receipt = await waitForReceipt({
          client,
          chain: BASE_CHAIN,
          transactionHash: payResult.transactionHash,
        });

        if (receipt.status === "reverted") {
          throw new Error("Transaction reverted");
        }

        const confirmedHash = receipt.transactionHash;
        setTxHash(confirmedHash);
        setStatus("recording");
        return confirmedHash;
      } catch (err: any) {
        const message = err?.message || "Payment failed";
        setError(message);
        setStatus("error");
        throw err;
      }
    },
    [account, client, sendTransaction],
  );

  // ── Vault deposit ──
  const payVaultDeposit = useCallback(
    async (amountUsd: number, planType: string): Promise<string> => {
      if (!VAULT_CONTRACT_ADDRESS) throw new Error("Vault contract not configured");
      if (!client) throw new Error("Thirdweb client not ready");
      const amount = usdToUsdcUnits(amountUsd);
      return _executePayment(VAULT_CONTRACT_ADDRESS, amountUsd, () =>
        prepareContractCall({
          contract: getVaultContract(client),
          method: VAULT_ABI[0],
          params: [amount, planType],
        }),
      );
    },
    [client, _executePayment],
  );

  // ── Node purchase ──
  const payNodePurchase = useCallback(
    async (nodeType: string): Promise<string> => {
      if (!NODE_CONTRACT_ADDRESS) throw new Error("Node contract not configured");
      if (!client) throw new Error("Thirdweb client not ready");
      // Price is enforced on-chain by the contract
      const prices: Record<string, number> = { MINI: 1000, MAX: 6000 };
      const amountUsd = prices[nodeType] || 0;
      return _executePayment(NODE_CONTRACT_ADDRESS, amountUsd, () =>
        prepareContractCall({
          contract: getNodeContract(client),
          method: NODE_ABI[0],
          params: [nodeType],
        }),
      );
    },
    [client, _executePayment],
  );

  // ── VIP subscribe ──
  const payVIPSubscribe = useCallback(
    async (planLabel: string): Promise<string> => {
      if (!VIP_CONTRACT_ADDRESS) throw new Error("VIP contract not configured");
      if (!client) throw new Error("Thirdweb client not ready");
      const prices: Record<string, number> = { monthly: 69, yearly: 899 };
      const amountUsd = prices[planLabel] || 69;
      return _executePayment(VIP_CONTRACT_ADDRESS, amountUsd, () =>
        prepareContractCall({
          contract: getVIPContract(client),
          method: VIP_ABI[0],
          params: [planLabel],
        }),
      );
    },
    [client, _executePayment],
  );

  return {
    payVaultDeposit,
    payNodePurchase,
    payVIPSubscribe,
    status,
    txHash,
    error,
    reset,
    markSuccess,
  };
}

/** Status label helper for UI */
export function getPaymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case "approving":  return "Approving USDC...";
    case "paying":     return "Sending payment...";
    case "confirming": return "Confirming on-chain...";
    case "recording":  return "Recording to database...";
    case "success":    return "Payment confirmed";
    case "error":      return "Payment failed";
    default:           return "";
  }
}
