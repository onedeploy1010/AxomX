import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useActiveAccount } from "thirdweb/react";
import { ArrowLeft, ArrowUpRight, Calendar, Disc, Headphones, Info, WalletCards, Coins, Clock, CheckCircle2, XCircle, AlertTriangle, Landmark } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { getNodeOverview, getNodeEarningsRecords, getNodeMemberships, getNodeMilestoneRequirements } from "@/lib/api";
import type { NodeOverview, NodeEarningsRecord, NodeMembership } from "@shared/types";
import { NODE_PLANS, NODE_MILESTONES } from "@/lib/data";
import { useTranslation } from "react-i18next";
import { useMaPrice } from "@/hooks/use-ma-price";

type TabKey = "purchase" | "milestones" | "earnings" | "detail";

function getMilestoneDaysLeft(startDate: string | null, deadlineDays: number): number {
  if (!startDate) return deadlineDays;
  const start = new Date(startDate).getTime();
  const deadline = start + deadlineDays * 24 * 60 * 60 * 1000;
  const now = Date.now();
  return Math.max(0, Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)));
}

export default function ProfileNodesPage() {
  const { t } = useTranslation();
  const account = useActiveAccount();
  const [, navigate] = useLocation();
  const walletAddr = account?.address || "";
  const isConnected = !!walletAddr;
  const [activeTab, setActiveTab] = useState<TabKey>("milestones");
  const { formatMA, formatCompactMA } = useMaPrice();
  const [showRequirementDialog, setShowRequirementDialog] = useState(false);
  const [requirementDialogData, setRequirementDialogData] = useState<{
    rank: string;
    holdingRequired: number;
    referralsRequired: number;
    currentHolding: number;
    currentReferrals: number;
  } | null>(null);

  const { data: overview, isLoading } = useQuery<NodeOverview>({
    queryKey: ["node-overview", walletAddr],
    queryFn: () => getNodeOverview(walletAddr),
    enabled: isConnected,
  });

  const { data: earningsRecords = [] } = useQuery<NodeEarningsRecord[]>({
    queryKey: ["node-earnings", walletAddr],
    queryFn: () => getNodeEarningsRecords(walletAddr),
    enabled: isConnected,
  });

  const { data: allMemberships = [] } = useQuery<NodeMembership[]>({
    queryKey: ["node-memberships", walletAddr],
    queryFn: () => getNodeMemberships(walletAddr),
    enabled: isConnected,
  });

  const { data: requirements } = useQuery<{ vaultDeposited: number; directNodeReferrals: number }>({
    queryKey: ["node-milestone-requirements", walletAddr],
    queryFn: () => getNodeMilestoneRequirements(walletAddr),
    enabled: isConnected,
  });

  const vaultDeposited = requirements?.vaultDeposited ?? 0;
  const directNodeReferrals = requirements?.directNodeReferrals ?? 0;

  const nodes = overview?.nodes ?? [];
  const activeNodes = nodes.filter((n) => n.status === "ACTIVE" || n.status === "PENDING_MILESTONES");
  const activeCount = activeNodes.length;
  const totalEarnings = Number(overview?.rewards?.totalEarnings || 0);
  const releasedEarnings = Number(overview?.releasedEarnings || overview?.rewards?.fixedYield || 0);
  const availableBalance = Number(overview?.availableBalance || 0);
  const lockedEarnings = Number(overview?.lockedEarnings || 0);

  const firstNode = activeNodes.length > 0 ? activeNodes[0] : null;
  const daysActive = firstNode?.startDate
    ? Math.floor((Date.now() - new Date(firstNode.startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const nodeType = (firstNode?.nodeType || "MINI") as keyof typeof NODE_PLANS;
  const totalDays = firstNode ? (NODE_PLANS[nodeType]?.durationDays || 0) : 0;
  const milestones = NODE_MILESTONES[nodeType] || [];

  const currentRank = overview?.rank || "V0";
  const rankIndex = currentRank === "V0" ? 0 : parseInt(currentRank.replace("V", "")) || 0;
  const levelProgress = Math.min((rankIndex / 7) * 100, 100);

  const releaseStatus = activeNodes.length > 0
    ? activeNodes.some((n) => n.status === "ACTIVE") ? t("profile.releasing") : t("profile.pending")
    : "--";

  const formatDate = (d: string | null) => {
    if (!d) return "--";
    return new Date(d).toLocaleDateString();
  };

  const handleMilestoneClick = (milestone: typeof milestones[number]) => {
    if (nodeType !== "MAX") return;
    const holdingOk = vaultDeposited >= milestone.requiredHolding;
    const referralsOk = milestone.requiredReferrals === 0 || directNodeReferrals >= milestone.requiredReferrals;
    if (!holdingOk || !referralsOk) {
      setRequirementDialogData({
        rank: milestone.rank,
        holdingRequired: milestone.requiredHolding,
        referralsRequired: milestone.requiredReferrals,
        currentHolding: vaultDeposited,
        currentReferrals: directNodeReferrals,
      });
      setShowRequirementDialog(true);
    }
  };

  const cardBorder = "1px solid rgba(74, 222, 128, 0.15)";
  const cardBg = "rgba(10, 15, 10, 0.6)";

  return (
    <div className="min-h-screen pb-24" style={{ background: "#0a0a0a" }} data-testid="page-profile-nodes">
      <div className="px-4 pt-3 pb-4">
        <div className="flex items-center justify-center relative mb-6">
          <button
            onClick={() => navigate("/profile")}
            className="absolute left-0 w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-white/80" />
          </button>
          <h1 className="text-[17px] font-bold tracking-wide">{t("profile.nodeDetailsTitle")}</h1>
        </div>

        <div className="space-y-3 mb-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-white/50">
              {currentRank} ({t("profile.realLevel")})
            </span>
            <span className="text-[13px] font-bold text-white/90">{currentRank}</span>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.max(levelProgress, 3)}%`,
                background: "linear-gradient(90deg, #22c55e, #84cc16, #eab308)",
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-white/90">{t("profile.myNodesLabel")}</span>
              <span className="text-[13px] text-white/60">🟡 {activeCount}/{totalDays || 0}Day</span>
            </div>
            <Info className="h-4 w-4 text-white/30" />
          </div>
        </div>
      </div>

      {!isConnected ? (
        <div className="px-4">
          <div className="rounded-2xl p-8 text-center" style={{ border: cardBorder, background: cardBg }}>
            <WalletCards className="h-8 w-8 text-white/30 mx-auto mb-3" />
            <p className="text-sm text-white/40">{t("profile.connectToViewNodes")}</p>
          </div>
        </div>
      ) : isLoading ? (
        <div className="px-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="px-4 space-y-4">
            <div className="rounded-2xl p-4 space-y-4" style={{ border: cardBorder, background: cardBg }}>
              <div className="grid grid-cols-2 gap-3">
                <button
                  className="rounded-full py-2.5 px-4 flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                  style={{ border: "1px solid rgba(74, 222, 128, 0.3)", background: "rgba(74, 222, 128, 0.06)" }}
                  onClick={() => navigate("/profile/nodes")}
                >
                  <span className="text-[13px] font-bold text-white/90">{t("profile.applyLargeNode")}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-primary/70" />
                </button>
                <button
                  className="rounded-full py-2.5 px-4 flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                  style={{ border: "1px solid rgba(74, 222, 128, 0.3)", background: "rgba(74, 222, 128, 0.06)" }}
                  onClick={() => navigate("/profile/nodes")}
                >
                  <span className="text-[13px] font-bold text-white/90">{t("profile.applySmallNode")}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-primary/70" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center -mt-1">
                <span className="text-[11px] text-white/35">{t("profile.contribution")} {NODE_PLANS.MAX.price} USDC</span>
                <span className="text-[11px] text-white/35">{t("profile.contribution")} {NODE_PLANS.MINI.price} USDC</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div
                  className="rounded-xl p-4 text-center space-y-2"
                  style={{ border: cardBorder, background: "rgba(5,10,5,0.5)" }}
                >
                  <div className="text-[12px] text-white/45 font-medium">{t("profile.nodeTotalAmount")} 🔊</div>
                  <Coins className="h-6 w-6 mx-auto text-white/70" />
                  <div className="text-lg font-bold text-primary">{formatCompactMA(totalEarnings)}</div>
                </div>
                <div
                  className="rounded-xl p-4 text-center space-y-2"
                  style={{ border: cardBorder, background: "rgba(5,10,5,0.5)" }}
                >
                  <div className="text-[12px] text-white/45 font-medium">{t("profile.releaseDays")}</div>
                  <Calendar className="h-6 w-6 mx-auto text-white/70" />
                  <div className="text-lg font-bold text-white/90">{daysActive}/{totalDays || 0}Day</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div
                  className="rounded-xl p-4 text-center space-y-2"
                  style={{ border: cardBorder, background: "rgba(5,10,5,0.5)" }}
                >
                  <div className="text-[12px] text-white/45 font-medium">{t("profile.releasedEarnings")}</div>
                  <Coins className="h-6 w-6 mx-auto text-white/70" />
                  <div className="text-lg font-bold text-primary">{formatCompactMA(releasedEarnings)}</div>
                </div>
                <div
                  className="rounded-xl p-4 text-center space-y-2"
                  style={{ border: cardBorder, background: "rgba(5,10,5,0.5)" }}
                >
                  <div className="text-[12px] text-white/45 font-medium">{t("profile.releaseStatus")}</div>
                  <Disc className="h-6 w-6 mx-auto text-white/70" />
                  <div className="text-lg font-bold text-white/90">{releaseStatus}</div>
                </div>
              </div>

              <div
                className="rounded-xl px-4 py-3 flex items-center justify-between"
                style={{ border: cardBorder, background: "rgba(5,10,5,0.5)" }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-white/50">{t("profile.availableBalance")}:</span>
                  <span className="text-[13px] font-bold text-white/90">{formatCompactMA(availableBalance)}/{formatCompactMA(lockedEarnings)}</span>
                  <Headphones className="h-3.5 w-3.5 text-white/30" />
                </div>
                <button
                  className="text-[12px] rounded-md px-3 py-1 text-white/50 transition-colors hover:text-white/80"
                  style={{ border: "1px solid rgba(255,255,255,0.15)" }}
                >
                  {t("profile.withdrawBtn")}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {([
                { key: "milestones" as TabKey, label: t("profile.milestoneCountdown") },
                { key: "purchase" as TabKey, label: t("profile.purchaseRecords") },
                { key: "earnings" as TabKey, label: t("profile.earningsDetailTab") },
                { key: "detail" as TabKey, label: t("profile.myDetailTab") },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  className="py-2 rounded-lg text-[12px] font-medium transition-all text-center"
                  style={{
                    border: activeTab === tab.key
                      ? "1px solid rgba(74, 222, 128, 0.5)"
                      : "1px solid rgba(255,255,255,0.1)",
                    color: activeTab === tab.key ? "#4ade80" : "rgba(255,255,255,0.4)",
                    background: activeTab === tab.key ? "rgba(74, 222, 128, 0.08)" : "transparent",
                  }}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "milestones" && (
              <div className="space-y-3">
                {activeNodes.length === 0 ? (
                  <div className="text-center py-16 text-white/25 text-[14px] italic">
                    {t("profile.noData")}
                  </div>
                ) : (
                  milestones.map((ms, idx) => {
                    const daysLeft = getMilestoneDaysLeft(firstNode?.startDate ?? null, ms.days);
                    const dbMilestone = firstNode?.milestones?.find((m: any) => m.requiredRank === ms.rank) ?? firstNode?.milestones?.[idx];
                    const isAchieved = dbMilestone?.status === "ACHIEVED";
                    const isFailed = dbMilestone?.status === "FAILED";
                    const isExpired = !isAchieved && daysLeft === 0;
                    const prevMs = idx > 0 ? milestones[idx - 1] : null;
                    const prevDbMilestone = prevMs ? (firstNode?.milestones?.find((m: any) => m.requiredRank === prevMs.rank) ?? firstNode?.milestones?.[idx - 1]) : null;
                    const isCurrent = !isAchieved && !isFailed && !isExpired && (idx === 0 || prevDbMilestone?.status === "ACHIEVED");

                    const holdingOk = nodeType === "MAX" ? vaultDeposited >= ms.requiredHolding : true;
                    const referralsOk = ms.requiredReferrals === 0 || directNodeReferrals >= ms.requiredReferrals;
                    const requirementsMet = holdingOk && referralsOk;
                    const hasRequirements = ms.requiredHolding > 0 || ms.requiredReferrals > 0;

                    return (
                      <div
                        key={ms.rank}
                        className="rounded-xl p-4 space-y-3 transition-all"
                        style={{
                          border: isAchieved
                            ? "1px solid rgba(74, 222, 128, 0.4)"
                            : isCurrent
                            ? "1px solid rgba(234, 179, 8, 0.4)"
                            : isFailed || isExpired
                            ? "1px solid rgba(239, 68, 68, 0.3)"
                            : cardBorder,
                          background: isAchieved
                            ? "rgba(74, 222, 128, 0.05)"
                            : isCurrent
                            ? "rgba(234, 179, 8, 0.05)"
                            : cardBg,
                        }}
                        onClick={() => isCurrent && hasRequirements && !requirementsMet && handleMilestoneClick(ms)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isAchieved ? (
                              <CheckCircle2 className="h-4 w-4 text-green-400" />
                            ) : isFailed || isExpired ? (
                              <XCircle className="h-4 w-4 text-red-400" />
                            ) : isCurrent ? (
                              <Clock className="h-4 w-4 text-yellow-400 animate-pulse" />
                            ) : (
                              <Clock className="h-4 w-4 text-white/20" />
                            )}
                            <span className="text-[14px] font-bold text-white/90">{ms.rank}</span>
                            {ms.unlocks === "earnings" && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{t("profile.unlockEarnings")}</span>
                            )}
                            {ms.unlocks === "earnings_and_package" && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{t("profile.unlockAll")}</span>
                            )}
                          </div>
                          <div className="text-right">
                            {isAchieved ? (
                              <span className="text-[11px] text-green-400 font-medium">{t("profile.achieved")}</span>
                            ) : isFailed || isExpired ? (
                              <span className="text-[11px] text-red-400 font-medium">{t("profile.expired")}</span>
                            ) : (
                              <span className="text-[13px] font-bold text-yellow-400">{daysLeft}{t("profile.daysLeft")}</span>
                            )}
                          </div>
                        </div>

                        <div className="text-[11px] text-white/40">{ms.desc}</div>

                        {!isAchieved && !isFailed && hasRequirements && nodeType === "MAX" && (
                          <div className="space-y-1.5">
                            {ms.requiredHolding > 0 && (
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-white/40">{t("profile.holdingRequired")}: {ms.requiredHolding}U</span>
                                <span className={holdingOk ? "text-green-400" : "text-red-400"}>
                                  {vaultDeposited.toFixed(0)}U {holdingOk ? "✓" : "✗"}
                                </span>
                              </div>
                            )}
                            {ms.requiredReferrals > 0 && (
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-white/40">{t("profile.directNodeRequired")}: {ms.requiredReferrals}</span>
                                <span className={referralsOk ? "text-green-400" : "text-red-400"}>
                                  {directNodeReferrals}/{ms.requiredReferrals} {referralsOk ? "✓" : "✗"}
                                </span>
                              </div>
                            )}
                            {!requirementsMet && isCurrent && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <AlertTriangle className="h-3 w-3 text-yellow-400 shrink-0" />
                                <span className="text-[10px] text-yellow-400/80">{t("profile.requirementNotMet")}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {!isAchieved && !isFailed && !isExpired && (
                          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.max(100 - (daysLeft / ms.days) * 100, 3)}%`,
                                background: isCurrent
                                  ? "linear-gradient(90deg, #eab308, #f59e0b)"
                                  : "linear-gradient(90deg, #22c55e, #84cc16)",
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === "purchase" && (
              <div className="space-y-2">
                {allMemberships.length === 0 ? (
                  <div className="text-center py-16 text-white/25 text-[14px] italic">
                    {t("profile.noData")}
                  </div>
                ) : (
                  allMemberships.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-xl p-3 space-y-1.5"
                      style={{ border: cardBorder, background: cardBg }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-bold text-white/90">
                          {m.nodeType === "MAX" ? t("profile.applyLargeNode") : t("profile.applySmallNode")}
                        </span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                          m.status === "ACTIVE" ? "bg-green-500/15 text-green-400" :
                          m.status === "PENDING_MILESTONES" ? "bg-yellow-500/15 text-yellow-400" :
                          m.status === "CANCELLED" ? "bg-red-500/15 text-red-400" :
                          "bg-white/5 text-white/30"
                        }`}>
                          {m.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-white/35">
                        <span>{t("profile.contribution")}: {Number(m.contributionAmount || m.depositAmount || 0)} USDC</span>
                        <span>{t("profile.frozenFunds")}: {Number(m.frozenAmount || 0).toLocaleString()} USDC</span>
                        <span>{t("profile.startDate")}: {formatDate(m.startDate)}</span>
                        <span>{t("profile.endDate")}: {formatDate(m.endDate)}</span>
                      </div>
                      {m.milestones && m.milestones.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-1">
                          {m.milestones.map((ms, i) => (
                            <span
                              key={i}
                              className={`text-[10px] px-1.5 py-0.5 rounded ${
                                ms.status === "ACHIEVED" ? "bg-green-500/15 text-green-400" :
                                ms.status === "FAILED" ? "bg-red-500/15 text-red-400" :
                                "bg-white/5 text-white/30"
                              }`}
                            >
                              {ms.requiredRank} ({ms.deadlineDays}d)
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "earnings" && (
              <div className="space-y-2">
                {earningsRecords.length === 0 ? (
                  <div className="text-center py-16 text-white/25 text-[14px] italic">
                    {t("profile.noData")}
                  </div>
                ) : (
                  earningsRecords.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-xl p-3 flex items-center justify-between"
                      style={{ border: cardBorder, background: cardBg }}
                    >
                      <div>
                        <div className="text-[13px] font-medium text-white/80">
                          {r.rewardType === "FIXED_YIELD" ? t("profile.dailyEarnings") :
                           r.rewardType === "POOL_DIVIDEND" ? t("profile.poolDividend") :
                           t("profile.teamCommission")}
                        </div>
                        <div className="text-[11px] text-white/30">
                          {r.details?.node_type || "--"} · {formatDate(r.createdAt)}
                        </div>
                      </div>
                      <div className="text-[13px] font-bold text-primary">
                        +{formatMA(Number(r.amount || 0))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "detail" && (
              <div className="space-y-2">
                {activeNodes.length === 0 ? (
                  <div className="text-center py-16 text-white/25 text-[14px] italic">
                    {t("profile.noData")}
                  </div>
                ) : (
                  activeNodes.map((n) => (
                    <div
                      key={n.id}
                      className="rounded-xl p-3 space-y-2"
                      style={{ border: cardBorder, background: cardBg }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-bold text-white/90">
                          {n.nodeType === "MAX" ? t("profile.applyLargeNode") : t("profile.applySmallNode")}
                        </span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                          n.status === "ACTIVE" ? "bg-green-500/15 text-green-400" : "bg-yellow-500/15 text-yellow-400"
                        }`}>
                          {n.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-white/35">
                        <span>{t("profile.frozenFunds")}: {Number(n.frozenAmount || 0).toLocaleString()} USDC</span>
                        <span>{t("profile.dailyEarnings")}: {(Number(n.dailyRate || 0) * 100).toFixed(1)}%</span>
                        <span>{t("profile.milestoneSchedule")}: {n.milestoneStage}/{n.totalMilestones}</span>
                        <span>{t("profile.earningsCapacity")}: {(Number(n.earningsCapacity || 0) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${n.totalMilestones > 0 ? (n.milestoneStage / n.totalMilestones) * 100 : 0}%`,
                            background: "linear-gradient(90deg, #22c55e, #84cc16)",
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}

      <Dialog open={showRequirementDialog} onOpenChange={setShowRequirementDialog}>
        <DialogContent className="max-w-sm" style={{ background: "#111", border: "1px solid rgba(74, 222, 128, 0.2)" }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[15px]">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              {t("profile.milestoneNotReady")}
            </DialogTitle>
            <DialogDescription className="text-[12px] text-white/40">
              {t("profile.milestoneNotReadyDesc")} — {requirementDialogData?.rank}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {requirementDialogData && requirementDialogData.holdingRequired > 0 && (
              <div
                className="rounded-xl p-3 space-y-1"
                style={{
                  border: vaultDeposited >= requirementDialogData.holdingRequired
                    ? "1px solid rgba(74, 222, 128, 0.3)"
                    : "1px solid rgba(239, 68, 68, 0.3)",
                  background: "rgba(0,0,0,0.3)",
                }}
              >
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-white/60">{t("profile.holdingRequired")}</span>
                  <span className="font-bold text-white/90">{requirementDialogData.holdingRequired} USDC</span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-white/60">{t("profile.currentHolding")}</span>
                  <span className={vaultDeposited >= requirementDialogData.holdingRequired ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                    {vaultDeposited.toFixed(0)} USDC
                  </span>
                </div>
                {vaultDeposited < requirementDialogData.holdingRequired && (
                  <p className="text-[10px] text-yellow-400/70 mt-1">{t("profile.depositToMeet")}</p>
                )}
              </div>
            )}
            {requirementDialogData && requirementDialogData.referralsRequired > 0 && (
              <div
                className="rounded-xl p-3 space-y-1"
                style={{
                  border: directNodeReferrals >= requirementDialogData.referralsRequired
                    ? "1px solid rgba(74, 222, 128, 0.3)"
                    : "1px solid rgba(239, 68, 68, 0.3)",
                  background: "rgba(0,0,0,0.3)",
                }}
              >
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-white/60">{t("profile.directNodeRequired")}</span>
                  <span className="font-bold text-white/90">{requirementDialogData.referralsRequired}</span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-white/60">{t("profile.currentDirectNodes")}</span>
                  <span className={directNodeReferrals >= requirementDialogData.referralsRequired ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                    {directNodeReferrals}
                  </span>
                </div>
                {directNodeReferrals < requirementDialogData.referralsRequired && (
                  <p className="text-[10px] text-yellow-400/70 mt-1">{t("profile.referralToMeet")}</p>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-[12px]"
              onClick={() => setShowRequirementDialog(false)}
            >
              {t("common.cancel")}
            </Button>
            {requirementDialogData && vaultDeposited < requirementDialogData.holdingRequired && (
              <Button
                size="sm"
                className="flex-1 text-[12px]"
                onClick={() => {
                  setShowRequirementDialog(false);
                  navigate("/vault");
                }}
              >
                <Landmark className="mr-1 h-3 w-3" />
                {t("profile.goToVault")}
              </Button>
            )}
            {requirementDialogData && requirementDialogData.referralsRequired > 0 && directNodeReferrals < requirementDialogData.referralsRequired && vaultDeposited >= requirementDialogData.holdingRequired && (
              <Button
                size="sm"
                className="flex-1 text-[12px]"
                onClick={() => {
                  setShowRequirementDialog(false);
                  navigate("/profile/referral");
                }}
              >
                {t("profile.inviteFriends")}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
