// Pure TypeScript types matching the Supabase database schema.
// No drizzle-orm dependency required for the frontend.

export interface Profile {
  id: string;
  walletAddress: string;
  refCode: string;
  referrerId: string | null;
  rank: string;
  nodeType: string;
  isVip: boolean;
  vipExpiresAt: string | null;
  totalDeposited: string | null;
  totalWithdrawn: string | null;
  referralEarnings: string | null;
  createdAt: string | null;
}

export interface VaultPosition {
  id: string;
  userId: string;
  planType: string;
  executionMode: string;
  principal: string;
  dailyRate: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
}

export interface Strategy {
  id: string;
  name: string;
  description: string | null;
  leverage: string;
  winRate: string | null;
  monthlyReturn: string | null;
  totalAum: string | null;
  status: string;
  isHot: boolean | null;
  isVipOnly: boolean | null;
  createdAt: string | null;
}

export interface StrategySubscription {
  id: string;
  userId: string;
  strategyId: string;
  executionMode: string;
  allocatedCapital: string;
  maxDrawdown: string | null;
  currentPnl: string | null;
  status: string;
  createdAt: string | null;
}

export interface PredictionMarket {
  id: string;
  asset: string;
  timeframe: string;
  targetPrice1: string | null;
  targetPrice2: string | null;
  yesOdds: string | null;
  noOdds: string | null;
  expiresAt: string | null;
  status: string;
  createdAt: string | null;
}

export interface NodeMembership {
  id: string;
  userId: string;
  nodeType: string;
  price: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: string;
  token: string;
  amount: string;
  txHash: string | null;
  status: string;
  createdAt: string | null;
}

export interface TradeBet {
  id: string;
  userId: string;
  asset: string;
  direction: string;
  amount: string;
  duration: string;
  entryPrice: string | null;
  exitPrice: string | null;
  payout: string | null;
  result: string | null;
  settledAt: string | null;
  createdAt: string | null;
}

export interface AiPrediction {
  id: string;
  asset: string;
  prediction: string;
  confidence: string | null;
  targetPrice: string | null;
  currentPrice: string | null;
  fearGreedIndex: number | null;
  fearGreedLabel: string | null;
  reasoning: string | null;
  timeframe: string;
  expiresAt: string | null;
  createdAt: string | null;
}

export interface HedgePosition {
  id: string;
  userId: string;
  amount: string;
  currentPnl: string | null;
  purchaseAmount: string | null;
  status: string;
  createdAt: string | null;
}

export interface InsurancePurchase {
  id: string;
  userId: string;
  amount: string;
  status: string;
  createdAt: string | null;
}

export interface PredictionBet {
  id: string;
  userId: string;
  marketId: string;
  marketType: string;
  question: string;
  choice: string;
  odds: string;
  amount: string;
  potentialPayout: string;
  status: string;
  result: string | null;
  settledAt: string | null;
  createdAt: string | null;
}

export interface SystemConfig {
  key: string;
  value: string;
  updatedAt: string | null;
}
