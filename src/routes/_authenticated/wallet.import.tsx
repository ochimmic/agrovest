import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { setState } from "@/lib/store";
import { toast } from "sonner";
import { persistWallet, walletFromPhrase, walletFromPrivateKey } from "@/lib/wallet/keystore";
import { setAddress, setSigner } from "@/lib/wallet/store";

export const Route = createFileRoute("/_authenticated/wallet/import")({ component: ImportWallet });

function ImportWallet() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"phrase" | "key">("phrase");
  const [secret, setSecret] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      const w = mode === "phrase" ? walletFromPhrase(secret) : walletFromPrivateKey(secret);
      const address = await persistWallet(w, pw, { imported: true, backedUp: true });
      setSigner(w);
      setAddress(address);
      setState({ wallet: { created: true, address, clyst: 0, bnb: 0, cusd: 0 } });
      toast.success("AssetVault imported");
      void nav({ to: "/vault" });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not import that wallet.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/wallet/intro" className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-base font-semibold text-foreground">Import wallet</h1>
      </header>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-3">
        <div className="flex gap-2">
          {(["phrase", "key"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 rounded-full px-3 py-2 text-xs font-medium transition ${
                mode === m ? "bg-violet text-white" : "bg-secondary text-foreground"
              }`}
            >
              {m === "phrase" ? "Recovery phrase" : "Private key"}
            </button>
          ))}
        </div>

        <textarea
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          rows={4}
          placeholder={mode === "phrase" ? "Enter your 12 or 24 words, separated by spaces" : "0x…"}
          className="w-full rounded-2xl border border-border bg-card p-3 text-sm text-foreground outline-none focus:border-violet"
        />
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Choose a wallet password (min 8 characters)"
          className="w-full rounded-2xl border border-border bg-card px-3 h-12 text-sm text-foreground outline-none focus:border-violet"
        />
        <p className="text-[11px] text-muted-foreground">
          Your phrase is encrypted on this device and never sent to AgroVest.
        </p>
        <AgroButton size="xl" disabled={busy || !secret.trim() || pw.length < 8} onClick={() => void submit()}>
          {busy ? "Importing…" : "Import wallet"}
        </AgroButton>
      </div>
    </MobileFrame>
  );
}
