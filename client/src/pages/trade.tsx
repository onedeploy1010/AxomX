import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { usePriceChart } from "@/hooks/use-crypto-price";
import { ASSET_IDS } from "@/lib/constants";
import { PriceChart } from "@/components/dashboard/price-chart";
import { PredictionGrid } from "@/components/trade/prediction-grid";
import { BetControls } from "@/components/trade/bet-controls";
import { MarketCard } from "@/components/trade/market-card";
import { StatsPanel } from "@/components/trade/stats-panel";
import type { PredictionMarket } from "@shared/schema";

export default function Trade() {
  const [selectedAsset, setSelectedAsset] = useState("BTC");
  const [betAmount, setBetAmount] = useState(10);
  const [mode, setMode] = useState<"grid" | "market">("grid");
  const coinId = ASSET_IDS[selectedAsset] || "bitcoin";

  const { data: chartData, isLoading: chartLoading } = usePriceChart(coinId);
  const { data: markets = [] } = useQuery<PredictionMarket[]>({ queryKey: ["/api/predictions"] });

  return (
    <div className="space-y-4 pb-40">
      <div className="flex items-center justify-between px-4 pt-2">
        <Select value={selectedAsset} onValueChange={setSelectedAsset}>
          <SelectTrigger className="h-9 w-24 border-border bg-card text-sm" data-testid="select-asset">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BTC">BTC</SelectItem>
            <SelectItem value="ETH">ETH</SelectItem>
            <SelectItem value="SOL">SOL</SelectItem>
            <SelectItem value="BNB">BNB</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Source: Binance</span>
          <div className="flex rounded-md border border-border overflow-visible">
            <button
              onClick={() => setMode("grid")}
              className={`px-3 py-1 text-xs transition-colors ${mode === "grid" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}
              data-testid="button-grid-mode"
            >
              Grid
            </button>
            <button
              onClick={() => setMode("market")}
              className={`px-3 py-1 text-xs transition-colors ${mode === "market" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}
              data-testid="button-market-mode"
            >
              Market
            </button>
          </div>
        </div>
      </div>

      {mode === "grid" ? (
        <div className="px-4 space-y-3">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-green-400">Wins: 24</span>
            <span className="text-red-400">Losses: 23</span>
            <Badge variant="secondary" className="text-[10px] no-default-hover-elevate no-default-active-elevate">Streaks: 5x</Badge>
          </div>
          <PredictionGrid wins={24} losses={23} />
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {markets.length > 0 ? (
            markets.map((m) => <MarketCard key={m.id} market={m} />)
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading markets...</div>
          )}
        </div>
      )}

      <div className="px-4">
        <PriceChart data={chartData} isLoading={chartLoading} color="hsl(200, 70%, 50%)" />
      </div>

      <div className="px-4">
        <StatsPanel />
      </div>

      <BetControls amount={betAmount} onAmountChange={setBetAmount} duration="1min" />
    </div>
  );
}
