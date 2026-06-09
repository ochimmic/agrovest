import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Wallet, Download, ShieldCheck, ArrowRight, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AppShell } from "@/components/shell/AppShell";
import { AgroButton } from "@/components/ui/agro-button";
import { setState, useAppState, addTx } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/wallet/intro")({ component: WalletIntro });

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
          {[
            "Self-custody — your keys, your assets",
            "$CLYST balance & swaps",
            "On-chain proof for every investment",
          ].map((t) => (
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

export const RouteCreate = createFileRoute("/wallet/create")({ component: CreateWallet });
function CreateWallet() {
  const nav = useNavigate();
  const phrase = ["fortress", "harbor", "linen", "violet", "compass", "ember", "summit", "orchid", "marble", "tide", "lantern", "alpine"];
  const [revealed, setRevealed] = useState(false);

  return (
    <MobileFrame>
      <div className="flex-1 overflow-y-auto hide-scrollbar p-6">
        <div className="flex items-start gap-3 rounded-2xl border border-warn/40 bg-warn/10 p-3 text-xs text-navy">
          <AlertTriangle size={16} className="text-warn mt-0.5" />
          <div>
            <p className="font-semibold">Write these 12 words down. In order.</p>
            <p className="text-muted-foreground">Anyone with this phrase controls your wallet. AgroVest cannot recover it.</p>
          </div>
        </div>

        <div className={`mt-4 grid grid-cols-3 gap-2 ${!revealed && "select-none"}`}>
          {phrase.map((w, i) => (
            <div key={i} className="rounded-2xl bg-card border border-border px-2.5 py-3 text-center">
              <p className="text-[10px] text-muted-foreground">{i + 1}</p>
              <p className={`text-sm font-medium text-navy ${!revealed && "blur-sm"}`}>{w}</p>
            </div>
          ))}
        </div>

        <button onClick={() => setRevealed(!revealed)} className="mt-3 w-full text-center text-xs text-violet font-medium">
          {revealed ? "Hide phrase" : "Tap to reveal"}
        </button>

        <AgroButton
          size="xl"
          className="mt-6"
          onClick={() => {
            setState({ wallet: { created: true, address: "0xCLY...3F2a", clyst: 250, bnb: 0.1 } });
            toast.success("Wallet created");
            nav({ to: "/wallet/confirm" });
          }}
        >
          I've saved my phrase
        </AgroButton>
      </div>
    </MobileFrame>
  );
}

export const RouteImport = createFileRoute("/wallet/import")({ component: ImportWallet });
function ImportWallet() {
  const nav = useNavigate();
  return (
    <MobileFrame>
      <div className="p-6 flex-1">
        <h1 className="text-2xl font-semibold text-navy">Import wallet</h1>
        <p className="text-sm text-muted-foreground mt-1">Paste your 12-word recovery phrase.</p>
        <textarea
          rows={4}
          placeholder="word1 word2 word3 …"
          className="mt-4 w-full rounded-2xl border border-input bg-card p-3 text-sm outline-none focus:border-violet focus:ring-2 focus:ring-violet/20"
        />
        <AgroButton
          size="xl"
          className="mt-4"
          onClick={() => {
            setState({ wallet: { created: true, address: "0xIMP...A91b", clyst: 120, bnb: 0.05 } });
            toast.success("Wallet imported");
            nav({ to: "/vault" });
          }}
        >
          Import
        </AgroButton>
      </div>
    </MobileFrame>
  );
}

export const RouteConfirm = createFileRoute("/wallet/confirm")({ component: ConfirmWallet });
function ConfirmWallet() {
  const nav = useNavigate();
  return (
    <MobileFrame>
      <div className="p-6 flex-1 flex flex-col">
        <h1 className="text-2xl font-semibold text-navy">Confirm phrase</h1>
        <p className="text-sm text-muted-foreground mt-1">Tap the words in correct order.</p>
        <div className="mt-6 rounded-2xl bg-secondary p-4 min-h-20 text-sm text-muted-foreground">
          Selected words appear here…
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {["fortress","harbor","linen","violet","compass","ember"].map((w) => (
            <button key={w} className="rounded-xl bg-card border border-border px-2 py-2 text-xs font-medium text-navy">{w}</button>
          ))}
        </div>
        <AgroButton size="xl" className="mt-auto" onClick={() => { toast.success("Wallet ready"); nav({ to: "/vault" }); }}>
          Confirm
        </AgroButton>
      </div>
    </MobileFrame>
  );
}
