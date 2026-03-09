import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileCode2, Save, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGetContractConfigs, adminUpdateContractConfig, adminAddLog } from "@/admin/admin-api";
import { useAdminAuth } from "@/admin/admin-auth";
import { useToast } from "@/hooks/use-toast";

export default function AdminContracts() {
  const { adminUser, adminRole, hasPermission } = useAdminAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const canEdit = hasPermission("contracts");
  const isReadOnly = !canEdit;

  const { data: configs, isLoading } = useQuery({
    queryKey: ["admin", "contract-configs"],
    queryFn: adminGetContractConfigs,
    enabled: !!adminUser,
  });

  const handleSave = async (key: string) => {
    if (!adminUser || !adminRole) return;
    const newValue = editValues[key];
    if (newValue === undefined) return;

    setSaving(key);
    try {
      await adminUpdateContractConfig(key, newValue, adminUser);
      await adminAddLog(adminUser, adminRole, "update", "contract_config", key, { key, value: newValue });
      queryClient.invalidateQueries({ queryKey: ["admin", "contract-configs"] });
      setEditValues((prev) => { const next = { ...prev }; delete next[key]; return next; });
      toast({ title: "已保存", description: `${key} 已更新` });
    } catch {
      toast({ title: "保存失败", description: "请重试", variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg lg:text-xl font-bold text-foreground flex items-center gap-2">
          <FileCode2 className="h-5 w-5 text-primary" />
          合约管理
        </h1>
        {isReadOnly && (
          <Badge className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
            <Lock className="h-3 w-3" /> 只读
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {(configs ?? []).map((cfg: any) => {
            const editVal = editValues[cfg.key];
            const isEditing = editVal !== undefined;
            const currentVal = isEditing ? editVal : cfg.value;
            const hasChanged = isEditing && editVal !== cfg.value;

            return (
              <div
                key={cfg.key}
                className="rounded-xl border border-border/15 p-3 lg:p-4 transition-colors"
                style={{ background: hasChanged ? "rgba(10,186,181,0.03)" : "rgba(255,255,255,0.01)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground/70">{cfg.key}</span>
                    {cfg.description && (
                      <span className="text-[10px] text-foreground/25">({cfg.description})</span>
                    )}
                  </div>
                  {cfg.updated_by && (
                    <span className="text-[9px] text-foreground/20">
                      {cfg.updated_by} · {new Date(cfg.updated_at).toLocaleDateString("zh-CN")}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    value={currentVal}
                    onChange={(e) => setEditValues((prev) => ({ ...prev, [cfg.key]: e.target.value }))}
                    className="flex-1 h-9 text-xs font-mono bg-background/50 border-border/20"
                    disabled={isReadOnly}
                    placeholder="未配置"
                  />
                  {canEdit && hasChanged && (
                    <Button
                      size="sm"
                      className="h-9 shrink-0"
                      onClick={() => handleSave(cfg.key)}
                      disabled={saving === cfg.key}
                    >
                      <Save className="h-3.5 w-3.5 mr-1" />
                      {saving === cfg.key ? "保存中..." : "保存"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
