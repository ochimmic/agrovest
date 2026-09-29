import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { DocItem, useHoldingDocs } from "@/components/documents/HoldingDocuments";
import { DOC_ORDER } from "@/lib/documents";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({
    meta: [
      { title: "My documents | AgroVest" },
      { name: "description", content: "Receipts, Contracts of Sale, Deeds of Assignment, Survey Plans and RofO for your AgroVest holdings." },
      { property: "og:title", content: "My documents | AgroVest" },
      { property: "og:description", content: "Your AgroVest ownership documents in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Documents,
});

function Documents() {
  const { docs, loading } = useHoldingDocs();
  const [names, setNames] = useState<Record<string, string>>({});
  useEffect(() => {
    const ids = [...new Set(docs.map((d) => d.holding_id))];
    if (!ids.length) return;
    void supabase.from("holdings").select("id,name,units,unit").in("id", ids).then(({ data }) =>
      setNames(Object.fromEntries((data ?? []).map((h) => [h.id, `${h.name} · ${h.units} ${h.unit}`]))));
  }, [docs]);
  const groups = [...new Set(docs.map((d) => d.holding_id))];
  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/profile" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center" aria-label="Back"><ArrowLeft size={18} /></Link>
        <h1 className="font-semibold text-navy">Documents</h1>
      </header>
      <div className="p-4 space-y-5">
        {loading ? <div className="h-40 animate-pulse rounded-2xl bg-secondary" /> : groups.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No documents yet. Your receipt appears as soon as AgroVest confirms a payment.
          </p>
        ) : groups.map((g) => (
          <section key={g}>
            <h2 className="mb-2 text-sm font-semibold text-navy">{names[g] ?? "Holding"}</h2>
            <ul className="space-y-2">
              {docs.filter((d) => d.holding_id === g).sort((a, b) => DOC_ORDER.indexOf(a.doc_type) - DOC_ORDER.indexOf(b.doc_type))
                .map((d) => <DocItem key={d.id} d={d} />)}
            </ul>
          </section>
        ))}
      </div>
    </MobileFrame>
  );
}
