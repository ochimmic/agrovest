import { createFileRoute, Link } from "@tanstack/react-router";
import { LineChart, Store, Handshake, Lock, ChevronRight } from "lucide-react";
import { MobileFrame } from "@/components/shell/MobileFrame";

export const Route = createFileRoute("/role-select")({ component: RoleSelect });

const roles = [
  { id: "investor", t: "Investor", s: "Invest in FarmVest & real-world assets with full custody docs.", Icon: LineChart, accent: "from-violet to-fuchsia-500" },
  { id: "vendor", t: "Vendor", s: "Apply to list verified assets or products on AgroVest.", Icon: Store, accent: "from-amber-400 to-rose-500" },
  { id: "broker", t: "Broker", s: "Refer deals and earn commission + land/car rewards.", Icon: Handshake, accent: "from-agro to-teal-500" },
] as const;

function RoleSelect() {
  return (
    <MobileFrame>
      <div className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-violet font-semibold">Step 1 of 3</p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-navy">
          How will you use AgroVest?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose your category. Each path has different verification requirements.
        </p>

        <div className="mt-6 grid gap-3">
          {roles.map(({ id, t, s, Icon, accent }) => (
            <Link
              key={id}
              to="/signup/$role"
              params={{ role: id }}
              className="group flex items-center gap-4 rounded-3xl border border-border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-pop"
            >
              <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-glow`}>
                <Icon size={20} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-navy">{t}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{s}</p>
              </div>
              <ChevronRight className="text-muted-foreground group-hover:text-violet" size={18} />
            </Link>
          ))}
        </div>

        <div className="mt-6 rounded-3xl border border-dashed border-violet/30 bg-violet-soft/40 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet/15 text-violet">
              <Lock size={16} />
            </span>
            <div>
              <p className="text-sm font-semibold text-navy">Partner — locked</p>
              <p className="text-xs text-muted-foreground">
                Partner status is unlocked after verified commitment and AgroVest approval.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Already onboarded?{" "}
          <Link to="/login" className="text-violet font-medium">Sign in</Link>
        </p>
      </div>
    </MobileFrame>
  );
}
