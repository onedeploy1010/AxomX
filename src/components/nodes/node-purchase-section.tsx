import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Server, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { NODE_PLANS, EARLY_BIRD_DEPOSIT_RATE } from "@/lib/data";
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

type PaymentMode = "FULL" | "EARLY_BIRD";

export function NodePurchaseSection({ walletAddr }: NodePurchaseSectionProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const payment = usePayment();
  const [paymentModes, setPaymentModes] = useState<Record<string, PaymentMode>>({
    MINI: "FULL",
    MAX: "FULL",
  });

  const purchaseMutation = useMutation({
    mutationFn: async ({ nodeType, paymentMode }: { nodeType: string; paymentMode: PaymentMode }) => {
      let txHash: string | undefined;
      if (NODE_CONTRACT_ADDRESS) {
        txHash = await payment.payNodePurchase(nodeType, paymentMode);
      }
      const result = await purchaseNode(walletAddr, nodeType, txHash, paymentMode);
      payment.markSuccess();
      return { result, paymentMode };
    },
    onSuccess: (data) => {
      const isEarlyBird = data.paymentMode === "EARLY_BIRD";
      toast({
        title: t("profile.nodePurchased"),
        description: isEarlyBird ? t("profile.nodeDepositSuccess") : t("profile.nodePurchaseSuccess"),
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

  const toggleMode = (nodeType: string) => {
    setPaymentModes((prev) => ({
      ...prev,
      [nodeType]: prev[nodeType] === "FULL" ? "EARLY_BIRD" : "FULL",
    }));
  };

  const plans = [
    {
      key: "MINI" as const,
      plan: NODE_PLANS.MINI,
      icon: Shield,
      labelKey: "profile.miniNode",
      popular: false,
    },
    {
      key: "MAX" as const,
      plan: NODE_PLANS.MAX,
      icon: Server,
      labelKey: "profile.maxNode",
      popular: true,
    },
  ];

  return (
    <div className="space-y-3">
      {plans.map(({ key, plan, icon: Icon, labelKey, popular }) => {
        const mode = paymentModes[key];
        const isEarlyBird = mode === "EARLY_BIRD";
        const chargeAmount = isEarlyBird ? plan.price * EARLY_BIRD_DEPOSIT_RATE : plan.price;

        return (
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
                <span className="text-xl font-bold text-primary">${plan.price.toLocaleString()}</span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                  <span>{t("strategy.assetPackage")}: ${plan.assetPackage.toLocaleString()} USDC</span>
                </div>
                <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                  <span>{t("strategy.dailyYieldAmount")}: {plan.dailyYield} USDC ({(plan.dailyRate * 100).toFixed(1)}%)</span>
                </div>
                <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                  <span>{t("profile.duration", { days: plan.durationDays })}</span>
                </div>
                {key === "MAX" && (
                  <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                    <span>{t("profile.revenuePool")}</span>
                  </div>
                )}
              </div>

              {/* Payment mode toggle */}
              <div className="flex gap-2">
                <button
                  className={`flex-1 text-[12px] py-1.5 px-2 rounded-md border transition-colors ${
                    !isEarlyBird
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                  onClick={() => setPaymentModes((prev) => ({ ...prev, [key]: "FULL" }))}
                >
                  {t("profile.fullPayment")}
                </button>
                <button
                  className={`flex-1 text-[12px] py-1.5 px-2 rounded-md border transition-colors ${
                    isEarlyBird
                      ? "border-yellow-500 bg-yellow-500/10 text-yellow-400 font-medium"
                      : "border-border text-muted-foreground hover:border-yellow-500/30"
                  }`}
                  onClick={() => setPaymentModes((prev) => ({ ...prev, [key]: "EARLY_BIRD" }))}
                >
                  {t("profile.earlyBirdDeposit")}
                </button>
              </div>

              {isEarlyBird && (
                <div className="rounded-md bg-yellow-500/10 border border-yellow-500/20 p-2.5 space-y-1">
                  <div className="text-[12px] text-yellow-400">{t("profile.earlyBirdDesc")}</div>
                  <div className="flex items-center gap-1 text-[11px] text-yellow-500/80">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    {t("profile.earlyBirdWarning")}
                  </div>
                  <div className="text-[12px] font-semibold text-yellow-400">
                    {t("profile.depositAmount")}: ${chargeAmount.toLocaleString()}
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                onClick={() => purchaseMutation.mutate({ nodeType: key, paymentMode: mode })}
                disabled={purchaseMutation.isPending}
              >
                {purchaseMutation.isPending ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    {getPaymentStatusLabel(payment.status) || t("common.processing")}
                  </>
                ) : isEarlyBird ? (
                  `${t("profile.purchaseNodeDeposit")} — $${chargeAmount.toLocaleString()}`
                ) : (
                  `${t("profile.purchaseNodeFull")} — $${plan.price.toLocaleString()}`
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
