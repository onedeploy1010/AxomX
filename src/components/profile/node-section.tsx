import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useActiveAccount } from "thirdweb/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getProfile, getNodeMembership, purchaseNode } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePayment, getPaymentStatusLabel } from "@/hooks/use-payment";
import { NODE_CONTRACT_ADDRESS } from "@/lib/contracts";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Zap, Server, CheckCircle2, Loader2 } from "lucide-react";
import type { NodeMembership, Profile } from "@shared/types";
import { NODE_PLANS } from "@/lib/data";
import { useTranslation } from "react-i18next";

export function NodeSection() {
  const { t } = useTranslation();
  const account = useActiveAccount();
  const { toast } = useToast();
  const walletAddr = account?.address || "";
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: profile } = useQuery<Profile>({
    queryKey: ["profile", walletAddr],
    queryFn: () => getProfile(walletAddr),
    enabled: !!walletAddr,
  });

  const { data: membership, isLoading } = useQuery<NodeMembership | null>({
    queryKey: ["node-membership", walletAddr],
    queryFn: () => getNodeMembership(walletAddr),
    enabled: !!walletAddr,
  });

  const payment = usePayment();

  const purchaseMutation = useMutation({
    mutationFn: async (nodeType: string) => {
      // Step 1: On-chain USDC payment (if node contract is deployed)
      let txHash: string | undefined;
      if (NODE_CONTRACT_ADDRESS) {
        txHash = await payment.payNodePurchase(nodeType);
      }
      // Step 2: Record to database
      const result = await purchaseNode(walletAddr, nodeType, txHash);
      payment.markSuccess();
      return result;
    },
    onSuccess: () => {
      toast({ title: t("profile.nodePurchased"), description: t("profile.nodePurchasedDesc") });
      queryClient.invalidateQueries({ queryKey: ["node-membership", walletAddr] });
      queryClient.invalidateQueries({ queryKey: ["profile", walletAddr] });
      setDialogOpen(false);
      payment.reset();
    },
    onError: (err: Error) => {
      const failedTxHash = payment.txHash;
      const desc = failedTxHash
        ? `${err.message}\n\nOn-chain tx: ${failedTxHash}\nPlease contact support.`
        : err.message;
      toast({ title: "Error", description: desc, variant: "destructive" });
      payment.reset();
    },
  });

  const currentNode = profile?.nodeType || "NONE";

  return (
    <div style={{ animation: "fadeSlideIn 0.4s ease-out 0.2s both" }}>
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <h3 className="text-sm font-bold">{t("profile.nodeMembership")}</h3>
        {currentNode !== "NONE" && (
          <Badge className="text-[10px] no-default-hover-elevate no-default-active-elevate" data-testid="badge-current-node">
            {currentNode} {t("common.node")}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-16 w-full rounded-md" />
      ) : membership && currentNode !== "NONE" ? (
        <Card className="border-border bg-card glow-green-sm" data-testid="card-active-node">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Server className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold">{currentNode} {t("common.node")}</div>
                <div className="text-[10px] text-muted-foreground">
                  {t("profile.activeNodeStatus", { status: membership.status, price: Number(membership.price).toFixed(0) })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border bg-card" data-testid="card-node-upgrade">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-bold">{t("profile.becomeNodeOperator")}</div>
                  <div className="text-[10px] text-muted-foreground">{t("profile.unlockReferralBonuses")}</div>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setDialogOpen(true)}
                data-testid="button-open-node-dialog"
              >
                <Zap className="mr-1 h-3 w-3" /> {t("profile.viewPlans")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{t("profile.nodeDialog")}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("profile.nodeDialogDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Card className="border-border bg-background" data-testid="card-mini-node">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Shield className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm font-bold">{t("profile.miniNode")}</span>
                  </div>
                  <span className="text-xl font-bold text-primary">${NODE_PLANS.MINI.price.toLocaleString()}</span>
                </div>
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                    <span>{t("profile.referralBonus5")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                    <span>{t("profile.basicStrategies")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                    <span>{t("profile.communityAccess")}</span>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() => purchaseMutation.mutate("MINI")}
                  disabled={purchaseMutation.isPending}
                  data-testid="button-buy-mini"
                >
                  {purchaseMutation.isPending ? (
                    <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> {getPaymentStatusLabel(payment.status) || t("common.processing")}</>
                  ) : t("profile.purchaseMini")}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border bg-background glow-green-sm" data-testid="card-max-node">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Server className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm font-bold">{t("profile.maxNode")}</span>
                    <Badge className="text-[9px] bg-primary/20 text-primary no-default-hover-elevate no-default-active-elevate">{t("profile.popular")}</Badge>
                  </div>
                  <span className="text-xl font-bold text-primary">${NODE_PLANS.MAX.price.toLocaleString()}</span>
                </div>
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                    <span>{t("profile.referralBonus10")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                    <span>{t("profile.allStrategiesUnlocked")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                    <span>{t("profile.prioritySupport")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                    <span>{t("profile.higherVaultYields")}</span>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() => purchaseMutation.mutate("MAX")}
                  disabled={purchaseMutation.isPending}
                  data-testid="button-buy-max"
                >
                  {purchaseMutation.isPending ? (
                    <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> {getPaymentStatusLabel(payment.status) || t("common.processing")}</>
                  ) : t("profile.purchaseMax")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
