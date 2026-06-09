import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { setState } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/wallet/import")({ component: ImportWallet });

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
