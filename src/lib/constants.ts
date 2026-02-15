export const SUPPORTED_ASSETS = ["bitcoin", "ethereum", "binancecoin", "dogecoin", "solana"] as const;
export const ASSET_SYMBOLS: Record<string, string> = {
  bitcoin: "BTC",
  ethereum: "ETH",
  binancecoin: "BNB",
  dogecoin: "DOGE",
  solana: "SOL",
};

export const ASSET_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  BNB: "binancecoin",
  DOGE: "dogecoin",
  SOL: "solana",
};

export function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

export const AR_PRICE = 0.1;

export function usdcToAR(usdc: number): number {
  return usdc / AR_PRICE;
}

export function formatAR(usdc: number): string {
  const ar = usdcToAR(usdc);
  return `${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(ar)} AR`;
}

export function formatCompactAR(usdc: number): string {
  const ar = usdcToAR(usdc);
  if (ar >= 1_000_000) return `${(ar / 1_000_000).toFixed(2)}M AR`;
  if (ar >= 1_000) return `${(ar / 1_000).toFixed(1)}K AR`;
  return `${ar.toFixed(2)} AR`;
}

export function shortenAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
