import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/shell/MobileFrame";

export const Route = createFileRoute("/admin/audit")({ component: Page });
function Page() {
  const logs = [
    { t: "KYC approved — user_4421", at: "10:42 AM" },
    { t: "Vendor approved — PrimeAuto", at: "09:18 AM" },
    { t: "Document issued — Custody Receipt #d213", at: "Yesterday" },
  ];
  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/admin" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">←</Link>
        <h1 className="font-semibold text-navy">Audit logs</h1>
      </header>
      <ul className="p-4 space-y-2">
        {logs.map((l, i) => (
          <li key={i} className="rounded-2xl bg-card border border-border p-3">
            <p className="text-sm text-navy">{l.t}</p>
            <p className="text-[11px] text-muted-foreground">{l.at}</p>
          </li>
        ))}
      </ul>
    </MobileFrame>
  );
}
