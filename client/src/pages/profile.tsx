import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useActiveAccount } from "thirdweb/react";
import { shortenAddress } from "@/lib/constants";
import { Copy, ChevronRight, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import type { Profile } from "@shared/schema";
import { AssetsOverview } from "@/components/profile/assets-overview";
import { NodeSection } from "@/components/profile/node-section";
import { ReferralCard } from "@/components/profile/referral-card";
import { SettingsList } from "@/components/profile/settings-list";

export default function ProfilePage() {
  const account = useActiveAccount();
  const { toast } = useToast();

  const { data: profile } = useQuery<Profile>({
    queryKey: ["/api/profile", account?.address || ""],
    enabled: !!account?.address,
  });

  const walletAddr = account?.address || "";

  return (
    <div className="space-y-4 pb-20">
      <AssetsOverview />

      {walletAddr && (
        <div className="px-4">
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Connected Wallet</div>
                  <div className="font-mono text-sm font-medium" data-testid="text-wallet-address">
                    {shortenAddress(walletAddr)}
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(walletAddr);
                    toast({ title: "Copied", description: "Address copied" });
                  }}
                  data-testid="button-copy-address"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              {profile && (
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-[10px] no-default-hover-elevate no-default-active-elevate">
                    Rank: {profile.rank}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] no-default-hover-elevate no-default-active-elevate">
                    Node: {profile.nodeType}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="px-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Subscribe to VIP to unlock features</span>
              <Button size="sm" data-testid="button-subscribe-vip">
                <Sparkles className="mr-1 h-3 w-3" /> Subscribe
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-4">
        <NodeSection />
      </div>

      <div className="px-4">
        <ReferralCard refCode={profile?.refCode} />
      </div>

      <div className="px-4">
        <SettingsList />
      </div>

      <div className="px-4 pb-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Total Assets</div>
                <div className="text-2xl font-bold" data-testid="text-total-assets">$0</div>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                All <ChevronRight className="h-3 w-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
