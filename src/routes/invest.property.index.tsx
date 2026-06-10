import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Plus, Search } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { properties } from "@/lib/mock-data";

export const Route = createFileRoute("/invest/property/")({ component: Properties });

const cats = ["All", "Real Estate", "Automobile", "Household"] as const;

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
          <p className="text-sm text-muted-foreground">Curated, verified listings only.</p>
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
                cat === c ? "bg-navy text-white" : "bg-secondary text-secondary-foreground"
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
              <div className="h-32 bg-gradient-to-br from-navy/80 to-violet/80 relative">
                {p.verified && (
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-agro">
                    <ShieldCheck size={11} /> Verified
                  </span>
                )}
                <span className="absolute top-2 right-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-navy">
                  {p.category}
                </span>
              </div>
              <div className="p-4">
                <p className="font-semibold text-navy">{p.title}</p>
                <p className="text-[11px] text-muted-foreground">{p.location} · {p.vendor}</p>
                <p className="mt-1 text-sm font-semibold text-violet">${p.price.toLocaleString()}</p>
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
