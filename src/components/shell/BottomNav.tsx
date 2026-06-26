import { Link, useRouterState } from "@tanstack/react-router";
import { Home, TrendingUp, Wallet, MessagesSquare, User } from "lucide-react";

const tabs = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/invest", label: "Invest", icon: TrendingUp },
  { to: "/vault", label: "Vault", icon: Wallet },
  { to: "/prichat", label: "GoPay", icon: MessagesSquare },
  { to: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="sticky bottom-0 z-30 border-t border-border bg-background/85 glass">
      <ul className="grid grid-cols-5 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || pathname.startsWith(to + "/");
          return (
            <li key={to}>
              <Link
                to={to}
                className="flex flex-col items-center gap-0.5 py-1.5 text-[10px] font-medium transition-colors"
              >
                <span
                  className={`flex h-9 w-12 items-center justify-center rounded-xl transition-all ${
                    active ? "bg-violet/10 text-violet" : "text-muted-foreground"
                  }`}
                >
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                </span>
                <span className={active ? "text-violet" : "text-muted-foreground"}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
