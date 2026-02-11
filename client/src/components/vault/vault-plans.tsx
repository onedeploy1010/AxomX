import { Card, CardContent } from "@/components/ui/card";
import { VAULT_PLANS } from "@/lib/constants";

export function VaultPlans() {
  return (
    <div>
      <h3 className="text-sm font-bold mb-3">Vault Plans</h3>
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(VAULT_PLANS).map(([key, plan]) => (
          <Card key={key} className="border-border bg-card hover-elevate" data-testid={`vault-plan-${key}`}>
            <CardContent className="p-3 text-center">
              <div className="text-sm font-bold text-primary mb-1">{plan.label}</div>
              <div className="text-xs text-muted-foreground mb-1">Daily: {(plan.dailyRate * 100).toFixed(1)}%</div>
              <div className="text-xs font-medium text-green-400">{plan.apr} APR</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
