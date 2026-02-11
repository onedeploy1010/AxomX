import { BarChart3, Headphones, Globe, LogOut, ChevronRight } from "lucide-react";

const items = [
  { icon: BarChart3, label: "Leaderboard" },
  { icon: Headphones, label: "Contact Us" },
  { icon: Globe, label: "Language Settings" },
  { icon: LogOut, label: "Disconnect Wallet" },
];

export function SettingsList() {
  return (
    <div className="space-y-1">
      {items.map((item) => (
        <button
          key={item.label}
          className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-3 text-sm hover-elevate"
          data-testid={`button-${item.label.toLowerCase().replace(/\s/g, "-")}`}
        >
          <div className="flex items-center gap-3">
            <item.icon className="h-4 w-4 text-muted-foreground" />
            <span>{item.label}</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      ))}
    </div>
  );
}
