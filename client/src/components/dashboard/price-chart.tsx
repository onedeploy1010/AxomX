import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { formatUSD } from "@/lib/constants";
import type { ChartDataPoint } from "@/hooks/use-crypto-price";
import { Skeleton } from "@/components/ui/skeleton";

interface PriceChartProps {
  data: ChartDataPoint[] | undefined;
  isLoading: boolean;
  color?: string;
}

export function PriceChart({ data, isLoading, color = "hsl(142, 72%, 45%)" }: PriceChartProps) {
  if (isLoading || !data || data.length === 0) {
    return <Skeleton className="h-48 w-full rounded-md" />;
  }

  const sampled = data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 80)) === 0);

  return (
    <div className="h-48 w-full" data-testid="chart-price">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={sampled} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: "hsl(150, 5%, 55%)" }}
            tickLine={false}
            axisLine={false}
            interval={Math.floor(sampled.length / 5)}
          />
          <YAxis
            domain={["dataMin", "dataMax"]}
            tick={{ fontSize: 10, fill: "hsl(150, 5%, 55%)" }}
            tickLine={false}
            axisLine={false}
            orientation="right"
            width={65}
            tickFormatter={(v) =>
              v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toFixed(2)
            }
          />
          <Tooltip
            contentStyle={{
              background: "hsl(150, 8%, 12%)",
              border: "1px solid hsl(150, 8%, 20%)",
              borderRadius: "6px",
              fontSize: "12px",
              color: "hsl(150, 5%, 95%)",
            }}
            formatter={(value: number) => [formatUSD(value), "Price"]}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={2}
            fill="url(#priceGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
