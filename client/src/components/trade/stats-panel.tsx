import { Card, CardContent } from "@/components/ui/card";

export function StatsPanel() {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-3">
        <div className="text-xs font-medium mb-2 text-muted-foreground">Statistics</div>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold" data-testid="text-total-bets">0</div>
            <div className="text-[10px] text-muted-foreground">Bets</div>
          </div>
          <div>
            <div className="text-lg font-bold">0/0</div>
            <div className="text-[10px] text-muted-foreground">W/L</div>
          </div>
          <div>
            <div className="text-lg font-bold">0.0%</div>
            <div className="text-[10px] text-muted-foreground">Win Rate</div>
          </div>
          <div>
            <div className="text-lg font-bold">0</div>
            <div className="text-[10px] text-muted-foreground">Staked</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
