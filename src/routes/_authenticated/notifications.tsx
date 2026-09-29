import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { Bell } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_authenticated/notifications")({ component: Notifs });
function Notifs() {
  const items = [
    { t: "Custody receipt issued", s: "Cross River Palm — Issued", time: "2m" },
    { t: "KYC under review", s: "Typically within 24h", time: "1h" },
    { t: "New FarmVest opportunity", s: "Ondo Cocoa Belt now open", time: "1d" },
  ];
  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/home" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">←</Link>
        <h1 className="font-semibold text-navy">Notifications</h1>
      </header>
      <div className="p-4 space-y-2">
        {items.map((n, i) => (
          <div key={i} className="flex gap-3 rounded-2xl bg-card border border-border p-3">
            <span className="h-9 w-9 rounded-xl bg-violet-soft text-violet flex items-center justify-center"><Bell size={15} /></span>
            <div className="flex-1">
              <p className="text-sm font-medium text-navy">{n.t}</p>
              <p className="text-[11px] text-muted-foreground">{n.s}</p>
            </div>
            <span className="text-[10px] text-muted-foreground">{n.time}</span>
          </div>
        ))}
      </div>
    </MobileFrame>
  );
}
