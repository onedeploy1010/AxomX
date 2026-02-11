import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Lock } from "lucide-react";

export function VaultStats() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card className="border-border bg-card">
        <CardContent className="p-3">
          <div className="text-[10px] text-muted-foreground mb-1">TVL</div>
          <div className="text-lg font-bold" data-testid="text-tvl">1,000,006</div>
        </CardContent>
      </Card>
      <Card className="border-border bg-card">
        <CardContent className="p-3">
          <div className="text-[10px] text-muted-foreground mb-1">Monthly Return</div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-green-400">34.52%</span>
            <Badge className="text-[10px] bg-green-500/15 text-green-400 no-default-hover-elevate no-default-active-elevate">APR</Badge>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border bg-card">
        <CardContent className="p-3">
          <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
            <Clock className="h-3 w-3" /> 24h Yield
          </div>
          <div className="text-lg font-bold">0</div>
        </CardContent>
      </Card>
      <Card className="border-border bg-card">
        <CardContent className="p-3">
          <div className="text-[10px] text-muted-foreground mb-1">Duration</div>
          <div className="text-lg font-bold">12 months</div>
        </CardContent>
      </Card>
      <Card className="border-border bg-card">
        <CardContent className="p-3">
          <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
            <Users className="h-3 w-3" /> Holders
          </div>
          <div className="text-lg font-bold">16,613</div>
        </CardContent>
      </Card>
      <Card className="border-border bg-card">
        <CardContent className="p-3">
          <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
            <Lock className="h-3 w-3" /> Lock-ups
          </div>
          <div className="text-lg font-bold">0</div>
        </CardContent>
      </Card>
    </div>
  );
}
