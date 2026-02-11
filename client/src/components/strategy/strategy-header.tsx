import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { STRATEGY_OVERVIEW } from "@/lib/data";

export function StrategyHeader() {
  return (
    <div className="gradient-green-dark p-4 pt-2 rounded-b-2xl">
      <h2 className="text-lg font-bold mb-3" data-testid="text-strategy-title">Strategy Overview</h2>
      <Card className="border-border bg-card/50 glow-green-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] text-muted-foreground mb-1">Total AUM</div>
              <div className="text-2xl font-bold" data-testid="text-total-aum">{STRATEGY_OVERVIEW.totalAum}</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Lock className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <Card className="border-border bg-card/50">
          <CardContent className="p-3">
            <div className="text-[10px] text-muted-foreground mb-1">Avg Win Rate / Mo</div>
            <div className="text-xl font-bold text-green-400" data-testid="text-win-rate">{STRATEGY_OVERVIEW.avgWinRate}</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50">
          <CardContent className="p-3">
            <div className="text-[10px] text-muted-foreground mb-1">Avg Return / Mo</div>
            <div className="text-xl font-bold text-green-400" data-testid="text-avg-return">{STRATEGY_OVERVIEW.avgReturn}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
