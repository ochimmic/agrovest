import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck, FileText, AlertTriangle, Home as HomeIcon } from "lucide-react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { Money } from "@/components/ui/money";
import { Skeleton } from "@/components/ui/skeleton";
import { useHouse, housePrice } from "@/lib/properties";
import { fmtNgn } from "@/lib/fx";

export const Route = createFileRoute("/invest/property/$id")({
  head: () => {
    const t = "House for sale | AgroVest Buy Assets";
    return { meta: [
      { title: t }, { name: "description", content: "AgroVest-priced house, 1% below market, with 3% escrow protection." },
      { property: "og:title", content: t }, { property: "og:description", content: "Buy houses directly from AgroVest with escrow protection." },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ] };
  },
  component: PropertyDetail,
});

function PropertyDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const p = useHouse(id);

  if (p === undefined) return <MobileFrame><div className="p-4 space-y-3"><Skeleton className="h-56 w-full rounded-3xl" /><Skeleton className="h-40 w-full rounded-3xl" /></div></MobileFrame>;
  if (p === null) return (
    <MobileFrame><div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
      <p className="text-sm text-muted-foreground">This house is no longer listed.</p>
      <AgroButton onClick={() => nav({ to: "/invest/property" })}>Back to Buy Assets</AgroButton>
    </div></MobileFrame>
  );

  const { agrovest, escrow, total } = housePrice(p);
  const sold = p.status === "sold";

  return (
    <MobileFrame>
      <div className="relative h-56 bg-gradient-to-br from-navy/80 to-violet/80 flex items-center justify-center">
        {p.image ? <img src={p.image} alt={p.title} width={1024} height={640} className="absolute inset-0 h-full w-full object-cover" /> : <HomeIcon size={40} className="text-white/70" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <button aria-label="Back" onClick={() => nav({ to: "/invest/property" })} className="absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] h-10 w-10 rounded-full glass flex items-center justify-center text-navy">
          <ArrowLeft size={18} />
        </button>
        <div className="absolute bottom-3 left-4 right-4 text-white">
          <p className="text-xs opacity-80">{p.category} · {p.location}</p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight">{p.title}</h1>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">
        <div>
          <p className="text-xs text-muted-foreground">Actual market price <span className="line-through">{fmtNgn(p.price)} · ${p.price.toLocaleString()}</span></p>
          <p className="mt-1 text-[11px] font-medium text-agro">AgroVest price (1% less)</p>
          <Money usd={agrovest} size="xl" emphasis="violet" layout="inline" />
          <p className="text-xs text-muted-foreground mt-1">Sold by AgroVest Direct · Escrow (3%) {fmtNgn(escrow)} · ${escrow.toLocaleString()}</p>
        </div>
        {p.description && <p className="text-sm text-foreground leading-relaxed">{p.description}</p>}
        <div className="rounded-3xl border border-border bg-card p-4 space-y-2 text-sm">
          <div className="flex items-center gap-2 text-navy">
            <ShieldCheck size={14} className={p.verified ? "text-agro" : "text-warn"} /> {p.verified ? "Verified — AgroVest has inspected this property" : "Not verified — AgroVest has not inspected this property yet"}
          </div>
          <div className="flex items-center gap-2 text-navy"><FileText size={14} className="text-violet" /> Ownership documents on file</div>
          <div className="flex items-center gap-2 text-navy"><AlertTriangle size={14} className="text-warn" /> Dispute & refund policy applies</div>
        </div>
        <section className="rounded-3xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-navy">AgroVest inspection report</h2>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div><p className="text-muted-foreground">Title document</p><p className="font-medium text-navy">{p.title_doc}</p></div>
            <div><p className="text-muted-foreground">Inspection date</p><p className="font-medium text-navy">{p.inspection_date}</p></div>
          </div>
          <ul className="mt-3 space-y-1.5 text-xs">
            {([["Survey plan checked", p.survey_ok], ["Structural inspection", p.structural_ok], ["Title search at land registry", p.title_search_ok]] as const).map(([l, ok]) => (
              <li key={l} className="flex items-center justify-between"><span className="text-foreground">{l}</span><span className={ok ? "text-agro font-medium" : "text-warn font-medium"}>{ok ? "Passed" : "Pending"}</span></li>
            ))}
          </ul>
        </section>
        {p.disclaimer && (
          <section className="rounded-3xl border border-warn/30 bg-warn/10 p-4">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-navy"><AlertTriangle size={14} className="text-warn" /> Disclaimer</h2>
            <p className="mt-1 text-xs text-foreground leading-relaxed">{p.disclaimer}</p>
          </section>
        )}
        <section className="rounded-3xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-navy">What you'll receive</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>• Contract of Sale & Deed of Assignment</li>
            <li>• AgroVest handover warranty</li>
            <li>• AgroVest escrow protection until delivery</li>
          </ul>
        </section>
      </main>

      <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-border">
        <AgroButton size="xl" disabled={sold} onClick={() => nav({ to: "/invest/checkout/$id", params: { id: p.id }, search: { kind: "property", unit: "plot", qty: 1 } })}>
          {sold ? "Sold" : `Buy now · ${fmtNgn(total)} · $${total.toLocaleString()}`}
        </AgroButton>
      </div>
    </MobileFrame>
  );
}
