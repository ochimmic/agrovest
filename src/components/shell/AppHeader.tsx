import { Link } from "@tanstack/react-router";
import { Bell, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useAppState } from "@/lib/store";

export function AppHeader({ subtitle }: { subtitle?: string }) {
  const count = useAppState((s) => s.notificationCount);
  return (
    <header className="sticky top-0 z-20 glass border-b border-border px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2.5">
      <div className="flex items-center justify-between">
        <Logo size={26} />
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-agro-soft px-2 py-1 text-[10px] font-medium text-agro">
            <ShieldCheck size={12} /> Secure
          </span>
          <Link
            to="/notifications"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
          >
            <Bell size={17} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-violet px-1 text-[9px] font-semibold text-white">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
      {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
    </header>
  );
}
