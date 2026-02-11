import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DepthBarProps {
  buyPercent: string;
  sellPercent: string;
  isLoading: boolean;
}

export function DepthBar({ buyPercent, sellPercent, isLoading }: DepthBarProps) {
  if (isLoading) {
    return <Skeleton className="h-16 w-full rounded-md" />;
  }

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <div className="mb-3 text-center text-sm font-medium">Depth Ratio</div>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-green-400">Longs: {buyPercent}%</span>
              <span className="text-xs text-red-400">Shorts: {sellPercent}%</span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full">
              <div className="bg-green-500/70 transition-all duration-500" style={{ width: `${buyPercent}%` }} />
              <div className="bg-red-500/70 transition-all duration-500" style={{ width: `${sellPercent}%` }} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
