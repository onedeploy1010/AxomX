import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

const trendingItems = [
  { text: "BTC Trade +5.80%", type: "gain" as const },
  { text: "ETH Trade -1.76%", type: "loss" as const },
  { text: "GPT-5 completed SOL +17.92%", type: "gain" as const },
  { text: "BNB Trade -4.76%", type: "loss" as const },
  { text: "Claude completed BTC +3.21%", type: "gain" as const },
  { text: "SOL Strategy +8.44%", type: "gain" as const },
];

export function TrendingFeed() {
  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Activity className="h-4 w-4 text-primary" />
        Trending
      </h3>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {trendingItems.map((item, i) => (
          <Badge
            key={i}
            variant="secondary"
            className={`whitespace-nowrap text-xs ${
              item.type === "gain"
                ? "bg-green-500/10 text-green-400"
                : "bg-red-500/10 text-red-400"
            } no-default-hover-elevate no-default-active-elevate`}
          >
            {item.text}
          </Badge>
        ))}
      </div>
    </div>
  );
}
