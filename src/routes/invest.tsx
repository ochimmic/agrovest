import { createFileRoute, Link } from "@tanstack/react-router";
import { Sprout, Building2, Sparkles, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { farmAssets } from "@/lib/mock-data";

export const Route = createFileRoute("/invest")({ component: Invest });

function Invest() {
  return (
    <AppShell>
      <div className="px-4 pt-3 pb-6 space-y-5">
        <section className="rounded-3xl gradient-violet p-5 text-white shadow-glow">
          <Sparkles size={18} className="opacity-80" />
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Invest with confidence</h1>
          <p className="mt-1 text-sm text-white/80">
            Real assets · verified custody · clear documents.
          </p>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/invest/farmvest"
            className="rounded-3xl border border-border bg-card p-4 shadow-card"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-agro-soft text-agro">
              <Sprout size={18} />
            </span>
            <p className="mt-3 text-sm font-semibold text-navy">FarmVest</p>
            <p className="text-[11px] text-muted-foreground">Plot · Acre · Hectare</p>
          </Link>
          <Link
            to="/invest/property"
            className="rounded-3xl border border-border bg-card p-4 shadow-card"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-soft text-violet">
              <Building2 size={18} />
            </span>
            <p className="mt-3 text-sm font-semibold text-navy">Buy Assets</p>
            <p className="text-[11px] text-muted-foreground">Real estate · Auto · Home</p>
          </Link>
        </div>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-navy">Featured opportunities</h2>
          <div className="space-y-3">
            {farmAssets.map((a) => (
              <Link
                key={a.id}
                to="/invest/farmvest/$id"
                params={{ id: a.id }}
                className="flex items-center gap-3 rounded-3xl border border-border bg-card p-3 shadow-card"
              >
                <div className={`h-16 w-16 shrink-0 rounded-2xl bg-gradient-to-br ${a.cover}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy">{a.name}</p>
                  <p className="text-[11px] text-muted-foreground">{a.location}</p>
                  <div className="mt-1 flex items-center gap-2 text-[11px]">
                    <span className="text-agro font-semibold">{a.expectedYield}</span>
                    <span className="text-muted-foreground">· {a.appreciation}</span>
                  </div>
                </div>
                <ArrowRight size={16} className="text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
