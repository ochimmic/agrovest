import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { Headphones, AlertTriangle, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/support")({ component: Support });
function Support() {
  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/profile" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">←</Link>
        <h1 className="font-semibold text-navy">Support</h1>
      </header>
      <div className="p-4 space-y-3">
        <Link to="/prichat/$id" params={{ id: "c1" }} className="flex items-center gap-3 rounded-2xl bg-card border border-border p-4">
          <span className="h-10 w-10 rounded-xl bg-violet text-white flex items-center justify-center"><MessageCircle size={16} /></span>
          <div className="flex-1"><p className="text-sm font-semibold text-navy">Chat with AgroVest</p><p className="text-[11px] text-muted-foreground">Avg reply: 2 min</p></div>
        </Link>
        <Link to="/support/dispute" className="flex items-center gap-3 rounded-2xl bg-card border border-border p-4">
          <span className="h-10 w-10 rounded-xl bg-warn/15 text-warn flex items-center justify-center"><AlertTriangle size={16} /></span>
          <div className="flex-1"><p className="text-sm font-semibold text-navy">Open a dispute</p><p className="text-[11px] text-muted-foreground">For purchases or vendors</p></div>
        </Link>
        <div className="flex items-center gap-3 rounded-2xl bg-card border border-border p-4">
          <span className="h-10 w-10 rounded-xl bg-agro-soft text-agro flex items-center justify-center"><Headphones size={16} /></span>
          <div className="flex-1"><p className="text-sm font-semibold text-navy">Help Center</p><p className="text-[11px] text-muted-foreground">Guides & FAQs</p></div>
        </div>
      </div>
    </MobileFrame>
  );
}
