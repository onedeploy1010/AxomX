export interface ExchangeRow {
  name: string;
  buy: number;
  sell: number;
}

export const EXCHANGES: ExchangeRow[] = [
  { name: "LBank", buy: 48.9, sell: 51.1 },
  { name: "CoinEx", buy: 47.9, sell: 52.1 },
  { name: "Gate", buy: 47.0, sell: 53.0 },
  { name: "Bitunix", buy: 47.0, sell: 53.0 },
  { name: "Bitmex", buy: 46.5, sell: 53.5 },
  { name: "Kraken", buy: 46.5, sell: 53.5 },
  { name: "MEXC", buy: 44.4, sell: 55.6 },
  { name: "Crypto.com", buy: 46.2, sell: 53.8 },
  { name: "Coinbase", buy: 46.0, sell: 54.0 },
  { name: "Binance", buy: 45.8, sell: 54.2 },
  { name: "OKX", buy: 45.8, sell: 54.2 },
  { name: "Bitget", buy: 45.4, sell: 54.6 },
  { name: "Bybit", buy: 44.3, sell: 55.7 },
  { name: "Hyperliquid", buy: 43.5, sell: 56.5 },
];

export interface TrendingItem {
  text: string;
  type: "gain" | "loss";
}

export const TRENDING_ITEMS: TrendingItem[] = [
  { text: "BTC Trade +5.80%", type: "gain" },
  { text: "ETH Trade -1.76%", type: "loss" },
  { text: "GPT-5 completed SOL +17.92%", type: "gain" },
  { text: "BNB Trade -4.76%", type: "loss" },
  { text: "Claude completed BTC +3.21%", type: "gain" },
  { text: "SOL Strategy +8.44%", type: "gain" },
];

export const VAULT_OVERVIEW = {
  totalValue: 432618.26,
  changePercent: 34.52,
  tvl: "1,000,006",
  monthlyReturn: 34.52,
  yield24h: 0,
  duration: "12 months",
  holders: "16,613",
  lockUps: 0,
};

export const VAULT_CHART_PERIODS = ["7D", "14D", "30D", "ALL"] as const;
export type VaultChartPeriod = (typeof VAULT_CHART_PERIODS)[number];

export const STRATEGY_OVERVIEW = {
  totalAum: "$9,543,582",
  avgWinRate: "82.3%",
  avgReturn: "83.88%",
};

export const STRATEGY_FILTERS = ["All", "Trending", "Quantitative", "Completed"] as const;
export const PREDICTION_TIMEFRAMES = ["All", "15min", "1H", "4H"] as const;

export const TRADE_ASSETS = ["BTC", "ETH", "SOL", "BNB"] as const;
export const DASHBOARD_ASSETS = ["BTC", "ETH", "BNB", "DOGE", "SOL"] as const;

export const BET_DEFAULTS = {
  minAmount: 1,
  step: 5,
  defaultAmount: 10,
  defaultDuration: "1min",
  payoutPercent: 84,
};

export const PREDICTION_GRID_CONFIG = {
  totalCells: 54,
  columns: 9,
  hitThreshold: 0.6,
  directionThreshold: 0.5,
};

export const VAULT_PLANS = {
  "5_DAYS": { days: 5, dailyRate: 0.005, label: "5 Days", apr: "36.5%" },
  "15_DAYS": { days: 15, dailyRate: 0.007, label: "15 Days", apr: "51.1%" },
  "45_DAYS": { days: 45, dailyRate: 0.009, label: "45 Days", apr: "65.7%" },
} as const;

export const TRADE_STATS = {
  wins: 24,
  losses: 23,
  streaks: 5,
};

export const TRADE_SOURCE = "Binance";

export const SETTINGS_ITEMS = [
  { key: "leaderboard", label: "Leaderboard" },
  { key: "contact-us", label: "Contact Us" },
  { key: "language-settings", label: "Language Settings" },
  { key: "disconnect-wallet", label: "Disconnect Wallet" },
] as const;
