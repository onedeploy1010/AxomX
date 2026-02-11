import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import type { Strategy, PredictionMarket } from "@shared/schema";
import { StrategyHeader } from "@/components/strategy/strategy-header";
import { StrategyCard } from "@/components/strategy/strategy-card";
import { HedgeSection } from "@/components/strategy/hedge-section";
import { MarketCard } from "@/components/trade/market-card";

export default function StrategyPage() {
  const { data: strategies = [], isLoading } = useQuery<Strategy[]>({ queryKey: ["/api/strategies"] });
  const { data: markets = [] } = useQuery<PredictionMarket[]>({ queryKey: ["/api/predictions"] });

  return (
    <div className="space-y-4 pb-20">
      <StrategyHeader />

      <div className="px-4">
        <Tabs defaultValue="strategies">
          <TabsList className="w-full bg-card border border-border">
            <TabsTrigger value="strategies" className="flex-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Strategies</TabsTrigger>
            <TabsTrigger value="hedge" className="flex-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Hedge</TabsTrigger>
            <TabsTrigger value="predictions" className="flex-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Predictions</TabsTrigger>
          </TabsList>

          <TabsContent value="strategies" className="mt-3">
            <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
              {["All", "Trending", "Quantitative", "Completed"].map((filter) => (
                <Badge
                  key={filter}
                  variant={filter === "All" ? "default" : "secondary"}
                  className={`whitespace-nowrap text-xs cursor-pointer ${filter !== "All" ? "no-default-hover-elevate no-default-active-elevate" : ""}`}
                >
                  {filter}
                </Badge>
              ))}
            </div>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-48 rounded-md" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {strategies.map((s, i) => (
                  <StrategyCard key={s.id} strategy={s} index={i} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="hedge" className="mt-3">
            <HedgeSection />
          </TabsContent>

          <TabsContent value="predictions" className="mt-3">
            <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
              {["All", "15min", "1H", "4H"].map((tf) => (
                <Badge
                  key={tf}
                  variant={tf === "All" ? "default" : "secondary"}
                  className={`whitespace-nowrap text-xs cursor-pointer ${tf !== "All" ? "no-default-hover-elevate no-default-active-elevate" : ""}`}
                >
                  {tf}
                </Badge>
              ))}
            </div>
            <div className="space-y-3">
              {markets.length > 0 ? (
                markets.map((m) => <MarketCard key={m.id} market={m} />)
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">Loading predictions...</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
