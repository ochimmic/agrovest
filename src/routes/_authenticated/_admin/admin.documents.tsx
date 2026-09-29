import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { AgroBadge } from "@/components/ui/agro-badge";
import { supabase } from "@/integrations/supabase/client";
import { DOC_ORDER, DOC_TITLE, STATUS_LABEL, openSignedDoc, type DocRow } from "@/lib/documents";

export const Route = createFileRoute("/_authenticated/_admin/admin/documents")({
  head: () => ({
    meta: [
      { title: "Document issuing — Admin | AgroVest" },
      { name: "description", content: "Upload signed ownership documents for AgroVest buyers." },
      { property: "og:title", content: "Document issuing — Admin | AgroVest" },
      { property: "og:description", content: "Issue Contracts of Sale, Deeds of Assignment, Survey Plans and RofO." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminDocs,
});

type H = { id: string; user_id: string; name: string; units: number; unit: string; purchased_at: string };

function AdminDocs() {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [hold, setHold] = useState<Record<string, H>>({});
  const [people, setPeople] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<"open" | "all">("open");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.from("investor_documents").select("*").neq("doc_type", "receipt").order("created_at", { ascending: false }).limit(1000);
    const rows = (data ?? []) as DocRow[];
    setDocs(rows);
    const hids = [...new Set(rows.map((r) => r.holding_id))];
    const uids = [...new Set(rows.map((r) => r.user_id))];
    if (hids.length) {
      const [h, p] = await Promise.all([
        supabase.from("holdings").select("id,user_id,name,units,unit,purchased_at").in("id", hids),
        supabase.from("profiles").select("id,full_name,email").in("id", uids),
      ]);
      setHold(Object.fromEntries((h.data ?? []).map((x) => [x.id, x as H])));
      setPeople(Object.fromEntries((p.data ?? []).map((x) => [x.id, x.full_name || x.email])));
    }
    setLoading(false);
  }, []);
  useEffect(() => {
    void load();
    const ch = supabase.channel("admin-docs").on("postgres_changes", { event: "*", schema: "public", table: "investor_documents" }, () => void load()).subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [load]);

  async function upload(d: DocRow, file: File) {
    if (file.type !== "application/pdf" && !file.type.startsWith("image/")) return toast.error("Upload a PDF or image");
    const path = `${d.user_id}/${d.holding_id}/${d.doc_type}-${Date.now()}.${file.name.split(".").pop() ?? "pdf"}`;
    const { error: e1 } = await supabase.storage.from("investor-documents").upload(path, file, { contentType: file.type });
    if (e1) return toast.error(e1.message);
    const { error } = await supabase.from("investor_documents").update({ file_path: path, status: "issued", issued_at: new Date().toISOString() }).eq("id", d.id);
    if (error) return toast.error(error.message);
    toast.success(`${DOC_TITLE[d.doc_type]} issued`);
  }

  const holdings = [...new Set(docs.map((d) => d.holding_id))].filter((h) => filter === "all" || docs.some((d) => d.holding_id === h && d.status !== "issued"));

  return (
    <AdminShell title="Document issuing" subtitle="Upload signed originals. Buyers see them instantly.">
      <div className="space-y-3">
        <div className="flex gap-2">
          {(["open", "all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-xs font-medium ${filter === f ? "bg-violet text-white" : "bg-secondary"}`}>
              {f === "open" ? "Outstanding" : "All"}
            </button>
          ))}
        </div>
        {loading ? <div className="h-32 animate-pulse rounded-2xl bg-secondary" /> : holdings.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nothing outstanding.</p>
        ) : holdings.map((hid) => {
          const h = hold[hid];
          return (
            <div key={hid} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm font-semibold">{people[h?.user_id ?? ""] ?? "Buyer"}</p>
              <p className="text-xs text-muted-foreground">{h ? `${h.name} · ${h.units} ${h.unit} · ${new Date(h.purchased_at).toLocaleDateString()}` : hid}</p>
              <ul className="mt-3 space-y-2">
                {docs.filter((d) => d.holding_id === hid).sort((a, b) => DOC_ORDER.indexOf(a.doc_type) - DOC_ORDER.indexOf(b.doc_type)).map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium flex-1 min-w-[140px]">{DOC_TITLE[d.doc_type]}</span>
                    <AgroBadge size="xs" tone={d.status === "issued" ? "agro" : "warn"}>{STATUS_LABEL[d.status]}</AgroBadge>
                    {d.file_path && <button onClick={() => void openSignedDoc(d.file_path!).catch((e) => toast.error(String(e)))} className="inline-flex items-center gap-1 text-xs text-violet"><FileText size={12} />View</button>}
                    <label className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-agro px-3 py-1 text-xs font-medium text-white">
                      <Upload size={12} />{d.file_path ? "Replace" : "Upload"}
                      <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(d, f); e.target.value = ""; }} />
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </AdminShell>
  );
}
