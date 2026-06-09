import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Star, ShieldCheck, Calendar } from "lucide-react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { consultants } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/services/mp/$id")({ component: ConsultantDetail });

function ConsultantDetail() {
  const { id } = Route.useParams();
  const c = consultants.find((x) => x.id === id) ?? consultants[0];
  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/services/mp" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center"><ArrowLeft size={18} /></Link>
        <h1 className="font-semibold text-navy">Consultant</h1>
      </header>
      <div className="flex-1 p-5 space-y-4">
        <div className="flex items-center gap-4">
          <span className="h-16 w-16 rounded-2xl gradient-violet text-white flex items-center justify-center text-xl font-semibold">{c.name[0]}</span>
          <div>
            <p className="text-lg font-semibold text-navy">{c.name}</p>
            <p className="text-xs text-muted-foreground">{c.role}</p>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-warn"><Star size={11} fill="currentColor" /> {c.rating}</span>
              {c.certified && <span className="flex items-center gap-1 text-agro"><ShieldCheck size={11} /> Certified</span>}
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {c.name} helps brands and asset issuers reach investors through targeted promotion and high-trust storytelling.
        </p>
        <div className="rounded-2xl bg-card border border-border p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Session fee</p>
            <p className="font-semibold text-navy">${c.fee}</p>
          </div>
          <AgroButton onClick={() => toast.success("Booking requested")}><Calendar size={14} /> Book</AgroButton>
        </div>
      </div>
    </MobileFrame>
  );
}
