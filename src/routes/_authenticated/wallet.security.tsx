import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck, Check } from "lucide-react";
import { MobileFrame } from "@/components/shell/MobileFrame";

export const Route = createFileRoute("/_authenticated/_authenticated/wallet/security")({ component: Security });

const checks = [
  { t: "Recovery phrase saved offline", done: true },
  { t: "Biometric unlock enabled", done: true },
  { t: "Auto-lock after 1 minute", done: false },
  { t: "Anti-phishing tag set", done: false },
];

function Security() {
  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/vault" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center"><ArrowLeft size={18} /></Link>
        <h1 className="font-semibold text-navy">Wallet safety</h1>
      </header>
      <div className="p-4 space-y-3">
        <div className="rounded-3xl gradient-violet p-5 text-white shadow-glow">
          <ShieldCheck size={20} />
          <p className="mt-2 font-semibold">Your wallet is non-custodial</p>
          <p className="text-xs text-white/80">AgroVest cannot recover a lost recovery phrase. Keep it offline.</p>
        </div>
        <ul className="space-y-2">
          {checks.map((c) => (
            <li key={c.t} className="flex items-center gap-3 rounded-2xl bg-card border border-border p-3">
              <span className={`h-9 w-9 rounded-xl flex items-center justify-center ${c.done ? "bg-agro text-white" : "bg-secondary text-muted-foreground"}`}>
                <Check size={16} />
              </span>
              <p className="flex-1 text-sm text-navy">{c.t}</p>
              <span className={`text-xs font-medium ${c.done ? "text-agro" : "text-violet"}`}>{c.done ? "Done" : "Set up"}</span>
            </li>
          ))}
        </ul>
      </div>
    </MobileFrame>
  );
}
