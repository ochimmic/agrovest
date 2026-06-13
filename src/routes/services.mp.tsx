import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Star } from "lucide-react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { consultants } from "@/lib/mock-data";
import { CertifiedBadge } from "@/components/ui/agro-badge";

export const Route = createFileRoute("/services/mp")({ component: MP });

function MP() {
  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/services" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center"><ArrowLeft size={18} /></Link>
        <h1 className="font-semibold text-navy">M&P Consult</h1>
      </header>
      <div className="p-4 space-y-3">
        {consultants.map((c) => (
          <Link key={c.id} to="/services/mp/$id" params={{ id: c.id }} className="block rounded-3xl bg-card border border-border p-4">
            <div className="flex items-center gap-3">
              <span className="h-12 w-12 rounded-full gradient-violet text-white flex items-center justify-center font-semibold">{c.name[0]}</span>
              <div className="flex-1">
                <p className="font-semibold text-navy">{c.name}</p>
                <p className="text-[11px] text-muted-foreground">{c.role}</p>
              </div>
              {c.certified && <CertifiedBadge size="xs" />}
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span className="flex items-center gap-1 text-warn"><Star size={12} fill="currentColor" /> {c.rating}</span>
              <span className="font-semibold text-navy">${c.fee}/session</span>
            </div>
          </Link>
        ))}
      </div>
    </MobileFrame>
  );
}
