import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, Award, Sparkles } from "lucide-react";

export function NodeSection() {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold">My Node</h3>
        <Sparkles className="h-4 w-4 text-primary" />
      </div>
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold" data-testid="text-node-status">0/0 Day</div>
            <Button size="sm" data-testid="button-apply-node">
              <Award className="mr-1 h-3 w-3" /> Apply
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <Card className="border-border bg-card hover-elevate">
          <CardContent className="p-4 flex flex-col items-center gap-2">
            <Users className="h-6 w-6 text-muted-foreground" />
            <span className="text-xs font-medium">My Referrals</span>
          </CardContent>
        </Card>
        <Card className="border-border bg-card hover-elevate">
          <CardContent className="p-4 flex flex-col items-center gap-2">
            <Shield className="h-6 w-6 text-muted-foreground" />
            <span className="text-xs font-medium">Node Details</span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
