import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Coins, Users } from "lucide-react";
import { formatCompact } from "@/lib/constants";
import type { NodeRewardsSummary } from "@shared/types";
import { useTranslation } from "react-i18next";

interface NodeEarningsProps {
  rewards: NodeRewardsSummary;
}

export function NodeEarnings({ rewards }: NodeEarningsProps) {
  const { t } = useTranslation();
  const fixedYield = Number(rewards.fixedYield || 0);
  const poolDividend = Number(rewards.poolDividend || 0);
  const teamCommission = Number(rewards.teamCommission || 0);
  const total = Number(rewards.totalEarnings || 0);

  return (
    <Card className="border-border bg-card glow-green-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-bold">{t("profile.nodeEarnings")}</h4>
          <span className="text-lg font-bold text-neon-value">{formatCompact(total)}</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[12px]">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-primary" />
              {t("profile.fixedYield")}
            </div>
            <span className="font-medium">{formatCompact(fixedYield)}</span>
          </div>
          <div className="flex items-center justify-between text-[12px]">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Coins className="h-3 w-3 text-blue-400" />
              {t("profile.poolDividend")}
            </div>
            <span className="font-medium">{formatCompact(poolDividend)}</span>
          </div>
          <div className="flex items-center justify-between text-[12px]">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-3 w-3 text-purple-400" />
              {t("profile.teamCommission")}
            </div>
            <span className="font-medium">{formatCompact(teamCommission)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
