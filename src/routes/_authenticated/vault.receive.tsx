import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { QrCode } from "@/components/wallet/QrCode";
import { NETWORKS, addressUrl } from "@/lib/wallet/chain";
import { useVault } from "@/lib/wallet/store";

export const Route = createFileRoute("/_authenticated/vault/receive")({
  head: () => ({
    meta: [
      { title: "Receive crypto — AssetVault | AgroVest" },
      { name: "description", content: "Share your AgroVest AssetVault address or QR code to receive BNB, USDT and BEP-20 tokens." },
      { property: "og:title", content: "Receive crypto — AssetVault | AgroVest" },
      { property: "og:description", content: "Your BSC deposit address and QR code." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Receive,
});

function Receive() {
  const address = useVault((s) => s.address);
  const network = useVault((s) => s.network);

  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/vault" className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-base font-semibold text-foreground">Receive</h1>
      </header>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 flex flex-col items-center text-center">
        {address ? (
          <>
            <QrCode value={address} />
            <p className="mt-4 text-xs text-muted-foreground">
              Only send {NETWORKS[network].label} (BEP-20) assets to this address.
            </p>
            <code className="mt-3 block w-full break-all rounded-2xl border border-border bg-card p-3 text-[12px] text-foreground">
              {address}
            </code>
            <button
              onClick={() => { void navigator.clipboard?.writeText(address); toast.success("Address copied"); }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-violet px-4 py-2 text-xs font-medium text-white"
            >
              <Copy size={13} /> Copy address
            </button>
            <a
              href={addressUrl(network, address)}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-violet"
            >
              View on explorer <ExternalLink size={11} />
            </a>
            {NETWORKS[network].faucet && (
              <a
                href={NETWORKS[network].faucet}
                target="_blank"
                rel="noreferrer"
                className="mt-2 text-[11px] text-muted-foreground underline"
              >
                Get free test {NETWORKS[network].nativeSymbol} from the faucet
              </a>
            )}
          </>
        ) : (
          <p className="mt-10 text-sm text-muted-foreground">Set up your AssetVault first.</p>
        )}
      </div>
    </MobileFrame>
  );
}
