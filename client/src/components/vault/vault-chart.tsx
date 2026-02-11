import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { formatUSD } from "@/lib/constants";
import { useState } from "react";

const periods = ["7D", "14D", "30D", "ALL"] as const;

const chartDataMap: Record<string, { day: number; value: number }[]> = {
  "7D": Array.from({ length: 7 }, (_, i) => ({ day: i + 1, value: 420000 + i * 1800 + Math.random() * 2000 })),
  "14D": Array.from({ length: 14 }, (_, i) => ({ day: i + 1, value: 410000 + i * 1600 + Math.random() * 3000 })),
  "30D": Array.from({ length: 30 }, (_, i) => ({ day: i + 1, value: 400000 + i * 1100 + Math.random() * 4000 })),
  ALL: Array.from({ length: 60 }, (_, i) => ({ day: i + 1, value: 380000 + i * 900 + Math.random() * 5000 + (i > 40 ? i * 1500 : 0) })),
};

export function VaultChart() {
  const [period, setPeriod] = useState<string>("ALL");
  const totalValue = 432618.26;
  const changePercent = 34.52;

  return (
    <div className="gradient-green-dark p-4 pt-2 rounded-b-2xl">
      <h2 className="text-lg font-bold mb-1" data-testid="text-vault-title">Vault</h2>
      <div className="text-xs text-muted-foreground mb-2">P&L</div>
      <div className="flex items-baseline gap-3 flex-wrap mb-1">
        <span className="text-3xl font-bold tracking-tight" data-testid="text-vault-total">
          {formatUSD(totalValue)}
        </span>
        <Badge className="bg-green-500/15 text-green-400 text-xs no-default-hover-elevate no-default-active-elevate">
          <TrendingUp className="mr-1 h-3 w-3" />{changePercent}%
        </Badge>
      </div>
      <div className="h-36 mt-3" data-testid="chart-vault">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartDataMap[period]}>
            <defs>
              <linearGradient id="vaultGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 72%, 45%)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="hsl(142, 72%, 45%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="value" stroke="hsl(142, 72%, 45%)" strokeWidth={2} fill="url(#vaultGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-2 mt-2">
        {periods.map((p) => (
          <Button
            key={p}
            variant={period === p ? "default" : "ghost"}
            size="sm"
            className={`text-xs ${period === p ? "" : "text-muted-foreground"}`}
            onClick={() => setPeriod(p)}
          >
            {p}
          </Button>
        ))}
      </div>
    </div>
  );
}
