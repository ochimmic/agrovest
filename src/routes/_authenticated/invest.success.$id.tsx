import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { CheckCircle2, FileText, Home } from "lucide-react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { farmAssets, properties } from "@/lib/mock-data";

const search = z.object({
  kind: z.enum(["farm", "property"]).default("farm"),
});

export const Route = createFileRoute("/_authenticated/_authenticated/invest/success/$id")({
  validateSearch: search,
  component: Success,
});

function Success() {
  const { id } = Route.useParams();
  const { kind } = Route.useSearch();
  const name =
    kind === "property"
      ? properties.find((p) => p.id === id)?.title ?? "your asset"
      : farmAssets.find((a) => a.id === id)?.name ?? "your investment";

  const label = kind === "property" ? "Purchase confirmed" : "Investment confirmed";
  const sub =
    kind === "property"
      ? "Funds are in escrow. Vendor will reach out within 24 hours to coordinate handover."
      : "Your purchase is being reviewed. Documents will be issued within 24 hours.";

  return (
    <MobileFrame>
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center animate-in-up">
        <div className="relative">
          <span className="absolute inset-0 rounded-full bg-agro/30 blur-2xl animate-pulse" />
          <span className="relative flex h-20 w-20 items-center justify-center rounded-full gradient-agro text-white shadow-glow">
            <CheckCircle2 size={36} strokeWidth={2.4} />
          </span>
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-navy">{label}</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-[280px]">
          Your <span className="font-medium text-navy">{name}</span> {kind === "property" ? "order" : "investment"} is locked in. {sub}
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
