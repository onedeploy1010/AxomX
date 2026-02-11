import { useState } from "react";
import { ASSET_IDS } from "@/lib/constants";
import { useCryptoPrices, usePriceChart, useOrderBook } from "@/hooks/use-crypto-price";
import { PriceHeader } from "@/components/dashboard/price-header";
import { PriceChart } from "@/components/dashboard/price-chart";
import { AssetTabs } from "@/components/dashboard/asset-tabs";
import { DepthBar } from "@/components/dashboard/depth-bar";
import { TrendingFeed } from "@/components/dashboard/trending-feed";
import { ExchangeDepth } from "@/components/dashboard/exchange-depth";

export default function Dashboard() {
  const [selectedAsset, setSelectedAsset] = useState("BTC");
  const coinId = ASSET_IDS[selectedAsset] || "bitcoin";

  const { data: prices, isLoading: pricesLoading } = useCryptoPrices();
  const { data: chartData, isLoading: chartLoading } = usePriceChart(coinId);
  const { data: orderBook, isLoading: bookLoading } = useOrderBook(selectedAsset);

  const selectedCoin = prices?.find(
    (p) => p.symbol.toUpperCase() === selectedAsset
  );

  return (
    <div className="space-y-4 pb-20">
      <div className="gradient-green-dark rounded-b-2xl p-4 pt-2">
        <PriceHeader coin={selectedCoin} isLoading={pricesLoading} />
        <PriceChart data={chartData} isLoading={chartLoading} />
      </div>

      <div className="px-4">
        <AssetTabs selected={selectedAsset} onChange={setSelectedAsset} />
      </div>

      <div className="px-4">
        <DepthBar
          buyPercent={orderBook?.buyPercent || "50.0"}
          sellPercent={orderBook?.sellPercent || "50.0"}
          isLoading={bookLoading}
        />
      </div>

      <div className="px-4">
        <TrendingFeed />
      </div>

      <div className="px-4">
        <ExchangeDepth symbol={selectedAsset} />
      </div>
    </div>
  );
}
