import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Leaf, Lock, TrendingUp } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { AgroButton } from "@/components/ui/agro-button";

export const Route = createFileRoute("/welcome")({ component: Welcome });

function Welcome() {
  return (
    <div className="min-h-screen w-full gradient-hero flex md:items-center justify-center">
      <div className="relative w-full md:w-[420px] md:h-[860px] md:rounded-[44px] overflow-hidden flex flex-col text-white">
        <div className="px-6 pt-[max(2rem,env(safe-area-inset-top))]">
          <Logo size={28} tone="light" />
        </div>
        <div className="flex-1 px-6 flex flex-col justify-center gap-7 animate-in-up">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/60">Welcome to</p>
            <h1 className="mt-2 text-[40px] leading-[1.05] font-semibold tracking-tight">
              Real-world assets.
              <br />
              <span className="text-agro">Investment-grade.</span>
            </h1>
            <p className="mt-4 text-white/70 text-[15px] leading-relaxed">
              Own farms, properties, and tokenized assets with custody receipts, contracts, and a non-custodial wallet — all in one secure app.
            </p>
          </div>
          <ul className="grid gap-3">
            {[
              { icon: ShieldCheck, t: "Bank-grade KYC", s: "Verified identity & assets" },
              { icon: Lock, t: "Privacy-first", s: "End-to-end PriChat & self-custody" },
              { icon: TrendingUp, t: "Real returns", s: "Yield + asset appreciation" },
              { icon: Leaf, t: "Eco-conscious", s: "Audited sustainable holdings" },
            ].map(({ icon: Icon, t, s }) => (
              <li key={t} className="flex items-start gap-3 rounded-2xl glass-dark px-4 py-3">
                <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-violet/20 text-white">
                  <Icon size={16} />
                </span>
                <div>
                  <p className="text-sm font-medium">{t}</p>
                  <p className="text-xs text-white/65">{s}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 space-y-3">
          <AgroButton size="xl" asChild>
            <Link to="/role-select">Get started</Link>
          </AgroButton>
          <Link
            to="/login"
            className="block text-center text-sm text-white/80 hover:text-white"
          >
            I already have an account
          </Link>
        </div>
      </div>
    </div>
  );
}
