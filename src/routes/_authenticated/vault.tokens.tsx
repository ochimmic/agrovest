import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Contract, isAddress } from "ethers";
import { toast } from "sonner";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { ERC20_ABI, TOKENS } from "@/lib/wallet/chain";
import { addCustomToken, provider, removeCustomToken, useVault } from "@/lib/wallet/store";

export const Route = createFileRoute("/_authenticated/_authenticated/vault/tokens")({
  head: () => ({
    meta: [
      { title: "Manage tokens — AssetVault | AgroVest" },
      { name: "description", content: "Add any BEP-20 token to your AgroVest AssetVault by contract address." },
      { property: "og:title", content: "Manage tokens — AssetVault | AgroVest" },
      { property: "og:description", content: "Track any BEP-20 token alongside BNB, USDT and cUSD." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Tokens,
});

function Tokens() {
  const network = useVault((s) => s.network);
  const custom = useVault((s) => s.customTokens);
  const [addr, setAddr] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    const a = addr.trim();
    if (!isAddress(a)) { toast.error("Enter a valid BEP-20 contract address."); return; }
    setBusy(true);
    try {
      const c = new Contract(a, ERC20_ABI, provider());
      const [symbol, name, decimals] = await Promise.all([c.symbol!(), c.name!(), c.decimals!()]);
      addCustomToken({ symbol, name, decimals: Number(decimals), address: a, usd: 0, custom: true });
      setAddr("");
      toast.success(`${symbol} added`);
    } catch {
      toast.error("Couldn't read that contract on this network.");
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
        <h1 className="text-base font-semibold text-foreground">Tokens</h1>
      </header>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">
        <div className="rounded-2xl border border-border bg-card p-3">
          <p className="text-[10px] text-muted-foreground">BEP-20 contract address</p>
          <input
            value={addr}
            onChange={(e) => setAddr(e.target.value)}
            placeholder="0x…"
            className="mt-1 w-full bg-transparent text-sm text-foreground outline-none"
          />
        </div>
        <AgroButton size="lg" disabled={busy} onClick={() => void add()}>
          <Plus size={16} /> {busy ? "Reading contract…" : "Add token"}
        </AgroButton>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-foreground">Built-in</h2>
          <div className="rounded-2xl border border-border bg-card divide-y divide-border">
            {TOKENS[network].map((t) => (
              <div key={t.symbol} className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{t.symbol}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {t.native ? "Native coin" : t.address || "Contract address pending"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {custom.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-foreground">Added by you</h2>
            <div className="rounded-2xl border border-border bg-card divide-y divide-border">
              {custom.map((t) => (
                <div key={t.address} className="flex items-center justify-between p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{t.symbol}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{t.address}</p>
                  </div>
                  <button
                    aria-label={`Remove ${t.symbol}`}
                    onClick={() => { removeCustomToken(t.address); toast.success(`${t.symbol} removed`); }}
                    className="text-muted-foreground"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </MobileFrame>
  );
}
