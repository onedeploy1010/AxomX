import { useQuery } from "@tanstack/react-query";

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

export function useCryptoPrices() {
  return useQuery<CryptoPrice[]>({
    queryKey: ["crypto-prices"],
    queryFn: async () => {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,binancecoin,dogecoin,solana&order=market_cap_desc&sparkline=false&price_change_percentage=24h"
      );
      if (!res.ok) throw new Error("Failed to fetch prices");
      return res.json();
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });
}

export function usePriceChart(coinId: string, days: number = 1) {
  return useQuery<ChartDataPoint[]>({
    queryKey: ["price-chart", coinId, days],
    queryFn: async () => {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
      );
      if (!res.ok) throw new Error("Failed to fetch chart");
      const data = await res.json();
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
