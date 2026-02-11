import { Skeleton } from "@/components/ui/skeleton";

interface ExchangeRow {
  name: string;
  buy: number;
  sell: number;
}

const EXCHANGES: ExchangeRow[] = [
  { name: "LBank", buy: 48.9, sell: 51.1 },
  { name: "CoinEx", buy: 47.9, sell: 52.1 },
  { name: "Gate", buy: 47.0, sell: 53.0 },
  { name: "Bitunix", buy: 47.0, sell: 53.0 },
  { name: "Bitmex", buy: 46.5, sell: 53.5 },
  { name: "Kraken", buy: 46.5, sell: 53.5 },
  { name: "MEXC", buy: 44.4, sell: 55.6 },
  { name: "Crypto.com", buy: 46.2, sell: 53.8 },
  { name: "Coinbase", buy: 46.0, sell: 54.0 },
  { name: "Binance", buy: 45.8, sell: 54.2 },
  { name: "OKX", buy: 45.8, sell: 54.2 },
  { name: "Bitget", buy: 45.4, sell: 54.6 },
  { name: "Bybit", buy: 44.3, sell: 55.7 },
  { name: "Hyperliquid", buy: 43.5, sell: 56.5 },
];

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
