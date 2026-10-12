import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ShieldCheck, FileText, TrendingUp, BellRing, Timer } from "lucide-react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { farmAssets, priceFor } from "@/lib/mock-data";
import { getState } from "@/lib/store";
import { toast } from "sonner";
import { Money } from "@/components/ui/money";
import {
  CustodyBackedBadge, OnChainBadge, BscBadge, ProjectedBadge,
  NotAdviceBadge, RiskBadge, ComingSoonBadge, EscrowReserveBadge,
} from "@/components/ui/agro-badge";


export const Route = createFileRoute("/invest/farmvest/$id")({ component: Detail });

type Unit = "plot" | "acre" | "hectare";

function Detail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const asset = farmAssets.find((a) => a.id === id) ?? farmAssets[0];
  const [unit, setUnit] = useState<Unit>("plot");
  const [qty, setQty] = useState(1);

  const p = priceFor(unit, qty);

  function proceed() {
    if (getState().kyc !== "approved") {
      toast.warning("Verify your identity to continue.");
      nav({ to: "/kyc" });
      return;
    }
    nav({ to: "/invest/checkout/$id", params: { id: asset.id }, search: { unit, qty } as any });
  }

  return (
    <MobileFrame>
      <div className={`relative h-56 bg-gradient-to-br ${asset.cover} bg-cover bg-center`} style={asset.image ? { backgroundImage: `url(${asset.image})` } : undefined}>
        {asset.image && <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10" />}
        <Link
          to="/invest/farmvest"
          className="absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] flex h-10 w-10 items-center justify-center rounded-full glass text-navy"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="absolute bottom-3 left-4 right-4 text-white">
          <p className="text-xs opacity-80">{asset.location}</p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">{asset.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {asset.comingSoon ? (
              <ComingSoonBadge size="xs" eta={asset.launchEta} />
            ) : (
              <>
                <CustodyBackedBadge size="xs" />
                <OnChainBadge size="xs" />
                <BscBadge size="xs" />
                <ProjectedBadge size="xs" />
              </>
            )}
          </div>
        </div>
      </div>


      <main className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <NotAdviceBadge size="xs" />
        </div>


        {asset.comingSoon && (
          <section className="rounded-3xl border border-violet/20 bg-violet-soft/40 p-4">
            <div className="flex items-center gap-2">
              <Timer size={14} className="text-violet" />
              <h2 className="text-sm font-semibold text-navy">
                Opening {asset.launchEta ?? "soon"}
              </h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Units aren't on sale yet. Join the notify list and we'll alert you the moment funding opens.
            </p>
          </section>
        )}

        <div className="grid grid-cols-3 gap-2 text-center">
          <Pill k="Yield" v={asset.expectedYield} icon={<TrendingUp size={12} />} />
          <Pill k="Appreciation" v={asset.appreciation} />
          <Pill k="Risk" v={asset.risk} />
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">{asset.description}</p>

        {!asset.comingSoon && (
          <section className="rounded-3xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold text-navy">Choose unit</h2>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(["plot", "acre", "hectare"] as Unit[]).map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={`rounded-xl py-2.5 text-xs font-medium capitalize transition ${
                    unit === u ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              6 plots = 1 acre · 2.5 acres = 1 hectare (15 plots) · ₦950,000 + ₦200,000 management fee per plot
            </p>

            <div className="mt-4 flex items-center justify-between rounded-2xl bg-secondary p-3">
              <span className="text-sm font-medium text-navy">Quantity</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQty(Math.max(unit === "plot" ? 0.5 : 0.5, qty - 0.5))}
                  className="h-8 w-8 rounded-full bg-background text-foreground border border-border shadow-card"
                >−</button>
                <span className="w-8 text-center text-sm font-semibold tabular">{qty}</span>
                <button
                  onClick={() => setQty(qty + 0.5)}
                  className="h-8 w-8 rounded-full bg-background text-foreground border border-border shadow-card"
                >+</button>
              </div>
            </div>
          </section>
        )}

        {!asset.comingSoon && (
          <section className="rounded-3xl border border-border bg-card p-4">
            <h2 className="flex items-center justify-between text-sm font-semibold text-navy">
              <span>Price breakdown</span>
              
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              <RowMoney k={`Land · ${p.plots} plot${p.plots === 1 ? "" : "s"}`} usd={p.base} />
              {p.discount > 0 && (
                <RowMoney k={`Size discount (${p.discountPct}%)`} usd={-p.discount} accent />
              )}
              <RowMoney k="Management fee (non-refundable)" usd={p.managementFee} />
              <div className="border-t border-border my-2" />
              <RowMoney k="Final payable" usd={p.final} bold />
            </dl>
            <p className="mt-3 text-[10px] text-muted-foreground leading-relaxed">
              The ₦200,000 per plot management fee pays for caring for your land and crops. It is
              non-refundable. Discounts: 2% from 1 acre, 3% from 12 acres, 4% from 24 hectares.
            </p>
          </section>
        )}

        <section className="rounded-3xl border border-border bg-card p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-navy">
            <FileText size={14} className="text-violet" /> Documents you'll receive
          </h2>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>• Contract of Sale</li>
            <li>• Deed of Assignment</li>
            <li>• Survey Plan</li>
            <li>• Right of Occupancy (RofO)</li>
          </ul>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            <span className="font-medium text-navy">Contract of Sale</span> and{" "}
            <span className="font-medium text-navy">Deed of Assignment</span> are issued within{" "}
            <span className="font-medium text-navy">48 hours</span>.{" "}
            <span className="font-medium text-navy">Survey Plan</span> and{" "}
            <span className="font-medium text-navy">RofO</span> are under government review with a{" "}
            <span className="font-medium text-navy">3–12 month</span> timeline.
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-navy">
            <TrendingUp size={14} className="text-agro" /> Yield schedule
          </h2>
          <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
            Maturity begins between the 3rd and 4th year. Annual ROI is 30% in Year 3,
            40% in Year 4 and <span className="font-medium text-navy">50% every year from Year 5</span> onward.
          </p>
          <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
            {[
              { y: "Y1–2", pct: "0%", tone: "muted" },
              { y: "Y3", pct: "30%", tone: "agro" },
              { y: "Y4", pct: "40%", tone: "agro" },
              { y: "Y5+", pct: "50%", tone: "agro" },
            ].map((s) => {
              const toneCls =
                s.tone === "agro"
                  ? "bg-agro-soft text-agro"
                  : s.tone === "warn"
                    ? "bg-warn/15 text-warn"
                    : "bg-secondary text-muted-foreground";
              return (
                <div key={s.y} className={`rounded-xl px-1 py-2 ${toneCls}`}>
                  <p className="text-[10px] font-medium opacity-80">{s.y}</p>
                  <p className="mt-0.5 text-xs font-semibold">{s.pct}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl bg-violet-soft/50 border border-violet/20 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
            <ShieldCheck size={14} className="text-violet" /> Investment timeline
          </h3>
          <ol className="mt-3 space-y-2 text-xs text-muted-foreground">
            {["Payment confirmed", "AgroVest review", "Documents issued", "Asset active", "Returns & appreciation updates"].map((s, i) => (
              <li key={s} className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-violet text-white text-[10px] font-semibold">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </section>

        <p className="text-[10px] text-muted-foreground text-center">
          Projected values are estimates based on available asset information and market projections.
          Actual results may vary.
        </p>
      </main>

      <div className="border-t border-border bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {asset.comingSoon ? (
          <AgroButton
            size="xl"
            onClick={() => toast.success(`We'll notify you when ${asset.name} opens.`)}
          >
            <BellRing size={16} className="mr-1.5 inline" /> Notify me when it launches
          </AgroButton>
        ) : (
          <>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <Money usd={p.final} layout="inline" size="md" emphasis="primary" />
            </div>
            <AgroButton size="xl" onClick={proceed}>Continue to checkout</AgroButton>
          </>
        )}
      </div>
    </MobileFrame>
  );
}


function Pill({ k, v, icon }: { k: string; v: string; icon?: any }) {
  return (
    <div className="rounded-2xl bg-card border border-border py-2.5 px-2">
      <p className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">{icon}{k}</p>
      <p className="mt-1 text-xs font-semibold text-navy">{v}</p>
    </div>
  );
}
function RowMoney({ k, usd, bold, accent, muted }: { k: string; usd: number; bold?: boolean; accent?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <Money
        usd={usd}
        layout="inline"
        size={bold ? "md" : "sm"}
        emphasis={accent ? "agro" : muted ? "muted" : "primary"}
      />
    </div>
  );
}

