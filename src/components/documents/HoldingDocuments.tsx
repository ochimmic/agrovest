import { useCallback, useEffect, useState } from "react";
import { Download, FileText, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DOC_ORDER, DOC_TITLE, STATUS_LABEL, openSignedDoc, printReceipt, type DocRow } from "@/lib/documents";
import { getAuth } from "@/lib/auth";

export function useHoldingDocs(holdingId?: string) {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    let q = supabase.from("investor_documents").select("*");
    if (holdingId) q = q.eq("holding_id", holdingId);
    const { data } = await q.order("created_at", { ascending: false });
    setDocs((data ?? []) as DocRow[]);
    setLoading(false);
  }, [holdingId]);
  useEffect(() => {
    void load();
    const ch = supabase.channel(`docs-${holdingId ?? "all"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "investor_documents" }, () => void load()).subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [load, holdingId]);
  return { docs, loading };
}

export async function openDoc(d: DocRow) {
  try {
    if (d.file_path) return await openSignedDoc(d.file_path);
    if (d.doc_type === "receipt") {
      const { data: h, error } = await supabase.from("holdings").select("*").eq("id", d.holding_id).single();
      if (error) throw error;
      const p = getAuth().profile;
      printReceipt(h, p?.full_name || p?.email || "AgroVest investor");
      return;
    }
    toast.info("This document isn't ready yet");
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Could not open document");
  }
}

export function DocItem({ d, sub }: { d: DocRow; sub?: string }) {
  const ready = d.status === "issued";
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-secondary p-3">
      <span className="h-9 w-9 rounded-xl bg-card grid place-items-center text-violet"><FileText size={16} /></span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-navy truncate">{DOC_TITLE[d.doc_type]}</p>
        {sub && <p className="text-[11px] text-muted-foreground truncate">{sub}</p>}
        <p className={`mt-0.5 flex items-center gap-1 text-[11px] ${ready ? "text-agro" : "text-warn"}`}>
          {ready ? <CheckCircle2 size={11} /> : <Clock size={11} />}
          {STATUS_LABEL[d.status]}{!ready && d.due_note ? ` · ${d.due_note}` : ""}
        </p>
      </div>
      <button onClick={() => void openDoc(d)} disabled={!ready} aria-label={`Open ${DOC_TITLE[d.doc_type]}`}
        className="h-9 w-9 rounded-full bg-card grid place-items-center text-navy disabled:opacity-40"><Download size={14} /></button>
    </li>
  );
}

export function HoldingDocuments({ holdingId }: { holdingId: string }) {
  const { docs, loading } = useHoldingDocs(holdingId);
  if (loading) return <div className="h-24 animate-pulse rounded-2xl bg-secondary" />;
  if (!docs.length) return <p className="text-xs text-muted-foreground">Documents appear once AgroVest confirms your payment.</p>;
  const sorted = [...docs].sort((a, b) => DOC_ORDER.indexOf(a.doc_type) - DOC_ORDER.indexOf(b.doc_type));
  return <ul className="space-y-2">{sorted.map((d) => <DocItem key={d.id} d={d} />)}</ul>;
}
