import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Shield, Server, Loader2, AlertTriangle, Lock, Coins, CheckCircle2, XCircle, ChevronRight, Landmark, GitBranch } from "lucide-react";
import { NODE_PLANS, NODE_MILESTONES } from "@/lib/data";
import { usePayment, getPaymentStatusLabel } from "@/hooks/use-payment";
import { purchaseNode, getNodeMilestoneRequirements } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { NODE_CONTRACT_ADDRESS } from "@/lib/contracts";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";

interface NodePurchaseSectionProps {
  walletAddr: string;
}

const MAX_PURCHASABLE_MILESTONES = NODE_MILESTONES.MAX.filter(m => m.rank !== "V1");

export function NodePurchaseSection({ walletAddr }: NodePurchaseSectionProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const payment = usePayment();
  const [, navigate] = useLocation();
  const [selectedMaxRank, setSelectedMaxRank] = useState<string | null>(null);
  const [showRequirementDialog, setShowRequirementDialog] = useState(false);
  const [requirementResult, setRequirementResult] = useState<{
    rank: string;
    holdingRequired: number;
    referralsRequired: number;
    holdingOk: boolean;
    referralsOk: boolean;
    currentHolding: number;
    currentReferrals: number;
  } | null>(null);

  const { data: requirements } = useQuery<{ vaultDeposited: number; directNodeReferrals: number }>({
    queryKey: ["node-milestone-requirements", walletAddr],
    queryFn: () => getNodeMilestoneRequirements(walletAddr),
    enabled: !!walletAddr,
  });

  const vaultDeposited = requirements?.vaultDeposited ?? 0;
  const directNodeReferrals = requirements?.directNodeReferrals ?? 0;

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
      queryClient.invalidateQueries({ queryKey: ["node-milestone-requirements", walletAddr] });
      payment.reset();
      setSelectedMaxRank(null);
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

  const handleMaxRankSelect = (rank: string) => {
    const milestone = MAX_PURCHASABLE_MILESTONES.find(m => m.rank === rank);
    if (!milestone) return;

    const holdingOk = vaultDeposited >= milestone.requiredHolding;
    const referralsOk = milestone.requiredReferrals === 0 || directNodeReferrals >= milestone.requiredReferrals;

    if (!holdingOk || !referralsOk) {
      setRequirementResult({
        rank,
        holdingRequired: milestone.requiredHolding,
        referralsRequired: milestone.requiredReferrals,
        holdingOk,
        referralsOk,
        currentHolding: vaultDeposited,
        currentReferrals: directNodeReferrals,
      });
      setShowRequirementDialog(true);
    } else {
      setSelectedMaxRank(rank);
    }
  };

  const handleMaxPurchase = () => {
    if (!selectedMaxRank) return;
    purchaseMutation.mutate({ nodeType: "MAX" });
  };

  const miniPlan = NODE_PLANS.MINI;
  const maxPlan = NODE_PLANS.MAX;

  return (
    <div className="space-y-3">
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.35)", boxShadow: "0 2px 12px rgba(0,0,0,0.3)" }}
      >
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Server className="h-5 w-5 text-primary" />
            <span className="text-[15px] font-bold text-white">{t("profile.applyLargeNode")}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold text-primary" style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.2)" }}>
              {t("profile.popular")}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-white/50 mb-4">
            <div className="flex items-center gap-1.5">
              <Coins className="h-3 w-3 text-primary shrink-0" />
              <span>{t("profile.contribution")}: ${maxPlan.price}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="h-3 w-3 text-primary shrink-0" />
              <span>{t("profile.frozenFunds")}: ${maxPlan.frozenAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="text-[11px] text-white/40 font-medium mb-2">{t("profile.selectRankLevel")}</div>
          <div className="space-y-2">
            {MAX_PURCHASABLE_MILESTONES.map((ms) => {
              const holdingOk = vaultDeposited >= ms.requiredHolding;
              const referralsOk = ms.requiredReferrals === 0 || directNodeReferrals >= ms.requiredReferrals;
              const allOk = holdingOk && referralsOk;
              const isSelected = selectedMaxRank === ms.rank;

              return (
                <button
                  key={ms.rank}
                  className="w-full rounded-xl p-3 flex items-center gap-3 text-left transition-all active:scale-[0.98]"
                  style={{
                    background: isSelected ? "rgba(74,222,128,0.08)" : "#1c1c1c",
                    border: isSelected
                      ? "1px solid rgba(74,222,128,0.5)"
                      : allOk
                      ? "1px solid rgba(255,255,255,0.1)"
                      : "1px solid rgba(255,255,255,0.06)",
                  }}
                  onClick={() => handleMaxRankSelect(ms.rank)}
                  disabled={purchaseMutation.isPending}
                >
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 text-[12px] font-black"
                    style={{
                      background: allOk
                        ? "linear-gradient(135deg, rgba(74,222,128,0.2), rgba(74,222,128,0.08))"
                        : "rgba(255,255,255,0.05)",
                      border: allOk
                        ? "1px solid rgba(74,222,128,0.3)"
                        : "1px solid rgba(255,255,255,0.08)",
                      color: allOk ? "#4ade80" : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {ms.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-white/90">{ms.desc}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {ms.requiredHolding > 0 && (
                        <span className={`text-[10px] flex items-center gap-0.5 ${holdingOk ? "text-green-400" : "text-red-400"}`}>
                          {holdingOk ? <CheckCircle2 className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
                          {vaultDeposited.toFixed(0)}/{ms.requiredHolding}U
                        </span>
                      )}
                      {ms.requiredReferrals > 0 && (
                        <span className={`text-[10px] flex items-center gap-0.5 ${referralsOk ? "text-green-400" : "text-red-400"}`}>
                          {referralsOk ? <CheckCircle2 className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
                          {directNodeReferrals}/{ms.requiredReferrals} {t("profile.referralsShort")}
                        </span>
                      )}
                      {allOk && (
                        <span className="text-[10px] text-green-400 font-medium">{t("profile.qualified")}</span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {isSelected ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-white/20" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedMaxRank && (
            <Button
              className="w-full mt-3 rounded-xl h-10"
              onClick={handleMaxPurchase}
              disabled={purchaseMutation.isPending}
            >
              {purchaseMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  {getPaymentStatusLabel(payment.status) || t("common.processing")}
                </>
              ) : (
                `${t("profile.applyLargeNode")} ${selectedMaxRank} — $${maxPlan.price}`
              )}
            </Button>
          )}
        </div>
      </div>

      <div
        className="rounded-2xl p-4"
        style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.35)", boxShadow: "0 2px 12px rgba(0,0,0,0.3)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-5 w-5 text-white/60" />
          <span className="text-[15px] font-bold text-white">{t("profile.applySmallNode")}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px] text-white/50 mb-3">
          <div className="flex items-center gap-1.5">
            <Coins className="h-3 w-3 text-primary shrink-0" />
            <span>{t("profile.contribution")}: ${miniPlan.price}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="h-3 w-3 text-primary shrink-0" />
            <span>{t("profile.frozenFunds")}: ${miniPlan.frozenAmount.toLocaleString()}</span>
          </div>
        </div>
        <div className="rounded-lg p-2 mb-3" style={{ background: "#1c1c1c" }}>
          <div className="text-[10px] text-white/40 font-medium mb-1">{t("profile.milestoneSchedule")}:</div>
          {NODE_MILESTONES.MINI.map((m, i) => (
            <div key={i} className="text-[10px] text-white/50">
              {t("profile.dayN", { n: m.days })} → {m.rank} ({m.desc})
            </div>
          ))}
        </div>
        <Button
          className="w-full rounded-xl h-10"
          variant="outline"
          onClick={() => purchaseMutation.mutate({ nodeType: "MINI" })}
          disabled={purchaseMutation.isPending}
        >
          {purchaseMutation.isPending ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              {getPaymentStatusLabel(payment.status) || t("common.processing")}
            </>
          ) : (
            `${t("profile.applySmallNode")} — $${miniPlan.price}`
          )}
        </Button>
      </div>

      <Dialog open={showRequirementDialog} onOpenChange={setShowRequirementDialog}>
        <DialogContent className="max-w-sm" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.2)" }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[15px]">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              {t("profile.requirementNotMet")}
            </DialogTitle>
            <DialogDescription className="text-[12px] text-white/40">
              {t("profile.requirementNotMetDesc", { rank: requirementResult?.rank })}
            </DialogDescription>
          </DialogHeader>

          {requirementResult && (
            <div className="space-y-3 py-2">
              {requirementResult.holdingRequired > 0 && (
                <div
                  className="rounded-xl p-3 space-y-1.5"
                  style={{
                    border: requirementResult.holdingOk ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(239,68,68,0.3)",
                    background: "#161616",
                  }}
                >
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-white/60">{t("profile.holdingRequired")}</span>
                    <span className="font-bold text-white/90">{requirementResult.holdingRequired} USDC</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-white/60">{t("profile.currentHolding")}</span>
                    <span className={requirementResult.holdingOk ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                      {requirementResult.currentHolding.toFixed(0)} USDC
                    </span>
                  </div>
                  {!requirementResult.holdingOk && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-2.5 w-2.5 text-yellow-400" />
                      <span className="text-[10px] text-yellow-400/80">{t("profile.depositToMeet")}</span>
                    </div>
                  )}
                </div>
              )}

              {requirementResult.referralsRequired > 0 && (
                <div
                  className="rounded-xl p-3 space-y-1.5"
                  style={{
                    border: requirementResult.referralsOk ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(239,68,68,0.3)",
                    background: "#161616",
                  }}
                >
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-white/60">{t("profile.directNodeRequired")}</span>
                    <span className="font-bold text-white/90">{requirementResult.referralsRequired}</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-white/60">{t("profile.currentDirectNodes")}</span>
                    <span className={requirementResult.referralsOk ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                      {requirementResult.currentReferrals}/{requirementResult.referralsRequired}
                    </span>
                  </div>
                  {!requirementResult.referralsOk && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-2.5 w-2.5 text-yellow-400" />
                      <span className="text-[10px] text-yellow-400/80">{t("profile.referralToMeet")}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-[12px] rounded-xl"
              onClick={() => setShowRequirementDialog(false)}
            >
              {t("common.cancel")}
            </Button>
            {requirementResult && !requirementResult.holdingOk && (
              <Button
                size="sm"
                className="flex-1 text-[12px] rounded-xl"
                onClick={() => {
                  setShowRequirementDialog(false);
                  navigate("/vault");
                }}
              >
                <Landmark className="mr-1 h-3 w-3" />
                {t("profile.goToVault")}
              </Button>
            )}
            {requirementResult && requirementResult.holdingOk && !requirementResult.referralsOk && (
              <Button
                size="sm"
                className="flex-1 text-[12px] rounded-xl"
                onClick={() => {
                  setShowRequirementDialog(false);
                  navigate("/profile/referral");
                }}
              >
                <GitBranch className="mr-1 h-3 w-3" />
                {t("profile.inviteFriends")}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
