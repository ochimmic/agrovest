import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { isAddress } from "ethers";
import { toast } from "sonner";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { UnlockSheet } from "@/components/wallet/UnlockSheet";
import { NETWORKS } from "@/lib/wallet/chain";
import { isUnlocked, refreshBalances, tokenList, useVault } from "@/lib/wallet/store";
import { estimateGas, sendToken } from "@/lib/wallet/send";
import { fmtNgn } from "@/lib/fx";

export const Route = createFileRoute("/_authenticated/_authenticated/vault/send")({
  head: () => ({
    meta: [
      { title: "Send crypto — AssetVault | AgroVest" },
      { name: "description", content: "Send BNB, USDT or any BEP-20 token from your AgroVest AssetVault on Binance Smart Chain." },
      { property: "og:title", content: "Send crypto — AssetVault | AgroVest" },
      { property: "og:description", content: "On-chain BEP-20 transfers straight from your non-custodial AgroVest wallet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SendScreen,
});

function SendScreen() {
  const nav = useNavigate();
  const network = useVault((s) => s.network);
  const custom = useVault((s) => s.customTokens);
  const balances = useVault((s) => s.balances);
  const tokens = useMemo(
    () => tokenList({ network, customTokens: custom } as any).filter((t) => t.native || t.address),
    [network, custom],
  );

  const [symbol, setSymbol] = useState(tokens[0]?.symbol ?? "");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [gas, setGas] = useState<{ bnb: number; usd: number } | null>(null);
  const [unlock, setUnlock] = useState(false);
  const [busy, setBusy] = useState(false);

  const token = tokens.find((t) => t.symbol === symbol) ?? tokens[0];
  const bal = balances[token?.symbol ?? ""]?.formatted ?? 0;
  const value = parseFloat(amount) || 0;
  const validTo = isAddress(to.trim());
  const insufficient = value > bal;

  useEffect(() => {
    if (!token) return;
    void estimateGas(token, to, amount).then(setGas).catch(() => setGas(null));
  }, [token, network]);

  async function submit() {
    if (!token || !validTo || !value || insufficient) return;
    if (!isUnlocked()) { setUnlock(true); return; }
    setBusy(true);
    try {
      const hash = await sendToken({ token, to: to.trim(), amount });
      toast.success(`Sent — ${hash.slice(0, 12)}…`);
      await refreshBalances();
      void nav({ to: "/vault" });
    } catch (e: any) {
      toast.error(e?.shortMessage ?? e?.message ?? "Transaction failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/vault" className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-base font-semibold text-foreground">Send</h1>
        <span className="ml-auto rounded-full bg-secondary px-2 py-1 text-[10px] text-muted-foreground">
          {NETWORKS[network].label}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-3">
        <div className="rounded-2xl border border-border bg-card p-3">
          <p className="text-[10px] text-muted-foreground">Token</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {tokens.map((t) => (
              <button
                key={t.symbol}
                onClick={() => setSymbol(t.symbol)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  t.symbol === symbol ? "bg-violet text-white" : "bg-secondary text-foreground"
                }`}
              >
                {t.symbol}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3">
          <p className="text-[10px] text-muted-foreground">Recipient address</p>
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="0x…"
            className="mt-1 w-full bg-transparent text-sm text-foreground outline-none"
          />
          {to && !validTo && <p className="mt-1 text-[11px] text-destructive">That doesn't look like a BSC address.</p>}
        </div>

        <div className="rounded-2xl border border-border bg-card p-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">Amount</p>
            <p className="text-[10px] text-muted-foreground tabular">
              Balance {bal.toLocaleString(undefined, { maximumFractionDigits: 6 })} {token?.symbol}
            </p>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="0.00"
              className="flex-1 bg-transparent text-2xl font-semibold text-foreground outline-none tabular"
            />
            <button
              onClick={() => setAmount(String(bal))}
              className="rounded-full bg-secondary px-2 py-1 text-[10px] text-foreground"
            >
              Max
            </button>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground tabular">
            ≈ ${(value * (token?.usd ?? 0)).toFixed(2)} · {fmtNgn(value * (token?.usd ?? 0))}
          </p>
        </div>

        <div className="rounded-2xl bg-secondary p-3 text-xs text-foreground space-y-1">
          <Row label="Network" value={NETWORKS[network].label} />
          <Row label="Estimated gas" value={gas ? `${gas.bnb.toFixed(6)} ${NETWORKS[network].nativeSymbol} · $${gas.usd.toFixed(3)}` : "—"} />
          <Row label="You send" value={`${value || 0} ${token?.symbol ?? ""}`} />
        </div>

        {insufficient && <p className="text-[11px] text-destructive">Not enough {token?.symbol}.</p>}

        <AgroButton size="xl" disabled={busy || !validTo || !value || insufficient} onClick={() => void submit()}>
          <Send size={16} /> {busy ? "Sending…" : isUnlocked() ? "Send now" : "Unlock & send"}
        </AgroButton>
        <p className="text-[11px] text-muted-foreground text-center">
          Transactions on {NETWORKS[network].label} are final and cannot be reversed.
        </p>
      </div>

      {unlock && (
        <UnlockSheet
          onClose={() => setUnlock(false)}
          onUnlocked={() => { setUnlock(false); void submit(); }}
        />
      )}
    </MobileFrame>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular">{value}</span>
    </div>
  );
}
