import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, FileText, Info, X } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { AgroBadge } from "@/components/ui/agro-badge";
import { LocalTime } from "@/components/ui/local-time";
import { supabase } from "@/integrations/supabase/client";
import { openPrivate } from "@/lib/uploads";

export const Route = createFileRoute("/_authenticated/_admin/admin/kyc")({
  head: () => ({
    meta: [
      { title: "KYC queue — Admin | AgroVest" },
      { name: "description", content: "Review identity documents and approve AgroVest investors." },
      { property: "og:title", content: "KYC queue — Admin | AgroVest" },
      { property: "og:description", content: "Identity verification workbench for AgroVest admins." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminKyc,
});

type Sub = {
  id: string; user_id: string; id_type: string; id_number: string; address: string; city: string; postcode: string | null;
  id_doc_path: string; selfie_path: string; address_doc_path: string | null; status: string; admin_note: string | null; created_at: string;
};
type Filter = "review" | "more_info" | "approved" | "rejected" | "all";
const LABEL: Record<string, string> = { review: "Under review", more_info: "More info", approved: "Approved", rejected: "Rejected" };
const TONE: Record<string, "warn" | "violet" | "agro" | "danger"> = { review: "warn", more_info: "violet", approved: "agro", rejected: "danger" };

function AdminKyc() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [names, setNames] = useState<Record<string, { name: string; email: string; country: string | null }>>({});
  const [filter, setFilter] = useState<Filter>("review");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("kyc_submissions").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) { toast.error(error.message); setLoading(false); return; }
    const rows = data as Sub[];
    setSubs(rows);
    const ids = [...new Set(rows.map((r) => r.user_id))];
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("id,full_name,email,country").in("id", ids);
      setNames(Object.fromEntries((ps ?? []).map((p) => [p.id, { name: p.full_name || p.email, email: p.email, country: p.country }])));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const ch = supabase.channel("admin-kyc").on("postgres_changes", { event: "*", schema: "public", table: "kyc_submissions" }, () => void load()).subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [load]);

  // Only the latest submission per user matters.
  const latest = useMemo(() => {
    const seen = new Set<string>();
    return subs.filter((s) => (seen.has(s.user_id) ? false : (seen.add(s.user_id), true)));
  }, [subs]);
  const rows = filter === "all" ? latest : latest.filter((s) => s.status === filter);

  async function decide(s: Sub, decision: "approved" | "rejected" | "more_info") {
    let note: string | null = null;
    if (decision !== "approved") {
      note = prompt(decision === "rejected" ? "Reason for rejection (shown to the user)?" : "What do you need from the user?");
      if (!note) return;
    }
    const { error } = await supabase.rpc("admin_review_kyc", { p_id: s.id, p_decision: decision, p_note: note ?? "" });
    if (error) { toast.error(error.message); return; }
    toast.success(`KYC ${LABEL[decision].toLowerCase()}`);
    void load();
  }

  async function view(path: string) {
    try { await openPrivate("kyc-documents", path); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not open file"); }
  }

  return (
    <AdminShell title="KYC queue" subtitle="Verify identity and residence">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {(["review", "more_info", "approved", "rejected", "all"] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${filter === f ? "bg-violet text-white" : "bg-secondary text-foreground"}`}>
              {f === "all" ? "All" : LABEL[f]} ({f === "all" ? latest.length : latest.filter((s) => s.status === f).length})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-secondary" />)}</div>
        ) : rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nothing in this view.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((s) => {
              const who = names[s.user_id];
              return (
                <div key={s.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{who?.name ?? "User"}</p>
                    <AgroBadge size="xs" tone={TONE[s.status] ?? "neutral"}>{LABEL[s.status] ?? s.status}</AgroBadge>
                    <span className="ml-auto text-[11px] text-muted-foreground"><LocalTime at={s.created_at} /></span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{who?.email}{who?.country ? ` · ${who.country}` : ""}</p>
                  <p className="mt-1 text-xs text-foreground">{s.id_type} · <span className="font-medium">{s.id_number}</span></p>
                  <p className="text-xs text-foreground">{s.address}, {s.city} {s.postcode ?? ""}</p>
                  {s.admin_note && <p className="mt-1 text-[11px] text-muted-foreground">Note: {s.admin_note}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <DocBtn onClick={() => view(s.id_doc_path)}>ID document</DocBtn>
                    <DocBtn onClick={() => view(s.selfie_path)}>Selfie</DocBtn>
                    {s.address_doc_path && <DocBtn onClick={() => view(s.address_doc_path!)}>Proof of address</DocBtn>}
                  </div>
                  {s.status !== "approved" && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={() => decide(s, "approved")} className="inline-flex items-center gap-1.5 rounded-full bg-agro px-3 py-1.5 text-xs font-medium text-white"><Check size={13} /> Approve</button>
                      <button onClick={() => decide(s, "rejected")} className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive"><X size={13} /> Reject</button>
                      <button onClick={() => decide(s, "more_info")} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-foreground"><Info size={13} /> Request info</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function DocBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-violet">
      <FileText size={12} /> {children}
    </button>
  );
}
