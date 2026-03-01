import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, Sparkles, ChevronLeft, ChevronRight, Crown } from "lucide-react";
import { formatUSD } from "@/lib/constants";
import { useTranslation } from "react-i18next";

interface ForecastItem {
  model: string;
  direction: string;
  confidence: number;
  currentPrice: number;
  targetPrice: number;
  reasoning: string;
}

interface AiModelCarouselProps {
  forecasts: ForecastItem[] | undefined;
  isLoading: boolean;
  activeModel: string | null;
  onSelectModel: (model: string) => void;
}

const MODEL_META: Record<string, { color: string; accent: string }> = {
  "GPT-4o":     { color: "rgba(16,163,127,0.15)",  accent: "#10a37f" },
  "Claude":     { color: "rgba(204,132,63,0.15)",   accent: "#cc843f" },
  "Gemini":     { color: "rgba(66,133,244,0.15)",   accent: "#4285f4" },
  "DeepSeek":   { color: "rgba(99,102,241,0.15)",   accent: "#6366f1" },
  "Grok":       { color: "rgba(239,68,68,0.15)",    accent: "#ef4444" },
  "Llama 3.1":  { color: "rgba(0,136,255,0.15)",    accent: "#0088ff" },
  "Llama 8B":   { color: "rgba(0,136,255,0.15)",    accent: "#0078dd" },
  "Mistral":    { color: "rgba(255,116,0,0.15)",    accent: "#ff7400" },
  "Gemma":      { color: "rgba(66,133,244,0.15)",   accent: "#4285f4" },
  "Qwen":       { color: "rgba(115,75,209,0.15)",   accent: "#734bd1" },
};

function getModelMeta(model: string) {
  return MODEL_META[model] || { color: "rgba(100,100,100,0.15)", accent: "#888" };
}

export function AiModelCarousel({ forecasts, isLoading, activeModel, onSelectModel }: AiModelCarouselProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollPos, setScrollPos] = useState(0);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 240;
    const newPos = dir === "left" ? scrollPos - amount : scrollPos + amount;
    scrollRef.current.scrollTo({ left: newPos, behavior: "smooth" });
    setScrollPos(newPos);
  };

  const handleScroll = () => {
    if (scrollRef.current) setScrollPos(scrollRef.current.scrollLeft);
  };

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-hidden px-0.5">
        {[0, 1, 2].map(i => (
          <Skeleton key={i} className="h-[140px] min-w-[220px] rounded-xl shrink-0" />
        ))}
      </div>
    );
  }

  if (!forecasts || forecasts.length === 0) return null;

  const canScrollLeft = scrollPos > 5;
  const canScrollRight = scrollRef.current
    ? scrollPos < scrollRef.current.scrollWidth - scrollRef.current.clientWidth - 5
    : true;

  return (
    <div className="relative">
      {/* Scroll arrows */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute -left-1 top-1/2 -translate-y-1/2 z-10 h-7 w-7 rounded-full bg-background/80 backdrop-blur border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      {canScrollRight && forecasts.length > 1 && (
        <button
          onClick={() => scroll("right")}
          className="absolute -right-1 top-1/2 -translate-y-1/2 z-10 h-7 w-7 rounded-full bg-background/80 backdrop-blur border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* Scrollable cards */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-0.5 pb-1 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {forecasts.map((f, idx) => {
          const meta = getModelMeta(f.model);
          const isBest = idx === 0;
          const isActive = activeModel === f.model;
          const isBullish = f.direction === "BULLISH";
          const isBearish = f.direction === "BEARISH";
          const priceDiff = f.currentPrice ? ((f.targetPrice - f.currentPrice) / f.currentPrice * 100) : 0;

          return (
            <button
              key={f.model}
              className={`
                relative min-w-[220px] max-w-[240px] rounded-xl p-3 text-left shrink-0 snap-start
                transition-all duration-300 border
                ${isActive
                  ? "border-[var(--accent)] shadow-[0_0_15px_var(--glow)]"
                  : "border-white/[0.06] hover:border-white/[0.12]"
                }
              `}
              style={{
                background: `linear-gradient(135deg, ${meta.color} 0%, rgba(10,15,12,0.9) 100%)`,
                "--accent": meta.accent,
                "--glow": `${meta.accent}33`,
              } as React.CSSProperties}
              onClick={() => onSelectModel(f.model)}
            >
              {/* Best badge */}
              {isBest && (
                <div className="absolute -top-2 right-3 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Crown className="h-2.5 w-2.5" />
                  BEST
                </div>
              )}

              {/* Model header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-5 w-5 rounded-md flex items-center justify-center text-[10px] font-black"
                    style={{ backgroundColor: meta.accent, color: "#fff" }}
                  >
                    {f.model[0]}
                  </div>
                  <span className="text-[12px] font-bold text-foreground/90">{f.model}</span>
                </div>
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: meta.accent }} />
                )}
              </div>

              {/* Direction + confidence */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  {isBullish ? (
                    <TrendingUp className="h-4 w-4 text-[#00e7a0]" />
                  ) : isBearish ? (
                    <TrendingDown className="h-4 w-4 text-[#ff4976]" />
                  ) : (
                    <Minus className="h-4 w-4 text-yellow-400" />
                  )}
                  <span className={`text-sm font-bold ${isBullish ? "text-[#00e7a0]" : isBearish ? "text-[#ff4976]" : "text-yellow-400"}`}>
                    {f.direction}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold border-0 px-1.5 py-0"
                  style={{ backgroundColor: `${meta.accent}20`, color: meta.accent }}
                >
                  {f.confidence}%
                </Badge>
              </div>

              {/* Price info */}
              <div className="flex items-center justify-between mb-2 text-[11px]">
                <span className="text-muted-foreground">{t("dashboard.target")}</span>
                <span className="font-mono font-semibold text-foreground/85">
                  {formatUSD(f.targetPrice)}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2 text-[11px]">
                <span className="text-muted-foreground">{t("dashboard.expectedChange")}</span>
                <span className={`font-mono font-bold ${priceDiff >= 0 ? "text-[#00e7a0]" : "text-[#ff4976]"}`}>
                  {priceDiff >= 0 ? "+" : ""}{priceDiff.toFixed(2)}%
                </span>
              </div>

              {/* Reasoning */}
              <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
                <Sparkles className="inline h-2 w-2 mr-0.5 text-amber-400" />
                {f.reasoning}
              </p>
            </button>
          );
        })}
      </div>

      {/* Dot indicators */}
      {forecasts.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {forecasts.map((f) => (
            <button
              key={f.model}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeModel === f.model ? "w-4" : "w-1.5"
              }`}
              style={{
                backgroundColor: activeModel === f.model
                  ? getModelMeta(f.model).accent
                  : "rgba(255,255,255,0.15)",
              }}
              onClick={() => onSelectModel(f.model)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
