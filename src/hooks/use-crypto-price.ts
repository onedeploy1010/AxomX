import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

async function proxyFetch(url: string): Promise<any> {
  const { data, error } = await supabase.functions.invoke("api-proxy", {
    body: { url },
  });
  if (error) throw error;
  return data;
}

export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  image: string;
}

export interface ChartDataPoint {
  time: string;
  price: number;
  timestamp: number;
}

export type ChartTimeframe = "1m" | "10m" | "30m" | "1H" | "4H" | "1D" | "7D";

const BINANCE_INTERVALS: Record<ChartTimeframe, { interval: string; limit: number }> = {
  "1m": { interval: "1m", limit: 60 },
  "10m": { interval: "1m", limit: 120 },
  "30m": { interval: "1m", limit: 180 },
  "1H": { interval: "5m", limit: 72 },
  "4H": { interval: "15m", limit: 96 },
  "1D": { interval: "1h", limit: 24 },
  "7D": { interval: "4h", limit: 42 },
};

function formatTimeLabel(ts: number, tf: ChartTimeframe): string {
  const d = new Date(ts);
  if (tf === "7D" || tf === "1D") {
    return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function useCryptoPrices() {
  return useQuery<CryptoPrice[]>({
    queryKey: ["crypto-prices"],
    queryFn: async () => {
      return proxyFetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,binancecoin,dogecoin,solana&order=market_cap_desc&sparkline=false&price_change_percentage=24h"
      );
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });
}

export function usePriceChart(coinId: string, days: number = 1) {
  return useQuery<ChartDataPoint[]>({
    queryKey: ["price-chart", coinId, days],
    queryFn: async () => {
      const data = await proxyFetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
      );
      return data.prices.map(([timestamp, price]: [number, number]) => ({
        timestamp,
        time: new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        price,
      }));
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function useBinanceChart(symbol: string, timeframe: ChartTimeframe) {
  return useQuery<ChartDataPoint[]>({
    queryKey: ["binance-chart", symbol, timeframe],
    queryFn: async () => {
      const pair = symbol === "DOGE" ? "DOGEUSDT" : `${symbol}USDT`;
      const cfg = BINANCE_INTERVALS[timeframe];
      const res = await fetch(
        `https://api.binance.us/api/v3/klines?symbol=${pair}&interval=${cfg.interval}&limit=${cfg.limit}`
      );
      if (!res.ok) {
        const fallbackRes = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${cfg.interval}&limit=${cfg.limit}`
        );
        if (!fallbackRes.ok) throw new Error("Failed to fetch klines");
        const fallbackData = await fallbackRes.json();
        return (fallbackData as any[]).map((k: any) => ({
          timestamp: k[0],
          time: formatTimeLabel(k[0], timeframe),
          price: parseFloat(k[4]),
        }));
      }
      const data = await res.json();
      return (data as any[]).map((k: any) => ({
        timestamp: k[0],
        time: formatTimeLabel(k[0], timeframe),
        price: parseFloat(k[4]),
      }));
    },
    refetchInterval: timeframe === "1m" ? 10000 : timeframe === "10m" ? 15000 : 30000,
    staleTime: timeframe === "1m" ? 5000 : 15000,
  });
}

export function useOrderBook(symbol: string) {
  return useQuery({
    queryKey: ["orderbook", symbol],
    queryFn: async () => {
      try {
        const res = await fetch(
          `https://api.binance.com/api/v3/depth?symbol=${symbol}USDT&limit=10`
        );
        if (!res.ok) throw new Error("Failed to fetch order book");
        const data = await res.json();
        const totalBids = data.bids.reduce((s: number, b: string[]) => s + parseFloat(b[1]), 0);
        const totalAsks = data.asks.reduce((s: number, a: string[]) => s + parseFloat(a[1]), 0);
        const total = totalBids + totalAsks;
        return {
          bids: data.bids.slice(0, 10),
          asks: data.asks.slice(0, 10),
          buyPercent: ((totalBids / total) * 100).toFixed(1),
          sellPercent: ((totalAsks / total) * 100).toFixed(1),
        };
      } catch {
        return { bids: [], asks: [], buyPercent: "50.0", sellPercent: "50.0" };
      }
    },
    refetchInterval: 10000,
    staleTime: 5000,
  });
}
