import { EXCHANGES } from "@/lib/data";

interface ExchangeDepthProps {
  symbol: string;
}

export function ExchangeDepth({ symbol }: ExchangeDepthProps) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">Order Book Depth - {symbol}</h3>
      <div className="space-y-1.5">
        {EXCHANGES.map((ex) => (
          <div key={ex.name} className="flex items-center gap-3" data-testid={`exchange-${ex.name.toLowerCase()}`}>
            <span className="w-24 text-xs font-medium truncate">{ex.name}</span>
            <span className="w-10 text-[10px] text-muted-foreground text-right">{ex.buy}%</span>
            <div className="flex-1 flex h-4 overflow-hidden rounded-sm">
              <div className="bg-green-500/50 transition-all" style={{ width: `${ex.buy}%` }} />
              <div className="bg-red-500/50 transition-all" style={{ width: `${ex.sell}%` }} />
            </div>
            <span className="w-10 text-[10px] text-muted-foreground">{ex.sell}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
