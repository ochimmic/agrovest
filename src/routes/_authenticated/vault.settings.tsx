import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Lock, LogOut, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { NETWORKS, type NetworkId, shortAddr } from "@/lib/wallet/chain";
import { setAddress, setNetwork, setSigner, useVault } from "@/lib/wallet/store";
import { clearVault, readMeta } from "@/lib/wallet/keystore";
import { setState } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/_authenticated/vault/settings")({
  head: () => ({
    meta: [
      { title: "Wallet settings — AssetVault | AgroVest" },
      { name: "description", content: "Switch between BSC Testnet and Mainnet, lock your AgroVest AssetVault, or remove it from this device." },
      { property: "og:title", content: "Wallet settings — AssetVault | AgroVest" },
      { property: "og:description", content: "Network, lock and recovery controls for your non-custodial wallet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VaultSettings,
});

function VaultSettings() {
  const nav = useNavigate();
  const network = useVault((s) => s.network);
  const address = useVault((s) => s.address);
  const meta = typeof window !== "undefined" ? readMeta() : null;

  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/vault" className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-base font-semibold text-foreground">Wallet settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">
        <section>
          <h2 className="mb-2 text-sm font-semibold text-foreground">Network</h2>
          <div className="rounded-2xl border border-border bg-card divide-y divide-border">
            {(Object.keys(NETWORKS) as NetworkId[]).map((id) => (
              <button
                key={id}
                onClick={() => { setNetwork(id); toast.success(`Switched to ${NETWORKS[id].label}`); }}
                className="flex w-full items-center justify-between p-3 text-left"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{NETWORKS[id].label}</p>
                  <p className="text-[10px] text-muted-foreground">Chain ID {NETWORKS[id].chainId}</p>
                </div>
                {network === id && <Check size={16} className="text-agro" />}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Mainnet moves real funds. Test the whole flow on Testnet first.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-foreground">This wallet</h2>
          <div className="rounded-2xl border border-border bg-card p-3 space-y-1">
            <Row label="Address" value={shortAddr(address)} />
            <Row label="Source" value={meta?.imported ? "Imported" : "Created here"} />
            <Row label="Backed up" value={meta?.backedUp ? "Yes" : "Not confirmed"} />
          </div>
        </section>

        <button
          onClick={() => { setSigner(null); toast.success("AssetVault locked"); }}
          className="flex w-full items-center gap-2 rounded-2xl border border-border bg-card p-3 text-sm text-foreground"
        >
          <Lock size={15} /> Lock wallet now
        </button>

        <Link
          to="/wallet/security"
          className="flex w-full items-center gap-2 rounded-2xl border border-border bg-card p-3 text-sm text-foreground"
        >
          <ShieldCheck size={15} /> Recovery & safety
        </Link>

        <button
          onClick={() => {
            if (!confirm("Remove this wallet from the device? You'll need your recovery phrase to restore it.")) return;
            clearVault();
            setSigner(null);
            setAddress(null);
            setState({ wallet: null });
            toast.success("Wallet removed from this device");
            void nav({ to: "/wallet/intro" });
          }}
          className="flex w-full items-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <LogOut size={15} /> Remove wallet from this device
        </button>
      </div>
    </MobileFrame>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground tabular">{value}</span>
    </div>
  );
}
