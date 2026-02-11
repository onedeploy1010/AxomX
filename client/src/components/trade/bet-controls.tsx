import { Button } from "@/components/ui/button";
import { Minus, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { BET_DEFAULTS } from "@/lib/data";

interface BetControlsProps {
  amount: number;
  onAmountChange: (amount: number) => void;
  duration: string;
}

export function BetControls({ amount, onAmountChange, duration }: BetControlsProps) {
  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md px-4 py-3">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="secondary"
              onClick={() => onAmountChange(Math.max(BET_DEFAULTS.minAmount, amount - BET_DEFAULTS.step))}
              data-testid="button-decrease-bet"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold" data-testid="text-bet-amount">${amount}</span>
              <span className="text-[10px] text-muted-foreground">Stake</span>
            </div>
            <Button
              size="icon"
              variant="secondary"
              onClick={() => onAmountChange(amount + BET_DEFAULTS.step)}
              data-testid="button-increase-bet"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost"><ChevronLeft className="h-4 w-4" /></Button>
            <div className="text-center">
              <span className="text-lg font-bold">{duration}</span>
              <div className="text-[10px] text-muted-foreground">Duration</div>
            </div>
            <Button size="icon" variant="ghost"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="flex gap-3">
          <Button className="flex-1 bg-red-500 text-white font-bold border-none" data-testid="button-bear">
            Bear
            <span className="ml-1 text-xs opacity-80">{BET_DEFAULTS.payoutPercent}%</span>
          </Button>
          <Button className="flex-1 bg-green-500 text-white font-bold border-none" data-testid="button-bull">
            Bull
            <span className="ml-1 text-xs opacity-80">{BET_DEFAULTS.payoutPercent}%</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
