import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { toast } from "sonner";

export const Route = createFileRoute("/wallet/confirm")({ component: ConfirmWallet });

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
