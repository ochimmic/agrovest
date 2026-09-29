import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { AgroBadge } from "@/components/ui/agro-badge";
import { LocalTime } from "@/components/ui/local-time";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/_admin/admin/payouts")({
  head: () => ({
    meta: [
      { title: "Broker payouts — Admin | AgroVest" },
      { name: "description", content: "Review and settle broker payout requests." },
      { property: "og:title", content: "Broker payouts — Admin | AgroVest" },
      { property: "og:description", content: "Broker payout queue for AgroVest admins." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPayouts,
});

type P = { id: string; user_id: string; amount_usd: number; method: string; details: Record<string, string>; status: string; admin_note: string | null; created_at: string };

function AdminPayouts() {
  const { user } = useAuth();
  const [rows, setRows] = useState<P[]>([]);
  const [people, setPeople] = useState<Record<string, string>>({});
  const load = useCallback(async () => {
    const { data } = await supabase.from("payout_requests").select("*").order("created_at", { ascending: false });
    const r = (data ?? []) as P[];
    setRows(r);
    const ids = [...new Set(r.map((x) => x.user_id))];
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("id,full_name,email").in("id", ids);
      setPeople(Object.fromEntries((ps ?? []).map((p) => [p.id, p.full_name || p.email])));
    }
  }, []);
  useEffect(() => {
    void load();
    const ch = supabase.channel("admin-payouts").on("postgres_changes", { event: "*", schema: "public", table: "payout_requests" }, () => void load()).subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [load]);

  async function settle(p: P, status: "paid" | "rejected") {
    const note = prompt(status === "paid" ? "Payment reference (bank ref or tx hash)?" : "Reason for rejection?");
    if (!note) return;
    const { error } = await supabase.from("payout_requests").update({ status, admin_note: note, reviewed_by: user?.id ?? null }).eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success(status === "paid" ? "Marked as paid" : "Rejected");
  }

  return (
    <AdminShell title="Broker payouts" subtitle="Pay manually, then record the reference here.">
      {rows.length === 0 ? <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No payout requests yet.</p> : (
        <div className="space-y-2">
          {rows.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">{people[p.user_id] ?? "Broker"}</p>
                <AgroBadge size="xs" tone={p.status === "paid" ? "agro" : p.status === "rejected" ? "danger" : "warn"}>{p.status}</AgroBadge>
                <span className="ml-auto text-[11px] text-muted-foreground"><LocalTime at={p.created_at} /></span>
              </div>
              <p className="mt-1 text-lg font-semibold">${Number(p.amount_usd).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">
                {p.method === "bank" ? `${p.details.bank} · ${p.details.account_number} · ${p.details.account_name}` : `${p.details.token ?? "USDT"} → ${p.details.address}`}
              </p>
              {p.admin_note && <p className="mt-1 text-[11px] text-muted-foreground">Note: {p.admin_note}</p>}
              {p.status === "pending" && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => void settle(p, "paid")} className="inline-flex items-center gap-1 rounded-full bg-agro px-3 py-1.5 text-xs font-medium text-white"><Check size={13} />Mark paid</button>
                  <button onClick={() => void settle(p, "rejected")} className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive"><X size={13} />Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
