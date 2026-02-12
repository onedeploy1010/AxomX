import { useState, useCallback } from "react";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { approve } from "thirdweb/extensions/erc20";
import { prepareContractCall, waitForReceipt } from "thirdweb";
import { useThirdwebClient } from "./use-thirdweb";
import {
  getUsdcContract,
  getPaymentContract,
  usdToUsdcUnits,
  PAYMENT_CONTRACT_ADDRESS,
  PAYMENT_ABI,
  BASE_CHAIN,
} from "@/lib/contracts";

export type PaymentStatus = "idle" | "approving" | "paying" | "confirming" | "success" | "error";

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

  const pay = useCallback(
    async (amountUsd: number, ref: string): Promise<string> => {
      if (!account) throw new Error("Wallet not connected");
      if (!client) throw new Error("Thirdweb client not ready");
      if (!PAYMENT_CONTRACT_ADDRESS) throw new Error("Payment contract not configured");

      setStatus("approving");
      setError(null);
      setTxHash(null);

      try {
        const usdcContract = getUsdcContract(client);
        const amount = usdToUsdcUnits(amountUsd);

        // Step 1: Approve USDC spend
        const approveTx = approve({
          contract: usdcContract,
          spender: PAYMENT_CONTRACT_ADDRESS,
          amount: amountUsd,
        });
        const approveResult = await sendTransaction(approveTx);
        await waitForReceipt({
          client,
          chain: BASE_CHAIN,
          transactionHash: approveResult.transactionHash,
        });

        // Step 2: Call pay() on the payment contract
        setStatus("paying");
        const paymentContract = getPaymentContract(client);
        const payTx = prepareContractCall({
          contract: paymentContract,
          method: PAYMENT_ABI[0],
          params: [amount, ref],
        });
        const payResult = await sendTransaction(payTx);

        // Step 3: Wait for confirmation
        setStatus("confirming");
        const receipt = await waitForReceipt({
          client,
          chain: BASE_CHAIN,
          transactionHash: payResult.transactionHash,
        });

        if (receipt.status === "reverted") {
          throw new Error("Transaction reverted");
        }

        setTxHash(receipt.transactionHash);
        setStatus("success");
        return receipt.transactionHash;
      } catch (err: any) {
        const message = err?.message || "Payment failed";
        setError(message);
        setStatus("error");
        throw err;
      }
    },
    [account, client, sendTransaction]
  );

  return { pay, status, txHash, error, reset };
}

// Status label helper for UI
export function getPaymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case "approving": return "Approving USDC...";
    case "paying": return "Sending payment...";
    case "confirming": return "Confirming...";
    case "success": return "Payment confirmed";
    case "error": return "Payment failed";
    default: return "";
  }
}
