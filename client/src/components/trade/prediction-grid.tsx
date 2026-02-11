import { useMemo } from "react";

interface PredictionGridProps {
  wins: number;
  losses: number;
}

export function PredictionGrid({ wins, losses }: PredictionGridProps) {
  const cells = useMemo(
    () =>
      Array.from({ length: 54 }, () => ({
        direction: Math.random() > 0.5 ? ("up" as const) : ("down" as const),
        hit: Math.random() > 0.6,
      })),
    []
  );

  return (
    <div className="grid grid-cols-9 gap-1" data-testid="prediction-grid">
      {cells.map((cell, i) => (
        <div
          key={i}
          className={`flex items-center justify-center h-8 rounded-sm text-[10px] font-bold transition-colors ${
            cell.hit
              ? cell.direction === "up"
                ? "bg-green-500/30 text-green-400"
                : "bg-red-500/30 text-red-400"
              : cell.direction === "up"
                ? "bg-green-500/10 text-green-500/40"
                : "bg-red-500/10 text-red-500/40"
          }`}
        >
          {cell.direction === "up" ? "\u2191" : "\u2193"}
        </div>
      ))}
    </div>
  );
}
