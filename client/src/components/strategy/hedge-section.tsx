import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

export function HedgeSection() {
  return (
    <div className="space-y-3">
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Hedge Protection</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Card className="border-border bg-background">
              <CardContent className="p-3">
                <div className="text-[10px] text-muted-foreground mb-1">Estimated Payout</div>
                <div className="text-sm font-bold">0 USDT</div>
              </CardContent>
            </Card>
            <Card className="border-border bg-background">
              <CardContent className="p-3">
                <div className="text-[10px] text-muted-foreground mb-1">Payout Balance</div>
                <div className="text-sm font-bold">0 USDT</div>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Card className="border-border bg-background">
              <CardContent className="p-3">
                <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Current P&L
                </div>
                <div className="text-lg font-bold">0.00%</div>
              </CardContent>
            </Card>
            <Card className="border-border bg-background">
              <CardContent className="p-3">
                <div className="text-[10px] text-muted-foreground mb-1">Purchase Amount</div>
                <div className="text-lg font-bold">0 USDT</div>
              </CardContent>
            </Card>
          </div>
          <Button variant="secondary" className="w-full" data-testid="button-buy-hedge">Purchase Hedge Protection</Button>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Insurance Pool</h3>
          <div className="grid grid-cols-2 gap-3">
            {["Coverage", "Claims", "Paid Out", "Contributors"].map((label) => (
              <Card key={label} className="border-border bg-background">
                <CardContent className="p-3 text-center">
                  <div className="text-lg font-bold text-muted-foreground">--</div>
                  <div className="text-[10px] text-muted-foreground">{label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
