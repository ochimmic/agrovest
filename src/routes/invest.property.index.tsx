import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Plus, Search } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { properties, propertyFees } from "@/lib/mock-data";
import { VendorVerifiedBadge, AgroBadge } from "@/components/ui/agro-badge";
import { Money } from "@/components/ui/money";


export const Route = createFileRoute("/invest/property/")({ component: Properties });

const cats = ["All", "House"] as const;

function Properties() {
  const [cat, setCat] = useState<(typeof cats)[number]>("All");
  const [q, setQ] = useState("");
  const list = properties.filter(
    (p) =>
      (cat === "All" || p.category === cat) &&
      p.title.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <AppShell>
      <div className="px-4 pt-3 pb-6 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Buy Assets</h1>
          <p className="text-sm text-muted-foreground">Houses inspected and priced by AgroVest — 1% below market.</p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 h-11">
          <Search size={16} className="text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search assets"
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`shrink-0 h-9 rounded-full px-3.5 text-xs font-medium transition ${
                cat === c ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {list.map((p) => (
            <Link
              key={p.id}
              to="/invest/property/$id"
              params={{ id: p.id }}
              className="block rounded-3xl border border-border bg-card overflow-hidden shadow-card"
            >
              <div className="h-40 bg-gradient-to-br from-navy/80 to-violet/80 relative">
                <img src={p.image} alt={p.title} loading="lazy" width={1024} height={640} className="absolute inset-0 h-full w-full object-cover" />
                <span className="absolute top-2 left-2">
                  {p.verified ? <VendorVerifiedBadge size="xs" /> : <AgroBadge tone="warn" size="xs">Not verified</AgroBadge>}
                </span>
                <span className="absolute top-2 right-2"><AgroBadge tone="neutral" size="xs">{p.category}</AgroBadge></span>
              </div>
              <div className="p-4">
                <p className="font-semibold text-navy">{p.title}</p>
                <p className="text-[11px] text-muted-foreground">{p.location} · {p.vendor}</p>
                <div className="mt-1.5">
                  <p className="text-[11px] text-muted-foreground line-through">Market ${p.price.toLocaleString()}</p>
                  <Money usd={propertyFees(p.price).agrovest} size="md" emphasis="violet" layout="inline" />
                </div>
              </div>
            </Link>
          ))}

          {list.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-xs text-muted-foreground">
              No assets match your filters.
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-dashed border-border bg-card p-4 text-center text-xs text-muted-foreground">
          <Plus size={14} className="inline mr-1" />
          Vendor? <Link to="/vendor/apply" className="text-violet font-medium">Apply to list</Link>
        </div>
      </div>
    </AppShell>
  );
}
