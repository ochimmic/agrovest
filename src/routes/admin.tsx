import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/shell/MobileFrame";
import {
  Shield,
  FileCheck,
  Store,
  AlertTriangle,
  Award,
  Gift,
  Megaphone,
  ScrollText,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/admin")({ component: Admin });

const queues = [
  {
    to: "/admin/kyc",
    icon: FileCheck,
    label: "KYC review",
    desc: "Verify investor & broker identity",
    count: 24,
    tone: "from-violet to-[oklch(0.55_0.18_295)]",
  },
  {
    to: "/admin/vendors",
    icon: Store,
    label: "Vendor approvals",
    desc: "Marketplace storefront requests",
    count: 8,
    tone: "from-agro to-emerald-700",
  },
  {
    to: "/admin/consultants",
    icon: Megaphone,
    label: "Consultant cert",
    desc: "Certify investor consultants",
    count: 3,
    tone: "from-violet to-[oklch(0.55_0.18_295)]",
  },
  {
    to: "/admin/disputes",
    icon: AlertTriangle,
    label: "Disputes",
    desc: "Open escalations & refunds",
    count: 5,
    tone: "from-[oklch(0.65_0.2_25)] to-[oklch(0.55_0.22_27)]",
  },
  {
    to: "/admin/rewards",
    icon: Gift,
    label: "Broker rewards",
    desc: "Approve milestone payouts",
    count: 12,
    tone: "from-agro to-emerald-700",
  },
  {
    to: "/admin/partners",
    icon: Award,
    label: "Partner approvals",
    desc: "Promote to partner tier",
    count: 2,
    tone: "from-violet to-[oklch(0.55_0.18_295)]",
  },
  {
    to: "/admin/audit",
    icon: ScrollText,
    label: "Audit logs",
    desc: "Operations activity trail",
    count: 0,
    tone: "from-[oklch(0.40_0.04_265)] to-[oklch(0.28_0.04_265)]",
  },
] as const;

function Admin() {
  const totalPending = queues.reduce((s, q) => s + q.count, 0);
  const slas = queues.filter((q) => q.count > 5).length;

  return (
    <MobileFrame>
      <header className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-5 gradient-navy text-white">
        <div className="flex items-center gap-2">
          <Link
            to="/profile"
            className="h-9 w-9 rounded-full bg-white/15 hover:bg-white/25 transition flex items-center justify-center"
            aria-label="Back"
          >
            ←
          </Link>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/60">Operations</p>
            <h1 className="font-semibold flex items-center gap-1.5">
              <Shield size={14} /> Admin dashboard
            </h1>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat k="Pending" v={totalPending.toString()} />
          <Stat k="At risk" v={slas.toString()} />
          <Stat k="Resolved 24h" v="17" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-2.5">
        <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold px-1">
          Queues
        </h2>
        {queues.map(({ to, icon: I, label, desc, count, tone }) => (
          <Link
            key={to}
            to={to as any}
            className="flex items-center gap-3 rounded-2xl bg-card border border-border p-3 shadow-card hover:border-violet/40 transition"
          >
            <span
              className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${tone} text-white flex items-center justify-center shrink-0`}
            >
              <I size={18} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-navy truncate">{label}</p>
                {count > 0 && (
                  <span className="rounded-full bg-violet text-white text-[10px] px-2 py-0.5 font-semibold">
                    {count}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground truncate">{desc}</p>
            </div>
            <ChevronRight size={16} className="text-muted-foreground" />
          </Link>
        ))}
      </div>
    </MobileFrame>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-2xl bg-white/10 border border-white/10 p-2.5">
      <p className="text-[10px] text-white/60 uppercase tracking-wide">{k}</p>
      <p className="mt-0.5 text-base font-semibold">{v}</p>
    </div>
  );
}
