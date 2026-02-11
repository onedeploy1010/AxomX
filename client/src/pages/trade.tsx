import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { usePriceChart } from "@/hooks/use-crypto-price";
import { ASSET_IDS } from "@/lib/constants";
import { TRADE_ASSETS, BET_DEFAULTS, TRADE_STATS, TRADE_SOURCE } from "@/lib/data";
import { PriceChart } from "@/components/dashboard/price-chart";
import { PredictionGrid } from "@/components/trade/prediction-grid";
import { BetControls } from "@/components/trade/bet-controls";
import { MarketCard } from "@/components/trade/market-card";
import { StatsPanel } from "@/components/trade/stats-panel";
import type { PredictionMarket } from "@shared/schema";

export default function Trade() {
  const [selectedAsset, setSelectedAsset] = useState("BTC");
  const [betAmount, setBetAmount] = useState(BET_DEFAULTS.defaultAmount);
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
            {TRADE_ASSETS.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Source: {TRADE_SOURCE}</span>
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
            <span className="text-green-400">Wins: {TRADE_STATS.wins}</span>
            <span className="text-red-400">Losses: {TRADE_STATS.losses}</span>
            <Badge variant="secondary" className="text-[10px] no-default-hover-elevate no-default-active-elevate">Streaks: {TRADE_STATS.streaks}x</Badge>
          </div>
          <PredictionGrid wins={TRADE_STATS.wins} losses={TRADE_STATS.losses} />
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

      <BetControls amount={betAmount} onAmountChange={setBetAmount} duration={BET_DEFAULTS.defaultDuration} />
    </div>
  );
}
