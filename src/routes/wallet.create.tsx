import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { setState } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/wallet/create")({ component: CreateWallet });

const phrase = ["fortress","harbor","linen","violet","compass","ember","summit","orchid","marble","tide","lantern","alpine"];

function CreateWallet() {
  const nav = useNavigate();
  const [revealed, setRevealed] = useState(false);
  return (
    <MobileFrame>
      <div className="flex-1 overflow-y-auto hide-scrollbar p-6">
        <div className="flex items-start gap-3 rounded-2xl border border-warn/40 bg-warn/10 p-3 text-xs text-navy">
          <AlertTriangle size={16} className="text-warn mt-0.5" />
          <div>
            <p className="font-semibold">Write these 12 words down. In order.</p>
            <p className="text-muted-foreground">Anyone with this phrase controls your wallet. AgroVest cannot recover it.</p>
          </div>
        </div>
        <div className={`mt-4 grid grid-cols-3 gap-2 ${!revealed && "select-none"}`}>
          {phrase.map((w, i) => (
            <div key={i} className="rounded-2xl bg-card border border-border px-2.5 py-3 text-center">
              <p className="text-[10px] text-muted-foreground">{i + 1}</p>
              <p className={`text-sm font-medium text-navy ${!revealed && "blur-sm"}`}>{w}</p>
            </div>
          ))}
        </div>
        <button onClick={() => setRevealed(!revealed)} className="mt-3 w-full text-center text-xs text-violet font-medium">
          {revealed ? "Hide phrase" : "Tap to reveal"}
        </button>
        <AgroButton
          size="xl"
          className="mt-6"
          onClick={() => {
            setState({ wallet: { created: true, address: "0xCLY...3F2a", clyst: 250, bnb: 0.1 } });
            toast.success("Wallet created");
            nav({ to: "/wallet/confirm" });
          }}
        >
          I've saved my phrase
        </AgroButton>
      </div>
    </MobileFrame>
  );
}
