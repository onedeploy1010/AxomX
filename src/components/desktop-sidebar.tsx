import { useLocation, Link } from "wouter";
import { Home, BarChart3, Brain, User, TrendingUp, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useActiveAccount } from "thirdweb/react";

const navItems = [
  { path: "/", icon: Home, labelKey: "nav.home" },
  { path: "/trade", icon: BarChart3, labelKey: "nav.trade" },
  {
    path: "/vault",
    labelKey: "nav.vault",
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <circle cx="12" cy="8" r="5" />
        <circle cx="12" cy="8" r="2" />
        <path d="M12 13v3" />
        <path d="M8 21h8" />
        <path d="M10 18h4" />
      </svg>
    ),
  },
  { path: "/strategy", icon: Brain, labelKey: "nav.strategy" },
  { path: "/market", icon: TrendingUp, labelKey: "nav.market" },
  { path: "/profile", icon: User, labelKey: "nav.profile" },
];

const profileSubItems = [
  { path: "/profile/nodes", labelKey: "profile.nodeDetailsTitle" },
  { path: "/profile/referral", labelKey: "profile.referralTeam" },
  { path: "/profile/transactions", labelKey: "profile.transactionHistory" },
  { path: "/profile/settings", labelKey: "profile.settings" },
];

export function DesktopSidebar() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const account = useActiveAccount();
  const isProfileSection = location.startsWith("/profile");

  return (
    <aside className="hidden lg:flex flex-col w-[220px] xl:w-[260px] shrink-0 sticky top-[53px] h-[calc(100vh-53px)] border-r border-border/30 bg-background/50">
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = item.path === "/" ? location === "/" : location.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link key={item.path} href={item.path}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? "text-primary bg-primary/10 shadow-[0_0_12px_rgba(0,188,165,0.08)]"
                    : "text-foreground/50 hover:text-foreground/80 hover:bg-white/[0.03]"
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-primary" : ""}`} />
                <span>{t(item.labelKey)}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Profile sub-menu when in profile section */}
      {isProfileSection && account && (
        <div className="border-t border-border/20 px-3 py-3 space-y-0.5">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-foreground/30 uppercase tracking-wider">
            {t("nav.profile")}
          </div>
          {profileSubItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-[13px] transition-all cursor-pointer ${
                    isActive
                      ? "text-primary bg-primary/8"
                      : "text-foreground/40 hover:text-foreground/70 hover:bg-white/[0.02]"
                  }`}
                >
                  <span>{t(item.labelKey)}</span>
                  <ChevronRight className="h-3.5 w-3.5 opacity-40" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Wallet status at bottom */}
      <div className="border-t border-border/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${account ? "bg-primary animate-pulse" : "bg-foreground/20"}`}
            style={account ? { boxShadow: "0 0 6px rgba(0,188,165,0.5)" } : undefined}
          />
          <span className="text-xs text-foreground/40 truncate">
            {account ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}` : t("common.notConnected")}
          </span>
        </div>
      </div>
    </aside>
  );
}
