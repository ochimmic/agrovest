import { useState } from "react";
import { X, Lock } from "lucide-react";
import { AgroButton } from "@/components/ui/agro-button";
import { unlockWallet } from "@/lib/wallet/keystore";
import { setSigner } from "@/lib/wallet/store";

export function UnlockSheet({ onClose, onUnlocked }: { onClose: () => void; onUnlocked: () => void }) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      const w = await unlockWallet(pw);
      setSigner(w);
      onUnlocked();
    } catch (e: any) {
      setErr(e?.message ?? "Could not unlock.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-[430px] rounded-t-3xl bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Lock size={15} /> Unlock AssetVault
          </h3>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
            <X size={14} />
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Your key is decrypted on this device only, for this session.
        </p>
        <input
          type="password"
          autoFocus
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void submit()}
          placeholder="Wallet password"
          className="mt-3 w-full rounded-2xl border border-border bg-card px-3 h-12 text-sm text-foreground outline-none focus:border-violet"
        />
        {err && <p className="mt-2 text-[11px] text-destructive">{err}</p>}
        <AgroButton size="xl" className="mt-3" disabled={busy || !pw} onClick={() => void submit()}>
          {busy ? "Unlocking…" : "Unlock"}
        </AgroButton>
      </div>
    </div>
  );
}
