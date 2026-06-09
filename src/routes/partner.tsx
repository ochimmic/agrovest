import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, Lock, Check, ShieldCheck } from "lucide-react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { useAppState } from "@/lib/store";

export const Route = createFileRoute("/partner")({ component: Partner });

const requirements = [
  { t: "KYC fully approved", done: true },
  { t: "Min. investment volume ($25k)", done: false },
  { t: "12-month commitment", done: false },
  { t: "AgroVest review & approval", done: false },
];

function Partner() {
  const progress = useAppState((s) => s.partnerProgress);
  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/profile" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">←</Link>
        <h1 className="font-semibold text-navy">Partner status</h1>
      </header>
      <main className="flex-1 p-5 space-y-4">
        <div className="rounded-3xl gradient-hero p-5 text-white shadow-pop">
          <div className="flex items-center gap-3">
            <span className="h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center"><Lock size={18} /></span>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/60">Locked</p>
              <p className="text-lg font-semibold">Become an AgroVest Partner</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-white/70">
            Partner is an achieved status across all roles, unlocking advanced reporting, high-value investments, and governance benefits.
          </p>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-white/80"><span>Progress</span><span>{progress}%</span></div>
            <div className="mt-1.5 h-2 rounded-full bg-white/15 overflow-hidden">
              <div className="h-full gradient-agro" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
        <section className="rounded-3xl bg-card border border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Requirements</p>
          <ul className="mt-3 space-y-2">
            {requirements.map((r) => (
              <li key={r.t} className="flex items-center gap-3 text-sm text-navy">
                <span className={`h-7 w-7 rounded-lg flex items-center justify-center ${r.done ? "bg-agro text-white" : "bg-secondary text-muted-foreground"}`}>
                  <Check size={14} />
                </span>
                {r.t}
              </li>
            ))}
          </ul>
        </section>
        <div className="flex items-start gap-2 rounded-2xl bg-violet-soft/40 p-3 text-xs text-navy">
          <ShieldCheck size={14} className="mt-0.5 text-violet" />
          Partner status requires AgroVest/Admin approval. Apply once eligibility is reached.
        </div>
        <AgroButton size="xl" disabled>
          <Award size={16} /> Apply (eligibility pending)
        </AgroButton>
      </main>
    </MobileFrame>
  );
}
