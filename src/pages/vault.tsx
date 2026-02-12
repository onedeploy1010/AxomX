import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Lock, ArrowDownToLine, ArrowUpFromLine, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import { VaultChart } from "@/components/vault/vault-chart";
import { VaultStats } from "@/components/vault/vault-stats";
import { VaultPlans } from "@/components/vault/vault-plans";
import { useActiveAccount } from "thirdweb/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getVaultPositions, getTransactions, vaultDeposit, vaultWithdraw } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePayment, getPaymentStatusLabel } from "@/hooks/use-payment";
import { VAULT_PLANS } from "@/lib/data";
import { VAULT_CONTRACT_ADDRESS } from "@/lib/contracts";
import { formatUSD, shortenAddress } from "@/lib/constants";
import type { VaultPosition, Transaction } from "@shared/types";
import { useTranslation } from "react-i18next";

function TransactionTable({ walletAddress, type }: { walletAddress: string; type: string }) {
  const { t } = useTranslation();
  const { data: txs, isLoading } = useQuery<Transaction[]>({
    queryKey: ["transactions", walletAddress, type],
    queryFn: () => getTransactions(walletAddress, type),
    enabled: !!walletAddress,
  });

  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full mb-2" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!txs || txs.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-4 text-center py-8">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
          <div className="text-sm text-muted-foreground" data-testid={`text-no-${type.toLowerCase()}-records`}>{t("common.noRecords")}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <div className="overflow-x-auto">
        <div className="grid grid-cols-6 text-[12px] text-muted-foreground mb-2 font-medium gap-1 min-w-[400px]">
          <span>{t("common.token")}</span><span>{t("common.amount")}</span><span>Chain</span><span>{t("common.txid")}</span><span>{t("common.status")}</span><span>{t("common.date")}</span>
        </div>
        <div className="space-y-1">
          {txs.map((tx, idx) => (
            <div
              key={tx.id}
              className="grid grid-cols-6 text-xs py-2 border-b border-border/30 last:border-0 gap-1 min-w-[400px]"
              style={{ animation: `fadeSlideIn 0.3s ease-out ${idx * 0.05}s both` }}
              data-testid={`row-tx-${tx.id}`}
            >
              <span className="font-medium">{tx.token}</span>
              <span className="text-neon-value">${Number(tx.amount).toFixed(2)}</span>
              <span className="text-blue-400 text-[11px]">Base</span>
              <span className="text-muted-foreground truncate">
                {tx.txHash ? (
                  <a
                    href={`https://sepolia.basescan.org/tx/${tx.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary/80 hover:text-primary"
                  >
                    {shortenAddress(tx.txHash)}
                  </a>
                ) : "-"}
              </span>
              <Badge
                className={`text-[11px] w-fit no-default-hover-elevate no-default-active-elevate ${
                  tx.status === "CONFIRMED"
                    ? "bg-primary/15 text-primary"
                    : "bg-yellow-500/15 text-yellow-400"
                }`}
              >
                {tx.status}
              </Badge>
              <span className="text-muted-foreground">
                {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : "-"}
              </span>
            </div>
          ))}
        </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Vault() {
  const { t } = useTranslation();
  const account = useActiveAccount();
  const walletAddress = account?.address || "";
  const { toast } = useToast();

  const [depositOpen, setDepositOpen] = useState(false);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("5_DAYS");
  const [depositAmount, setDepositAmount] = useState("");
  const [selectedPositionId, setSelectedPositionId] = useState<string>("");

  const { data: positions, isLoading: positionsLoading } = useQuery<VaultPosition[]>({
    queryKey: ["vault-positions", walletAddress],
    queryFn: () => getVaultPositions(walletAddress),
    enabled: !!walletAddress,
  });

  const activePositions = useMemo(() => {
    return (positions || []).filter(p => p.status === "ACTIVE");
  }, [positions]);

  const { totalPrincipal, totalYield } = useMemo(() => {
    const now = new Date();
    let principal = 0;
    let yieldSum = 0;
    for (const p of activePositions) {
      const amt = Number(p.principal || 0);
      principal += amt;
      const start = new Date(p.startDate!);
      const days = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      yieldSum += amt * Number(p.dailyRate || 0) * days;
    }
    return { totalPrincipal: principal, totalYield: yieldSum };
  }, [activePositions]);

  const payment = usePayment();

  const depositMutation = useMutation({
    mutationFn: async (data: { walletAddress: string; planType: string; amount: number }) => {
      // Step 1: On-chain USDC payment (if vault contract is deployed)
      let txHash: string | undefined;
      if (VAULT_CONTRACT_ADDRESS) {
        txHash = await payment.payVaultDeposit(data.amount, data.planType);
      }
      // Step 2: Record to database (callback with txHash)
      const result = await vaultDeposit(data.walletAddress, data.planType, data.amount, txHash);
      // Step 3: Mark as fully complete
      payment.markSuccess();
      return result;
    },
    onSuccess: () => {
      toast({ title: t("vault.depositSuccess"), description: t("vault.depositSuccessDesc") });
      queryClient.invalidateQueries({ queryKey: ["vault-positions", walletAddress] });
      queryClient.invalidateQueries({ queryKey: ["vault-overview"] });
      queryClient.invalidateQueries({ queryKey: ["transactions", walletAddress] });
      setDepositOpen(false);
      setDepositAmount("");
      payment.reset();
    },
    onError: (err: Error) => {
      // If on-chain succeeded but DB failed, show txHash so user can recover
      const failedTxHash = payment.txHash;
      const desc = failedTxHash
        ? `${err.message}\n\nOn-chain tx: ${failedTxHash}\nPlease contact support with this txHash.`
        : err.message;
      toast({ title: t("vault.depositFailed"), description: desc, variant: "destructive" });
      payment.reset();
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (data: { walletAddress: string; positionId: string }) => {
      return vaultWithdraw(data.walletAddress, data.positionId);
    },
    onSuccess: (data: any) => {
      toast({
        title: t("vault.withdrawalSuccess"),
        description: t("vault.withdrawnTotal", { total: Number(data.totalWithdraw).toFixed(2), yield: Number(data.yieldAmount).toFixed(2) }),
      });
      queryClient.invalidateQueries({ queryKey: ["vault-positions", walletAddress] });
      queryClient.invalidateQueries({ queryKey: ["vault-overview"] });
      queryClient.invalidateQueries({ queryKey: ["transactions", walletAddress] });
      setRedeemOpen(false);
      setSelectedPositionId("");
    },
    onError: (err: Error) => {
      toast({ title: t("vault.withdrawalFailed"), description: err.message, variant: "destructive" });
    },
  });

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    const minAmount = VAULT_PLANS[selectedPlan as keyof typeof VAULT_PLANS]?.minAmount || 50;
    if (!walletAddress || !selectedPlan || isNaN(amount) || amount < minAmount) {
      toast({ title: t("vault.invalidInput"), description: `Minimum deposit is $${minAmount} USDC`, variant: "destructive" });
      return;
    }
    depositMutation.mutate({ walletAddress, planType: selectedPlan, amount });
  };

  const handleWithdraw = (positionId: string) => {
    if (!walletAddress || !positionId) return;
    withdrawMutation.mutate({ walletAddress, positionId });
  };

  const handlePlanSelect = (planKey: string) => {
    setSelectedPlan(planKey);
    setDepositOpen(true);
  };

  return (
    <div className="space-y-6 pb-40">
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <VaultChart />

      <div className="px-4">
        <h3 className="text-base font-bold mb-3">{t("vault.vaultDetails")}</h3>
        <VaultStats />
      </div>

      <div className="px-4">
        <Card className="border-border bg-card shadow-[0_0_15px_rgba(0,188,165,0.05)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
              <div>
                <div className="text-[12px] text-muted-foreground">{t("vault.yourPosition")}</div>
                <div className="text-2xl font-bold" data-testid="text-my-position">
                  {walletAddress ? formatUSD(totalPrincipal) : "$0.00"}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-muted-foreground">{t("vault.accumulatedYield")}</div>
                <div className="text-2xl font-bold text-neon-value" data-testid="text-my-yield">
                  {walletAddress ? formatUSD(totalYield) : "$0.00"}
                </div>
              </div>
            </div>
            <Button
              variant="secondary"
              className="w-full"
              disabled={totalYield <= 0}
              data-testid="button-claim"
            >
              <Sparkles className="mr-2 h-4 w-4" /> {t("vault.claimYield")}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="px-4">
        <VaultPlans selectedPlan={selectedPlan} onSelectPlan={handlePlanSelect} />
      </div>

      <div className="px-4">
        <h3 className="text-base font-bold mb-3">{t("vault.positions")}</h3>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="overflow-x-auto">
            <div className="grid grid-cols-5 text-[12px] text-muted-foreground mb-2 font-medium gap-1 min-w-[340px]">
              <span>{t("common.amount")}</span>
              <span>{t("vault.start")}</span>
              <span>{t("vault.lock")}</span>
              <span>{t("vault.remaining")}</span>
              <span>{t("vault.action")}</span>
            </div>
            {positionsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full mb-2" />
              ))
            ) : !positions || positions.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground" data-testid="text-no-positions">
                {t("vault.noPositionsYet")}
              </div>
            ) : (
              <div className="space-y-1">
                {positions.map((pos, idx) => {
                  const now = new Date();
                  const start = new Date(pos.startDate!);
                  const end = pos.endDate ? new Date(pos.endDate) : null;
                  const remainingDays = end ? Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;
                  const planConfig = VAULT_PLANS[pos.planType as keyof typeof VAULT_PLANS];
                  const lockDays = planConfig?.days || 0;

                  return (
                    <div
                      key={pos.id}
                      className="grid grid-cols-5 items-center text-xs py-3 border-b border-border/30 last:border-0 gap-1 min-w-[340px]"
                      style={{ animation: `fadeSlideIn 0.3s ease-out ${idx * 0.08}s both` }}
                      data-testid={`row-position-${pos.id}`}
                    >
                      <span className="font-medium">${Number(pos.principal).toFixed(2)}</span>
                      <span className="text-muted-foreground">{start.toLocaleDateString()}</span>
                      <span className="text-muted-foreground">{lockDays}d</span>
                      <span className={remainingDays > 0 ? "text-yellow-400" : "text-neon-value"}>
                        {pos.status === "ACTIVE" ? `${remainingDays}d` : pos.status}
                      </span>
                      <div>
                        {pos.status === "ACTIVE" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-red-400"
                            onClick={() => handleWithdraw(pos.id)}
                            disabled={withdrawMutation.isPending}
                            data-testid={`button-withdraw-${pos.id}`}
                          >
                            {t("common.withdraw")}
                          </Button>
                        ) : (
                          <Badge className="text-[11px] bg-muted/50 text-muted-foreground no-default-hover-elevate no-default-active-elevate">
                            {pos.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-4">
        <Tabs defaultValue="deposit">
          <TabsList className="w-full bg-card border border-border">
            <TabsTrigger value="deposit" className="flex-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-deposit">
              {t("vault.depositTab")}
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="flex-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-withdraw">
              {t("vault.withdrawTab")}
            </TabsTrigger>
            <TabsTrigger value="yield" className="flex-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-yield">
              {t("vault.yieldTab")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="deposit" className="mt-3">
            {walletAddress ? (
              <TransactionTable walletAddress={walletAddress} type="DEPOSIT" />
            ) : (
              <Card className="border-border bg-card">
                <CardContent className="p-4 text-center py-6 text-sm text-muted-foreground">{t("common.connectWalletToView")}</CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="withdraw" className="mt-3">
            {walletAddress ? (
              <TransactionTable walletAddress={walletAddress} type="WITHDRAW" />
            ) : (
              <Card className="border-border bg-card">
                <CardContent className="p-4 text-center py-6 text-sm text-muted-foreground">{t("common.connectWalletToView")}</CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="yield" className="mt-3">
            {walletAddress ? (
              <TransactionTable walletAddress={walletAddress} type="YIELD" />
            ) : (
              <Card className="border-border bg-card">
                <CardContent className="p-4 text-center py-6 text-sm text-muted-foreground">{t("common.connectWalletToView")}</CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md px-4 py-3">
        <div className="mx-auto max-w-lg flex gap-3">
          <Button
            className="flex-1 bg-cyan-600 text-white border-cyan-700"
            onClick={() => setDepositOpen(true)}
            data-testid="button-deposit-vault"
          >
            <ArrowDownToLine className="mr-2 h-4 w-4" /> {t("vault.depositToVault")}
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setRedeemOpen(true)}
            data-testid="button-redeem-vault"
          >
            <ArrowUpFromLine className="mr-2 h-4 w-4" /> {t("vault.redeemFromVault")}
          </Button>
        </div>
      </div>

      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{t("vault.depositToVault")}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("vault.selectPlan")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">{t("vault.selectPlan")}</label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger data-testid="select-plan">
                  <SelectValue placeholder={t("vault.choosePlan")} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(VAULT_PLANS).map(([key, plan]) => (
                    <SelectItem key={key} value={key} data-testid={`select-plan-${key}`}>
                      {plan.label} - {plan.apr} APR
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">{t("vault.amountUSDT")}</label>
              <Input
                type="number"
                placeholder={t("vault.enterAmount")}
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                min="1"
                step="1"
                data-testid="input-deposit-amount"
              />
            </div>
            {selectedPlan && (
              <div className="bg-muted/30 rounded-md p-3 text-xs space-y-1">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{t("vault.dailyRate")}</span>
                  <span className="text-neon-value">
                    {(VAULT_PLANS[selectedPlan as keyof typeof VAULT_PLANS]?.dailyRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{t("vault.lockPeriod")}</span>
                  <span>{VAULT_PLANS[selectedPlan as keyof typeof VAULT_PLANS]?.days} days</span>
                </div>
                {depositAmount && !isNaN(parseFloat(depositAmount)) && (
                  <div className="flex justify-between gap-2 pt-1 border-t border-border/30">
                    <span className="text-muted-foreground">{t("vault.estTotalYield")}</span>
                    <span className="text-neon-value font-medium">
                      ${(parseFloat(depositAmount) * VAULT_PLANS[selectedPlan as keyof typeof VAULT_PLANS]?.dailyRate * VAULT_PLANS[selectedPlan as keyof typeof VAULT_PLANS]?.days).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            {payment.status !== "idle" && payment.status !== "success" && (
              <div className="w-full flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>{getPaymentStatusLabel(payment.status)}</span>
              </div>
            )}
            <Button
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 border-emerald-500/50 text-white"
              onClick={handleDeposit}
              disabled={depositMutation.isPending || !walletAddress}
              data-testid="button-confirm-deposit"
            >
              {depositMutation.isPending ? getPaymentStatusLabel(payment.status) || t("common.processing") : !walletAddress ? t("common.connectWalletFirst") : t("vault.confirmDeposit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={redeemOpen} onOpenChange={setRedeemOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{t("vault.redeemFromVault")}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("vault.selectPosition")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {!walletAddress ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                {t("vault.connectToViewPositions")}
              </div>
            ) : activePositions.length === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground" data-testid="text-no-active-positions">
                {t("vault.noActivePositions")}
              </div>
            ) : (
              <>
                <label className="text-xs text-muted-foreground mb-1.5 block">{t("vault.selectPosition")}</label>
                <Select value={selectedPositionId} onValueChange={setSelectedPositionId}>
                  <SelectTrigger data-testid="select-position">
                    <SelectValue placeholder={t("vault.choosePosition")} />
                  </SelectTrigger>
                  <SelectContent>
                    {activePositions.map((pos) => {
                      const planConfig = VAULT_PLANS[pos.planType as keyof typeof VAULT_PLANS];
                      return (
                        <SelectItem key={pos.id} value={pos.id} data-testid={`select-position-${pos.id}`}>
                          ${Number(pos.principal).toFixed(2)} - {planConfig?.label || pos.planType}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {selectedPositionId && (() => {
                  const pos = activePositions.find(p => p.id === selectedPositionId);
                  if (!pos) return null;
                  const now = new Date();
                  const start = new Date(pos.startDate!);
                  const days = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                  const yieldAmt = Number(pos.principal) * Number(pos.dailyRate) * days;
                  const total = Number(pos.principal) + yieldAmt;
                  const isEarly = pos.endDate && now < new Date(pos.endDate);
                  return (
                    <div className="bg-muted/30 rounded-md p-3 text-xs space-y-1">
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">{t("vault.principal")}</span>
                        <span>${Number(pos.principal).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">{t("vault.yieldDays", { days })}</span>
                        <span className="text-neon-value">${yieldAmt.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between gap-2 pt-1 border-t border-border/30">
                        <span className="text-muted-foreground">{t("vault.total")}</span>
                        <span className="font-medium">${total.toFixed(2)}</span>
                      </div>
                      {isEarly && (
                        <div className="text-yellow-400 text-[12px] mt-1">
                          {t("vault.earlyWithdrawal")}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 border-emerald-500/50 text-white"
              onClick={() => handleWithdraw(selectedPositionId)}
              disabled={withdrawMutation.isPending || !selectedPositionId || !walletAddress}
              data-testid="button-confirm-redeem"
            >
              {withdrawMutation.isPending ? t("common.processing") : t("vault.confirmRedemption")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
