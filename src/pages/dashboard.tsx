import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ASSET_IDS } from "@/lib/constants";
import { fetchExchangeDepth, getAiForecast } from "@/lib/api";
import { useCryptoPrices, useBinanceChart, useOrderBook } from "@/hooks/use-crypto-price";
import type { ChartTimeframe } from "@/hooks/use-crypto-price";
import { PriceHeader } from "@/components/dashboard/price-header";
import { PriceChart } from "@/components/dashboard/price-chart";
import { AssetTabs } from "@/components/dashboard/asset-tabs";
import { DepthBar } from "@/components/dashboard/depth-bar";
import { TrendingFeed } from "@/components/dashboard/trending-feed";
import { ExchangeDepth } from "@/components/dashboard/exchange-depth";
import { AiPredictionGrid } from "@/components/dashboard/ai-prediction-grid";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";

interface ForecastResponse {
  asset: string;
  timeframe: string;
  direction: string;
  confidence: number;
  currentPrice: number;
  targetPrice: number;
  reasoning: string;
  forecastPoints: { timestamp: number; time: string; price: number; predicted: boolean }[];
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [selectedAsset, setSelectedAsset] = useState("BTC");
  const [selectedTimeframe, setSelectedTimeframe] = useState<ChartTimeframe>("1H");
  const coinId = ASSET_IDS[selectedAsset] || "bitcoin";

  const { data: prices, isLoading: pricesLoading } = useCryptoPrices();
  const { data: chartData, isLoading: chartLoading } = useBinanceChart(selectedAsset, selectedTimeframe);
  const { data: orderBook, isLoading: bookLoading } = useOrderBook(selectedAsset);

  const { data: exchangeData, isLoading: exchangeLoading } = useQuery<{
    exchanges: Array<{ name: string; buy: number; sell: number }>;
    aggregatedBuy: number;
    aggregatedSell: number;
    fearGreedIndex: number;
    fearGreedLabel: string;
    longShortRatio: number;
    timestamp: number;
  }>({
    queryKey: ["exchange-depth", selectedAsset],
    queryFn: async () => {
      const depth = await fetchExchangeDepth(selectedAsset);
      return {
        exchanges: depth.exchanges.map(e => ({ name: e.name, buy: e.buyPercent, sell: e.sellPercent })),
        aggregatedBuy: depth.buyPercent,
        aggregatedSell: depth.sellPercent,
        fearGreedIndex: depth.fearGreedIndex,
        fearGreedLabel: depth.fearGreedLabel,
        longShortRatio: depth.buyPercent / (depth.sellPercent || 1),
        timestamp: Date.now(),
      };
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const { data: forecast, isLoading: forecastLoading } = useQuery<ForecastResponse>({
    queryKey: ["ai-forecast", selectedAsset, selectedTimeframe],
    queryFn: () => getAiForecast(selectedAsset, selectedTimeframe),
    staleTime: 3 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const selectedCoin = prices?.find(
    (p) => p.symbol.toUpperCase() === selectedAsset
  );

  const depthBuy = exchangeData ? String(exchangeData.aggregatedBuy) : (orderBook?.buyPercent || "50.0");
  const depthSell = exchangeData ? String(exchangeData.aggregatedSell) : (orderBook?.sellPercent || "50.0");

  return (
    <div className="space-y-4 pb-24" data-testid="page-dashboard">
      <div
        className="gradient-green-dark rounded-b-2xl p-4 pt-2"
        style={{ animation: "fadeSlideIn 0.5s ease-out" }}
      >
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <PriceHeader coin={selectedCoin} isLoading={pricesLoading} />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigate(`/market?coin=${selectedAsset}`)}
            className="mt-1 shrink-0"
            data-testid="button-market-analysis"
          >
            <BarChart3 className="h-5 w-5" />
          </Button>
        </div>
        <PriceChart
          data={chartData}
          isLoading={chartLoading}
          forecast={forecast || null}
          forecastLoading={forecastLoading}
          selectedTimeframe={selectedTimeframe}
          onTimeframeChange={setSelectedTimeframe}
        />
      </div>

      <div className="px-4" style={{ animation: "fadeSlideIn 0.6s ease-out" }}>
        <AssetTabs selected={selectedAsset} onChange={setSelectedAsset} />
      </div>

      <div className="px-4" style={{ animation: "fadeSlideIn 0.7s ease-out" }}>
        <DepthBar
          buyPercent={depthBuy}
          sellPercent={depthSell}
          isLoading={bookLoading && exchangeLoading}
          fearGreedIndex={exchangeData?.fearGreedIndex}
          fearGreedLabel={exchangeData?.fearGreedLabel}
        />
      </div>

      <div className="px-4" style={{ animation: "fadeSlideIn 0.8s ease-out" }}>
        <AiPredictionGrid asset={selectedAsset} currentPrice={selectedCoin?.current_price || null} />
      </div>

      <div className="px-4" style={{ animation: "fadeSlideIn 0.85s ease-out" }}>
        <TrendingFeed prices={prices} isLoading={pricesLoading} />
      </div>

      <div className="px-4" style={{ animation: "fadeSlideIn 0.9s ease-out" }}>
        <ExchangeDepth symbol={selectedAsset} />
      </div>
    </div>
  );
}
