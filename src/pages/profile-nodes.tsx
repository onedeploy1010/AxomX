import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveAccount } from "thirdweb/react";
import { ArrowLeft, ArrowUpRight, DollarSign, Calendar, Disc, Headphones, Info, WalletCards } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { getNodeOverview, getNodeEarningsRecords, getNodeMemberships } from "@/lib/api";
import type { NodeOverview, NodeEarningsRecord, NodeMembership } from "@shared/types";
import { NODE_PLANS } from "@/lib/data";
import { useTranslation } from "react-i18next";

type TabKey = "purchase" | "earnings" | "detail";

export default function ProfileNodesPage() {
  const { t } = useTranslation();
  const account = useActiveAccount();
  const [, navigate] = useLocation();
  const walletAddr = account?.address || "";
  const isConnected = !!walletAddr;
  const [activeTab, setActiveTab] = useState<TabKey>("purchase");

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

  return (
    <div className="space-y-4 pb-24" data-testid="page-profile-nodes">
      <div className="gradient-green-dark px-4 pb-4 pt-2 rounded-b-2xl" style={{ animation: "fadeSlideIn 0.4s ease-out" }}>
        <div className="flex items-center justify-center relative mb-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigate("/profile")}
            className="absolute left-0"
            data-testid="button-back-profile"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">{t("profile.nodeDetailsTitle")}</h1>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {currentRank} ({t("profile.realLevel")})
            </span>
            <span className="text-sm font-bold">{currentRank}</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-black/40 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(levelProgress, 2)}%`,
                background: "linear-gradient(90deg, #4ade80, #22c55e, #a3e635)",
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{t("profile.myNodesLabel")}</span>
              <span className="text-sm">💎 {activeCount}/{totalDays || 0}Day</span>
            </div>
            <Info className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      {!isConnected ? (
        <div className="px-4" style={{ animation: "fadeSlideIn 0.5s ease-out 0.1s both" }}>
          <div className="glass-card rounded-2xl p-6 text-center" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
            <WalletCards className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{t("profile.connectToViewNodes")}</p>
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
          <div className="px-4 space-y-4" style={{ animation: "fadeSlideIn 0.45s ease-out 0.1s both" }}>
            <div className="grid grid-cols-2 gap-3">
              <button
                className="glass-card rounded-xl py-3 px-4 flex items-center justify-between transition-all active:scale-[0.98]"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                onClick={() => navigate("/profile/nodes")}
              >
                <span className="text-sm font-bold">{t("profile.applyLargeNode")}</span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </button>
              <button
                className="glass-card rounded-xl py-3 px-4 flex items-center justify-between transition-all active:scale-[0.98]"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                onClick={() => navigate("/profile/nodes")}
              >
                <span className="text-sm font-bold">{t("profile.applySmallNode")}</span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="text-[11px] text-muted-foreground -mt-1">{t("profile.contribution")}${NODE_PLANS.MAX.price} + {t("profile.frozenFunds")}${NODE_PLANS.MAX.frozenAmount.toLocaleString()}</div>
              <div className="text-[11px] text-muted-foreground -mt-1">{t("profile.contribution")}${NODE_PLANS.MINI.price} + {t("profile.frozenFunds")}${NODE_PLANS.MINI.frozenAmount.toLocaleString()}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div
                className="glass-card rounded-xl p-4 text-center space-y-2"
                style={{ border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="text-xs text-muted-foreground">{t("profile.nodeTotalAmount")} 🔊</div>
                <DollarSign className="h-6 w-6 mx-auto text-primary" />
                <div className="text-lg font-bold text-primary">${totalEarnings.toFixed(2)}</div>
              </div>
              <div
                className="glass-card rounded-xl p-4 text-center space-y-2"
                style={{ border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="text-xs text-muted-foreground">{t("profile.releaseDays")}</div>
                <Calendar className="h-6 w-6 mx-auto text-primary" />
                <div className="text-lg font-bold">{daysActive}/{totalDays || 0}Day</div>
              </div>
              <div
                className="glass-card rounded-xl p-4 text-center space-y-2"
                style={{ border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="text-xs text-muted-foreground">{t("profile.releasedEarnings")}</div>
                <DollarSign className="h-6 w-6 mx-auto text-primary" />
                <div className="text-lg font-bold text-primary">${releasedEarnings.toFixed(2)}</div>
              </div>
              <div
                className="glass-card rounded-xl p-4 text-center space-y-2"
                style={{ border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="text-xs text-muted-foreground">{t("profile.releaseStatus")}</div>
                <Disc className="h-6 w-6 mx-auto text-primary" />
                <div className="text-lg font-bold">{releaseStatus}</div>
              </div>
            </div>

            <div
              className="glass-card rounded-xl px-4 py-3 flex items-center justify-between"
              style={{ border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                </div>
                <span className="text-sm">
                  {t("profile.availableBalance")}：<span className="font-bold">${availableBalance.toFixed(2)}</span>
                  {lockedEarnings > 0 && (
                    <span className="text-muted-foreground text-xs ml-1">({t("profile.locked")}: ${lockedEarnings.toFixed(2)})</span>
                  )}
                </span>
                <Headphones className="h-4 w-4 text-muted-foreground" />
              </div>
              <button className="text-xs border border-border rounded-md px-3 py-1 text-muted-foreground hover:text-foreground transition-colors">
                {t("profile.withdrawBtn")}
              </button>
            </div>
          </div>

          <div className="px-4" style={{ animation: "fadeSlideIn 0.5s ease-out 0.15s both" }}>
            <div className="flex gap-2 mb-4">
              {([
                { key: "purchase" as TabKey, label: t("profile.purchaseRecords") },
                { key: "earnings" as TabKey, label: t("profile.earningsDetailTab") },
                { key: "detail" as TabKey, label: t("profile.myDetailTab") },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    activeTab === tab.key
                      ? "border-primary text-primary bg-primary/10"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "purchase" && (
              <div className="space-y-2">
                {allMemberships.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    {t("profile.noData")}
                  </div>
                ) : (
                  allMemberships.map((m) => (
                    <div
                      key={m.id}
                      className="glass-card rounded-xl p-3 space-y-1.5"
                      style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">
                          {m.nodeType === "MAX" ? t("profile.applyLargeNode") : t("profile.applySmallNode")}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          m.status === "ACTIVE" ? "bg-green-500/20 text-green-400" :
                          m.status === "PENDING_MILESTONES" ? "bg-yellow-500/20 text-yellow-400" :
                          m.status === "CANCELLED" ? "bg-red-500/20 text-red-400" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {m.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[12px] text-muted-foreground">
                        <span>{t("profile.contribution")}: ${Number(m.contributionAmount || m.depositAmount || 0).toFixed(0)}</span>
                        <span>{t("profile.frozenFunds")}: ${Number(m.frozenAmount || 0).toLocaleString()}</span>
                        <span>{t("profile.startDate")}: {formatDate(m.startDate)}</span>
                        <span>{t("profile.endDate")}: {formatDate(m.endDate)}</span>
                      </div>
                      {m.milestones && m.milestones.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-1">
                          {m.milestones.map((ms, i) => (
                            <span
                              key={i}
                              className={`text-[10px] px-1.5 py-0.5 rounded ${
                                ms.status === "ACHIEVED" ? "bg-green-500/20 text-green-400" :
                                ms.status === "FAILED" ? "bg-red-500/20 text-red-400" :
                                "bg-muted/50 text-muted-foreground"
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
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    {t("profile.noData")}
                  </div>
                ) : (
                  earningsRecords.map((r) => (
                    <div
                      key={r.id}
                      className="glass-card rounded-xl p-3 flex items-center justify-between"
                      style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <div>
                        <div className="text-sm font-medium">
                          {r.rewardType === "FIXED_YIELD" ? t("profile.dailyEarnings") :
                           r.rewardType === "POOL_DIVIDEND" ? t("profile.poolDividend") :
                           t("profile.teamCommission")}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {r.details?.node_type || "--"} · {formatDate(r.createdAt)}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-primary">
                        +${Number(r.amount || 0).toFixed(4)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "detail" && (
              <div className="space-y-2">
                {activeNodes.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    {t("profile.noData")}
                  </div>
                ) : (
                  activeNodes.map((n) => (
                    <div
                      key={n.id}
                      className="glass-card rounded-xl p-3 space-y-2"
                      style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">
                          {n.nodeType === "MAX" ? t("profile.applyLargeNode") : t("profile.applySmallNode")}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          n.status === "ACTIVE" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                        }`}>
                          {n.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[12px] text-muted-foreground">
                        <span>{t("profile.frozenFunds")}: ${Number(n.frozenAmount || 0).toLocaleString()}</span>
                        <span>{t("profile.dailyEarnings")}: {(Number(n.dailyRate || 0) * 100).toFixed(1)}%</span>
                        <span>{t("profile.milestoneSchedule")}: {n.milestoneStage}/{n.totalMilestones}</span>
                        <span>{t("profile.earningsCapacity")}: {(Number(n.earningsCapacity || 0) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${n.totalMilestones > 0 ? (n.milestoneStage / n.totalMilestones) * 100 : 0}%` }}
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
    </div>
  );
}
