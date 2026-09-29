import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { toast } from "sonner";
import { writeMeta } from "@/lib/wallet/keystore";
import { shortAddr } from "@/lib/wallet/chain";
import { useVault } from "@/lib/wallet/store";

export const Route = createFileRoute("/_authenticated/wallet/confirm")({ component: ConfirmWallet });

const checks = [
  "I wrote all 12 words down, in order.",
  "I stored them offline, not in a screenshot or chat.",
  "I understand AgroVest cannot recover them for me.",
];

function ConfirmWallet() {
  const nav = useNavigate();
  const address = useVault((s) => s.address);
  const [done, setDone] = useState<boolean[]>([false, false, false]);
  const all = done.every(Boolean);

  return (
    <MobileFrame>
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-violet text-white shadow-glow">
          <ShieldCheck size={24} />
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-foreground">Your AssetVault is ready</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {address ? `Address ${shortAddr(address)} on Binance Smart Chain.` : "Wallet created on Binance Smart Chain."}
        </p>

        <div className="mt-6 space-y-2">
          {checks.map((c, i) => (
            <label key={c} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={done[i]}
                onChange={(e) => setDone((d) => d.map((v, j) => (j === i ? e.target.checked : v)))}
                className="mt-0.5 h-4 w-4 accent-violet"
              />
              {c}
            </label>
          ))}
        </div>

        <AgroButton
          size="xl"
          className="mt-auto"
          disabled={!all}
          onClick={() => {
            writeMeta({ backedUp: true });
            toast.success("Wallet ready");
            void nav({ to: "/vault" });
          }}
        >
          Open AssetVault
        </AgroButton>
      </div>
    </MobileFrame>
  );
}
