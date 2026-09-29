import { createFileRoute, Link } from "@tanstack/react-router";
import { Wallet, Download, ShieldCheck } from "lucide-react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";

export const Route = createFileRoute("/_authenticated/_authenticated/wallet/intro")({ component: WalletIntro });

function WalletIntro() {
  return (
    <MobileFrame>
      <div className="flex-1 p-6 flex flex-col">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl gradient-violet text-white shadow-glow">
          <Wallet size={28} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-navy">Set up your AssetVault</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Your non-custodial wallet on Binance Smart Chain. You hold your keys — AgroVest never stores your recovery phrase.
        </p>
        <ul className="mt-6 space-y-3">
          {["Self-custody — your keys, your assets", "$CLYST balance & swaps", "On-chain proof for every investment"].map((t) => (
            <li key={t} className="flex items-start gap-3 text-sm text-navy">
              <ShieldCheck size={16} className="mt-0.5 text-agro" /> {t}
            </li>
          ))}
        </ul>
        <div className="mt-auto space-y-2 pt-6">
          <AgroButton size="xl" asChild>
            <Link to="/wallet/create">Create new wallet</Link>
          </AgroButton>
          <AgroButton size="xl" variant="outline" asChild>
            <Link to="/wallet/import"><Download size={16} /> Import existing</Link>
          </AgroButton>
        </div>
      </div>
    </MobileFrame>
  );
}
