import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, FileText, Home } from "lucide-react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { farmAssets } from "@/lib/mock-data";

export const Route = createFileRoute("/invest/success/$id")({ component: Success });

function Success() {
  const { id } = Route.useParams();
  const asset = farmAssets.find((a) => a.id === id) ?? farmAssets[0];
  return (
    <MobileFrame>
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center animate-in-up">
        <div className="relative">
          <span className="absolute inset-0 rounded-full bg-agro/30 blur-2xl animate-pulse" />
          <span className="relative flex h-20 w-20 items-center justify-center rounded-full gradient-agro text-white shadow-glow">
            <CheckCircle2 size={36} strokeWidth={2.4} />
          </span>
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-navy">Investment confirmed</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-[280px]">
          Your purchase of <span className="font-medium text-navy">{asset.name}</span> is being reviewed.
          Documents will be issued within 24 hours.
        </p>
        <div className="mt-6 w-full space-y-2">
          <AgroButton size="xl" asChild>
            <Link to="/documents"><FileText size={16} /> View documents</Link>
          </AgroButton>
          <AgroButton size="xl" variant="outline" asChild>
            <Link to="/home"><Home size={16} /> Back to home</Link>
          </AgroButton>
        </div>
      </div>
    </MobileFrame>
  );
}
