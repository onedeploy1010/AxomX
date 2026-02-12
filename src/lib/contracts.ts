import { getContract } from "thirdweb";
import { base } from "thirdweb/chains";
import type { ThirdwebClient } from "thirdweb";

// USDC on Base mainnet (6 decimals)
export const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const USDC_DECIMALS = 6;

// AxomX payment contract address (set via env after deployment)
export const PAYMENT_CONTRACT_ADDRESS = import.meta.env.VITE_PAYMENT_CONTRACT_ADDRESS || "";

export const BASE_CHAIN = base;

// Convert USD amount to USDC units (6 decimals)
export function usdToUsdcUnits(amount: number): bigint {
  return BigInt(Math.round(amount * 10 ** USDC_DECIMALS));
}

export function getUsdcContract(client: ThirdwebClient) {
  return getContract({
    client,
    chain: BASE_CHAIN,
    address: USDC_ADDRESS,
  });
}

export function getPaymentContract(client: ThirdwebClient) {
  if (!PAYMENT_CONTRACT_ADDRESS) {
    throw new Error("VITE_PAYMENT_CONTRACT_ADDRESS is not set");
  }
  return getContract({
    client,
    chain: BASE_CHAIN,
    address: PAYMENT_CONTRACT_ADDRESS,
  });
}

// Minimal ABI for the pay function
export const PAYMENT_ABI = [
  {
    type: "function",
    name: "pay",
    inputs: [
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "ref", type: "string", internalType: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;
