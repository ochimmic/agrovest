import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Home as HomeIcon } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { AgroBadge } from "@/components/ui/agro-badge";
import { Money } from "@/components/ui/money";
import { Skeleton } from "@/components/ui/skeleton";
import { useHouses, housePrice } from "@/lib/properties";
import { fmtNgn } from "@/lib/fx";

export const Route = createFileRoute("/invest/property/")({
  head: () => ({
    meta: [
      { title: "Buy Assets — Houses by AgroVest" },
      { name: "description", content: "Houses inspected, titled and sold directly by AgroVest — 1% below market with 3% escrow protection." },
      { property: "og:title", content: "Buy Assets — Houses by AgroVest" },
      { property: "og:description", content: "Verified houses sold directly by AgroVest, priced 1% below market." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Properties,
});

function Properties() {
  const [q, setQ] = useState("");
  const { houses } = useHouses();
  const list = (houses ?? []).filter((p) => (p.title + p.location).toLowerCase().includes(q.toLowerCase()));

  return (
    <AppShell>
      <div className="px-4 pt-3 pb-6 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Buy Assets</h1>
          <p className="text-sm text-muted-foreground">Houses inspected and priced by AgroVest — 1% below market.</p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 h-11">
          <Search size={16} className="text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search houses or locations" className="flex-1 bg-transparent text-sm outline-none" />
        </div>

        <div className="space-y-3">
          {houses === null && [0, 1].map((i) => <Skeleton key={i} className="h-72 w-full rounded-3xl" />)}
          {list.map((p) => {
            const fees = housePrice(p);
            return (
              <Link key={p.id} to="/invest/property/$id" params={{ id: p.id }} className="block rounded-3xl border border-border bg-card overflow-hidden shadow-card">
                <div className="h-40 bg-gradient-to-br from-navy/80 to-violet/80 relative flex items-center justify-center">
                  {p.image ? <img src={p.image} alt={p.title} loading="lazy" width={1024} height={640} className="absolute inset-0 h-full w-full object-cover" /> : <HomeIcon size={32} className="text-white/70" />}
                  <span className="absolute top-2 left-2">
                    {p.verified ? <AgroBadge tone="agro" size="xs">Verified by AgroVest</AgroBadge> : <AgroBadge tone="warn" size="xs">Not verified</AgroBadge>}
                  </span>
                  <span className="absolute top-2 right-2"><AgroBadge tone={p.status === "sold" ? "danger" : "neutral"} size="xs">{p.status === "sold" ? "Sold" : p.category}</AgroBadge></span>
                </div>
                <div className="p-4">
                  <p className="font-semibold text-navy">{p.title}</p>
                  <p className="text-[11px] text-muted-foreground">{p.location} · AgroVest Direct</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <AgroBadge tone={p.verified ? "violet" : "warn"} size="xs">Title: {p.title_doc}</AgroBadge>
                    <AgroBadge tone="neutral" size="xs">Inspected: {p.inspection_date}</AgroBadge>
                  </div>
                  <div className="mt-1.5">
                    <p className="text-[11px] text-muted-foreground line-through">Market {fmtNgn(p.price)} · ${p.price.toLocaleString()}</p>
                    <Money usd={fees.agrovest} size="md" emphasis="violet" layout="inline" />
                  </div>
                </div>
              </Link>
            );
          })}
          {houses !== null && list.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-xs text-muted-foreground">No houses listed right now. Check back soon.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
