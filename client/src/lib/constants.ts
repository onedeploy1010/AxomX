export const VAULT_PLANS = {
  "5_DAYS": { days: 5, dailyRate: 0.005, label: "5 Days", apr: "36.5%" },
  "15_DAYS": { days: 15, dailyRate: 0.007, label: "15 Days", apr: "51.1%" },
  "45_DAYS": { days: 45, dailyRate: 0.009, label: "45 Days", apr: "65.7%" },
} as const;

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

export function shortenAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
