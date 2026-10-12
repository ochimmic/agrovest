// Live audit trail built from real records: payment timelines, KYC reviews, payouts and issued documents.
import { useCallback, useEffect, useMemo, useState } from "react";
import { FileCheck, FileText, Gift, Wallet, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LocalTime } from "@/components/ui/local-time";
import { AdminFrame } from "./AdminFrame";

type Kind = "payment" | "kyc" | "payout" | "document";
type Ev = { kind: Kind; text: string; at: string };
const ICON: Record<Kind, LucideIcon> = { payment: Wallet, kyc: FileCheck, payout: Gift, document: FileText };
const TONE: Record<Kind, string> = {
  payment: "bg-violet-soft text-violet", kyc: "bg-agro-soft text-agro",
  payout: "bg-warn/15 text-warn", document: "bg-secondary text-secondary-foreground",
};

export function AuditWorkbench({ embedded = false }: { embedded?: boolean }) {
  const [events, setEvents] = useState<Ev[]>([]);
  const [filter, setFilter] = useState<"all" | Kind>("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [o, k, p, d] = await Promise.all([
      supabase.from("pay_orders").select("reference,payer_name,timeline").order("updated_at", { ascending: false }).limit(200),
      supabase.from("kyc_submissions").select("status,admin_note,reviewed_at,created_at,user_id").order("created_at", { ascending: false }).limit(200),
      supabase.from("payout_requests").select("reference,status,amount_usd,admin_note,created_at,updated_at").order("created_at", { ascending: false }).limit(200),
      supabase.from("investor_documents").select("doc_type,status,issued_at").not("issued_at", "is", null).limit(200),
    ]);
    const ev: Ev[] = [];
    for (const r of o.data ?? []) {
      for (const t of (r.timeline as { t: string; at: string }[] | null) ?? []) ev.push({ kind: "payment", text: `#${r.reference} · ${r.payer_name || "User"} — ${t.t}`, at: t.at });
    }
    for (const r of k.data ?? []) {
      ev.push({ kind: "kyc", text: "KYC submitted for review", at: r.created_at });
      if (r.reviewed_at) ev.push({ kind: "kyc", text: `KYC ${r.status.replace("_", " ")}${r.admin_note ? ` — ${r.admin_note}` : ""}`, at: r.reviewed_at });
    }
    for (const r of p.data ?? []) {
      ev.push({ kind: "payout", text: `Payout ${r.reference} requested · $${Number(r.amount_usd).toLocaleString()}`, at: r.created_at });
      if (r.status !== "pending") ev.push({ kind: "payout", text: `Payout ${r.reference} ${r.status}${r.admin_note ? ` — ${r.admin_note}` : ""}`, at: r.updated_at });
    }
    for (const r of d.data ?? []) ev.push({ kind: "document", text: `Document issued — ${r.doc_type}`, at: r.issued_at! });
    ev.sort((a, b) => +new Date(b.at) - +new Date(a.at));
    setEvents(ev);
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const shown = useMemo(() => events.filter((e) => filter === "all" || e.kind === filter), [events, filter]);

  return (
    <AdminFrame embedded={embedded} title="Audit trail" subtitle="Every payment, KYC, payout and document event, newest first.">
      <div className="flex flex-wrap gap-2">
        {(["all", "payment", "kyc", "payout", "document"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>{f}</button>
        ))}
      </div>
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No events yet.</p>
      ) : (
        <ul className="space-y-2">
          {shown.slice(0, 300).map((e, i) => {
            const I = ICON[e.kind];
            return (
              <li key={i} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${TONE[e.kind]}`}><I size={14} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{e.text}</p>
                  <p className="text-[11px] text-muted-foreground"><LocalTime at={e.at} /></p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AdminFrame>
  );
}
