import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Server, CheckCircle2, Loader2, AlertTriangle, Lock, Coins } from "lucide-react";
import { NODE_PLANS, NODE_MILESTONES } from "@/lib/data";
import { usePayment, getPaymentStatusLabel } from "@/hooks/use-payment";
import { purchaseNode } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { NODE_CONTRACT_ADDRESS } from "@/lib/contracts";
import { useTranslation } from "react-i18next";

interface NodePurchaseSectionProps {
  walletAddr: string;
}

export function NodePurchaseSection({ walletAddr }: NodePurchaseSectionProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const payment = usePayment();

  const purchaseMutation = useMutation({
    mutationFn: async ({ nodeType }: { nodeType: string }) => {
      let txHash: string | undefined;
      if (NODE_CONTRACT_ADDRESS) {
        txHash = await payment.payNodePurchase(nodeType, "FULL");
      }
      const result = await purchaseNode(walletAddr, nodeType, txHash, "FULL");
      payment.markSuccess();
      return result;
    },
    onSuccess: () => {
      toast({
        title: t("profile.nodePurchased"),
        description: t("profile.nodePurchaseSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: ["node-overview", walletAddr] });
      queryClient.invalidateQueries({ queryKey: ["profile", walletAddr] });
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

  const plans = [
    {
      key: "MAX" as const,
      plan: NODE_PLANS.MAX,
      milestones: NODE_MILESTONES.MAX,
      icon: Server,
      labelKey: "profile.applyLargeNode",
      popular: true,
    },
    {
      key: "MINI" as const,
      plan: NODE_PLANS.MINI,
      milestones: NODE_MILESTONES.MINI,
      icon: Shield,
      labelKey: "profile.applySmallNode",
      popular: false,
    },
  ];

  return (
    <div className="space-y-3">
      {plans.map(({ key, plan, milestones, icon: Icon, labelKey, popular }) => (
        <Card key={key} className={`border-border bg-card ${popular ? "glow-green-sm" : ""}`}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <Icon className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm font-bold">{t(labelKey)}</span>
                {popular && (
                  <Badge className="text-[11px] bg-primary/20 text-primary no-default-hover-elevate no-default-active-elevate">
                    {t("profile.popular")}
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <Coins className="h-3 w-3 text-primary shrink-0" />
                <span>{t("profile.contribution")}: ${plan.price} (10% {t("profile.nonRefundable")})</span>
              </div>
              <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <Lock className="h-3 w-3 text-primary shrink-0" />
                <span>{t("profile.frozenFunds")}: ${plan.frozenAmount.toLocaleString()} USDC</span>
              </div>
              <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                <span>{t("profile.dailyEarnings")}: {(plan.dailyRate * 100).toFixed(1)}% ({t("profile.mintedAsMA")})</span>
              </div>
              <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                <span>{t("profile.duration", { days: plan.durationDays })}</span>
              </div>
            </div>

            <div className="rounded-md bg-muted/30 border border-border p-2.5 space-y-1">
              <div className="text-[12px] font-medium text-foreground mb-1">{t("profile.milestoneSchedule")}:</div>
              {milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="text-primary font-medium">{t("profile.dayN", { n: m.days })}</span>
                  <span>→ {m.rank}</span>
                  <span className="text-muted-foreground/70">({m.desc})</span>
                </div>
              ))}
            </div>

            <div className="rounded-md bg-yellow-500/10 border border-yellow-500/20 p-2.5 space-y-1">
              <div className="flex items-center gap-1 text-[11px] text-yellow-500/80">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                {t("profile.nodeFailureWarning")}
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => purchaseMutation.mutate({ nodeType: key })}
              disabled={purchaseMutation.isPending}
            >
              {purchaseMutation.isPending ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  {getPaymentStatusLabel(payment.status) || t("common.processing")}
                </>
              ) : (
                `${t(labelKey)} — $${plan.price}`
              )}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
