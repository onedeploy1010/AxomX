import { Card, CardContent } from "@/components/ui/card";
import { Lock, BarChart3, Users } from "lucide-react";

export function AssetsOverview() {
  return (
    <div className="gradient-green-dark p-4 pt-2 rounded-b-2xl">
      <h2 className="text-lg font-bold mb-3" data-testid="text-profile-title">Assets Overview</h2>
      <Card className="border-border bg-card/50 glow-green-sm mb-3">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1">
                <Lock className="h-3 w-3" /> Vault Available
              </div>
              <div className="text-2xl font-bold" data-testid="text-vault-balance">$0.00</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center glow-green-sm">
              <Lock className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border bg-card/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
              <BarChart3 className="h-3 w-3" /> Strategy Available
            </div>
            <div className="text-lg font-bold" data-testid="text-strategy-balance">$0.00</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
              <Users className="h-3 w-3" /> Referral Earnings
            </div>
            <div className="text-lg font-bold" data-testid="text-referral-earnings">$0.00</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
