import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Lock } from "lucide-react";
import { VaultChart } from "@/components/vault/vault-chart";
import { VaultStats } from "@/components/vault/vault-stats";
import { VaultPlans } from "@/components/vault/vault-plans";

export default function Vault() {
  return (
    <div className="space-y-4 pb-20">
      <VaultChart />

      <div className="px-4">
        <h3 className="text-base font-bold mb-3">Vault Details</h3>
        <VaultStats />
      </div>

      <div className="px-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[10px] text-muted-foreground">Your Position</div>
                <div className="text-xl font-bold" data-testid="text-my-position">0</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Your Yield</div>
                <div className="text-xl font-bold">0/0</div>
              </div>
            </div>
            <Button variant="secondary" className="w-full" data-testid="button-claim">
              <Lock className="mr-2 h-4 w-4" /> Claim Yield
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="px-4">
        <VaultPlans />
      </div>

      <div className="px-4">
        <h3 className="text-sm font-bold mb-3">Positions</h3>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="grid grid-cols-5 text-[10px] text-muted-foreground mb-2 font-medium">
              <span>Amount</span>
              <span>Start</span>
              <span>Lock</span>
              <span>Remaining</span>
              <span>Action</span>
            </div>
            <div className="text-center py-6 text-sm text-muted-foreground">No positions yet</div>
          </CardContent>
        </Card>
      </div>

      <div className="px-4">
        <Tabs defaultValue="deposit">
          <TabsList className="w-full bg-card border border-border">
            <TabsTrigger value="deposit" className="flex-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw" className="flex-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Withdraw</TabsTrigger>
            <TabsTrigger value="yield" className="flex-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Yield</TabsTrigger>
          </TabsList>
          <TabsContent value="deposit" className="mt-3">
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="grid grid-cols-5 text-[10px] text-muted-foreground mb-2 font-medium">
                  <span>Token</span><span>Amount</span><span>TXID</span><span>Status</span><span>Date</span>
                </div>
                <div className="text-center py-6 text-sm text-muted-foreground">No records</div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="withdraw" className="mt-3">
            <Card className="border-border bg-card">
              <CardContent className="p-4 text-center py-6 text-sm text-muted-foreground">No records</CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="yield" className="mt-3">
            <Card className="border-border bg-card">
              <CardContent className="p-4 text-center py-6 text-sm text-muted-foreground">No records</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md px-4 py-3">
        <div className="mx-auto max-w-lg flex gap-3">
          <Button variant="secondary" className="flex-1" data-testid="button-deposit-vault">Deposit to Vault</Button>
          <Button variant="secondary" className="flex-1" data-testid="button-redeem-vault">Redeem from Vault</Button>
        </div>
      </div>
    </div>
  );
}
