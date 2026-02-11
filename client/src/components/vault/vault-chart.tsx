import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { formatUSD } from "@/lib/constants";
import { VAULT_OVERVIEW, VAULT_CHART_PERIODS, type VaultChartPeriod } from "@/lib/data";
import { generateVaultChartData } from "@/lib/formulas";
import { useState, useMemo } from "react";

export function VaultChart() {
  const [period, setPeriod] = useState<VaultChartPeriod>("ALL");
  const chartData = useMemo(() => generateVaultChartData(period), [period]);

  return (
    <div className="gradient-green-dark p-4 pt-2 rounded-b-2xl">
      <h2 className="text-lg font-bold mb-1" data-testid="text-vault-title">Vault</h2>
      <div className="text-xs text-muted-foreground mb-2">P&L</div>
      <div className="flex items-baseline gap-3 flex-wrap mb-1">
        <span className="text-3xl font-bold tracking-tight" data-testid="text-vault-total">
          {formatUSD(VAULT_OVERVIEW.totalValue)}
        </span>
        <Badge className="bg-green-500/15 text-green-400 text-xs no-default-hover-elevate no-default-active-elevate">
          <TrendingUp className="mr-1 h-3 w-3" />{VAULT_OVERVIEW.changePercent}%
        </Badge>
      </div>
      <div className="h-36 mt-3" data-testid="chart-vault">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
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
        {VAULT_CHART_PERIODS.map((p) => (
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
