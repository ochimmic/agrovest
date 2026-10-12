import { useCallback, useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { AdminFrame } from "@/components/admin/workbench/AdminFrame";
import { AgroBadge } from "@/components/ui/agro-badge";
import { LocalTime } from "@/components/ui/local-time";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
const ngn = (usd: number, rate: number) => `₦${Math.round(usd * rate).toLocaleString()}`;


type P = { id: string; reference: string; fee_usd: number; net_usd: number | null; user_id: string; amount_usd: number; rate: number; method: string; details: Record<string, string>; status: string; admin_note: string | null; created_at: string };

export function PayoutsWorkbench({ embedded = false }: { embedded?: boolean }) {
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
    <AdminFrame embedded={embedded} title="Broker payouts" subtitle="Pay within 24 hours to the broker bank account or BEP-20 wallet, then record the reference.">
      {rows.length === 0 ? <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No payout requests yet.</p> : (
        <div className="space-y-2">
          {rows.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">{people[p.user_id] ?? "Broker"}</p>
                <span className="text-[11px] font-mono text-muted-foreground">{p.reference}</span>
                <AgroBadge size="xs" tone={p.status === "paid" ? "agro" : p.status === "rejected" ? "danger" : "warn"}>{p.status}</AgroBadge>
                <span className="ml-auto text-[11px] text-muted-foreground"><LocalTime at={p.created_at} /></span>
              </div>
              <p className="mt-1 text-lg font-semibold">${Number(p.amount_usd).toLocaleString()} <span className="text-xs font-normal text-muted-foreground">≈ {ngn(Number(p.amount_usd), Number(p.rate))} · rate ₦{Number(p.rate).toLocaleString()}/$ locked at request</span></p>
              <p className="text-xs">Send to broker: <b>${Number(p.net_usd ?? p.amount_usd).toLocaleString()} · {ngn(Number(p.net_usd ?? p.amount_usd), Number(p.rate))}</b>{Number(p.fee_usd) > 0 ? ` (20% emergency fee $${Number(p.fee_usd).toLocaleString()} kept)` : " (no fee)"}</p>
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
    </AdminFrame>
  );
}
