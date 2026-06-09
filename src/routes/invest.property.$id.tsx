import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck, FileText, AlertTriangle } from "lucide-react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { properties } from "@/lib/mock-data";

export const Route = createFileRoute("/invest/property/$id")({ component: PropertyDetail });

function PropertyDetail() {
  const { id } = Route.useParams();
  const p = properties.find((x) => x.id === id) ?? properties[0];
  return (
    <MobileFrame>
      <div className="relative h-52 bg-gradient-to-br from-navy/80 to-violet/80">
        <Link to="/invest/property" className="absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] h-10 w-10 rounded-full glass flex items-center justify-center">
          <ArrowLeft size={18} />
        </Link>
      </div>
      <main className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">
        <div>
          <p className="text-xs text-muted-foreground">{p.category} · {p.location}</p>
          <h1 className="text-2xl font-semibold text-navy">{p.title}</h1>
          <p className="mt-1 text-xl font-semibold text-violet">${p.price.toLocaleString()}</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-4 space-y-2 text-sm">
          <div className="flex items-center gap-2 text-navy"><ShieldCheck size={14} className="text-agro" /> Vendor verified — {p.vendor}</div>
          <div className="flex items-center gap-2 text-navy"><FileText size={14} className="text-violet" /> Documents available</div>
          <div className="flex items-center gap-2 text-navy"><AlertTriangle size={14} className="text-warn" /> Dispute & refund policy applies</div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          All property listings undergo AgroVest verification. Review ownership documents and vendor profile before purchase.
        </p>
      </main>
      <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-border">
        <AgroButton size="xl">Request to purchase</AgroButton>
      </div>
    </MobileFrame>
  );
}
