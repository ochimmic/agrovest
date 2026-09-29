import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { setState } from "@/lib/store";
import { toast } from "sonner";
import { generateWallet, persistWallet } from "@/lib/wallet/keystore";
import { setAddress, setSigner } from "@/lib/wallet/store";

export const Route = createFileRoute("/wallet/create")({ component: CreateWallet });

function CreateWallet() {
  const nav = useNavigate();
  const [wallet] = useState(() => (typeof window === "undefined" ? null : generateWallet()));
  const [revealed, setRevealed] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  const words = useMemo(() => wallet?.mnemonic?.phrase.split(" ") ?? [], [wallet]);
  const valid = pw.length >= 8 && pw === pw2;

  async function save() {
    if (!wallet || !valid) return;
    setBusy(true);
    try {
      const address = await persistWallet(wallet, pw, { imported: false, backedUp: false });
      setSigner(wallet);
      setAddress(address);
      setState({ wallet: { created: true, address, clyst: 0, bnb: 0, cusd: 0 } });
      toast.success("AssetVault created");
      void nav({ to: "/wallet/confirm" });
    } catch {
      toast.error("Could not create the wallet on this device.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <MobileFrame>
      <div className="flex-1 overflow-y-auto hide-scrollbar p-6">
        <div className="flex items-start gap-3 rounded-2xl border border-warn/40 bg-warn/10 p-3 text-xs text-foreground">
          <AlertTriangle size={16} className="text-warn mt-0.5" />
          <div>
            <p className="font-semibold">Write these 12 words down. In order.</p>
            <p className="text-muted-foreground">
              Anyone with this phrase controls your wallet. AgroVest never sees it and cannot recover it.
            </p>
          </div>
        </div>

        <div className={`mt-4 grid grid-cols-3 gap-2 ${!revealed ? "select-none" : ""}`}>
          {words.map((w, i) => (
            <div key={i} className="rounded-2xl bg-card border border-border px-2.5 py-3 text-center">
              <p className="text-[10px] text-muted-foreground">{i + 1}</p>
              <p className={`text-sm font-medium text-foreground ${!revealed ? "blur-sm" : ""}`}>{w}</p>
            </div>
          ))}
        </div>
        <button
          onClick={() => setRevealed(!revealed)}
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 text-center text-xs font-medium text-violet"
        >
          {revealed ? <EyeOff size={13} /> : <Eye size={13} />}
          {revealed ? "Hide phrase" : "Tap to reveal"}
        </button>

        <div className="mt-6 space-y-2">
          <p className="text-sm font-semibold text-foreground">Set a wallet password</p>
          <p className="text-[11px] text-muted-foreground">
            Used to encrypt the key on this device and to approve every transaction.
          </p>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Password (min 8 characters)"
            className="w-full rounded-2xl border border-border bg-card px-3 h-12 text-sm text-foreground outline-none focus:border-violet"
          />
          <input
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            placeholder="Confirm password"
            className="w-full rounded-2xl border border-border bg-card px-3 h-12 text-sm text-foreground outline-none focus:border-violet"
          />
          {pw2 && pw !== pw2 && <p className="text-[11px] text-destructive">Passwords don't match.</p>}
        </div>

        <AgroButton size="xl" className="mt-6" disabled={!valid || busy} onClick={() => void save()}>
          {busy ? "Encrypting…" : "I've saved my phrase"}
        </AgroButton>
      </div>
    </MobileFrame>
  );
}
