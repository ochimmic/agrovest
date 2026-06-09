import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { Shield, FileCheck, Store, AlertTriangle, Award, Gift, Megaphone, ScrollText } from "lucide-react";

export const Route = createFileRoute("/admin")({ component: Admin });

const queues = [
  { to: "/admin/kyc", icon: FileCheck, label: "KYC review", count: 24 },
  { to: "/admin/vendors", icon: Store, label: "Vendor approvals", count: 8 },
  { to: "/admin/consultants", icon: Megaphone, label: "Consultant cert", count: 3 },
  { to: "/admin/disputes", icon: AlertTriangle, label: "Disputes", count: 5 },
  { to: "/admin/rewards", icon: Gift, label: "Broker rewards", count: 12 },
  { to: "/admin/partners", icon: Award, label: "Partner approvals", count: 2 },
  { to: "/admin/audit", icon: ScrollText, label: "Audit logs", count: 0 },
];

function Admin() {
  return (
    <MobileFrame>
      <header className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 gradient-navy text-white">
        <div className="flex items-center gap-2">
          <Link to="/profile" className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center text-sm">←</Link>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/60">Operations</p>
            <h1 className="font-semibold flex items-center gap-1"><Shield size={14} /> Admin dashboard</h1>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 grid grid-cols-2 gap-3">
        {queues.map(({ to, icon: I, label, count }) => (
          <Link key={to} to={to as any} className="rounded-3xl bg-card border border-border p-4 shadow-card">
            <div className="flex items-center justify-between">
              <span className="h-10 w-10 rounded-2xl bg-violet-soft text-violet flex items-center justify-center"><I size={18} /></span>
              <span className="rounded-full bg-violet text-white text-[10px] px-2 py-0.5 font-semibold">{count}</span>
            </div>
            <p className="mt-3 text-sm font-semibold text-navy">{label}</p>
          </Link>
        ))}
      </div>
    </MobileFrame>
  );
}
