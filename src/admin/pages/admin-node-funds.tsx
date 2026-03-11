import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { MobileDataCard } from "@/admin/components/mobile-card";
import { adminGetNodeFundRecords, adminGetNodeFundStats } from "@/admin/admin-api";
import { useAdminAuth } from "@/admin/admin-auth";
import { shortenAddress, formatUSD } from "@/lib/constants";
import { Banknote, TrendingUp, Receipt } from "lucide-react";
import { StatsCard } from "@/admin/components/stats-card";

const PAGE_SIZE = 20;

export default function AdminNodeFunds() {
  const { adminUser } = useAdminAuth();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "node-fund-records", page],
    queryFn: () => adminGetNodeFundRecords(page, PAGE_SIZE),
    enabled: !!adminUser,
  });

  const { data: stats } = useQuery({
    queryKey: ["admin", "node-fund-stats"],
    queryFn: () => adminGetNodeFundStats(),
    enabled: !!adminUser,
  });

  const records = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4 lg:space-y-6">
      <h1 className="text-lg lg:text-xl font-bold text-foreground">
        节点资金记录
        {total > 0 && <span className="text-sm font-normal text-foreground/40 ml-2">({total})</span>}
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatsCard title="总交易数" value={stats?.totalRecords ?? 0} icon={Receipt} subtitle="购买笔数" color="#6366f1" />
        <StatsCard title="总贡献金" value={formatUSD(Number(stats?.totalContribution ?? 0))} icon={Banknote} subtitle="实付金额" color="#22c55e" />
        <StatsCard title="总金额" value={formatUSD(Number(stats?.totalAmount ?? 0))} icon={TrendingUp} subtitle="含冻结" color="#f59e0b" />
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 lg:h-10 w-full rounded-xl" />)}</div>
      ) : (
        <>
          {/* Mobile */}
          <div className="lg:hidden space-y-3">
            {records.length === 0 ? (
              <p className="text-center text-foreground/40 py-8 text-sm">暂无数据</p>
            ) : records.map((r: any) => (
              <MobileDataCard
                key={r.id}
                header={
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-primary">{shortenAddress(r.userWallet ?? r.userId)}</span>
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-[10px] h-5">{r.status}</Badge>
                  </div>
                }
                fields={[
                  { label: "节点类型", value: <Badge variant="outline" className="text-[10px] h-5 capitalize">{r.details?.nodeType ?? "-"}</Badge> },
                  { label: "贡献金", value: r.details?.contribution ? formatUSD(Number(r.details.contribution)) : "-" },
                  { label: "冻结金", value: r.details?.frozen ? formatUSD(Number(r.details.frozen)) : "-" },
                  { label: "总金额", value: formatUSD(Number(r.amount)) },
                  { label: "Tx Hash", value: r.txHash ? <a href={`https://bscscan.com/tx/${r.txHash}`} target="_blank" rel="noreferrer" className="text-primary hover:underline font-mono">{shortenAddress(r.txHash)}</a> : "-" },
                  { label: "时间", value: r.createdAt ? new Date(r.createdAt).toLocaleString() : "-" },
                ]}
              />
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden lg:block rounded-2xl border border-border/30 backdrop-blur-sm overflow-x-auto" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)" }}>
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow className="border-border/20 hover:bg-transparent">
                  <TableHead>用户钱包</TableHead>
                  <TableHead>节点类型</TableHead>
                  <TableHead>贡献金</TableHead>
                  <TableHead>冻结金</TableHead>
                  <TableHead>总金额</TableHead>
                  <TableHead>Tx Hash</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-foreground/40 py-8">暂无数据</TableCell></TableRow>
                ) : records.map((r: any) => (
                  <TableRow key={r.id} className="border-border/10 hover:bg-white/[0.015]">
                    <TableCell className="font-mono text-xs text-foreground/70">{shortenAddress(r.userWallet ?? r.userId)}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs capitalize">{r.details?.nodeType ?? "-"}</Badge></TableCell>
                    <TableCell className="text-foreground/70">{r.details?.contribution ? formatUSD(Number(r.details.contribution)) : "-"}</TableCell>
                    <TableCell className="text-foreground/70">{r.details?.frozen ? formatUSD(Number(r.details.frozen)) : "-"}</TableCell>
                    <TableCell className="text-foreground/70 font-medium">{formatUSD(Number(r.amount))}</TableCell>
                    <TableCell>
                      {r.txHash ? (
                        <a href={`https://bscscan.com/tx/${r.txHash}`} target="_blank" rel="noreferrer" className="text-primary hover:underline font-mono text-xs">
                          {shortenAddress(r.txHash)}
                        </a>
                      ) : <span className="text-foreground/30">-</span>}
                    </TableCell>
                    <TableCell><Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20">{r.status}</Badge></TableCell>
                    <TableCell className="text-foreground/40 text-xs">{r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground/40">{page} / {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>上一页</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>下一页</Button>
          </div>
        </div>
      )}
    </div>
  );
}
