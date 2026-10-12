// Admin inbox: every buyer payment conversation, with receipts, in one place.
import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, MessageCircle, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { openPrivate } from "@/lib/uploads";
import { OrderChat } from "@/components/payments/OrderChat";

type Order = { id: string; reference: string; payer_name: string; amount_usd: number; status: string; receipt_path: string | null; purpose: { assetName?: string } | null; user_id: string; created_at: string };
type Msg = { order_id: string; body: string; from_admin: boolean; attachment_path: string | null; created_at: string };

export function ChatInbox() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [sel, setSel] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [o, m, p] = await Promise.all([
      supabase.from("pay_orders").select("id,reference,payer_name,amount_usd,status,receipt_path,purpose,user_id,created_at").order("created_at", { ascending: false }).limit(300),
      supabase.from("order_messages").select("order_id,body,from_admin,attachment_path,created_at").order("created_at", { ascending: false }).limit(1000),
      supabase.from("profiles").select("id,full_name,email"),
    ]);
    setOrders((o.data ?? []) as Order[]);
    setMsgs((m.data ?? []) as Msg[]);
    setNames(Object.fromEntries((p.data ?? []).map((x) => [x.id, x.full_name || x.email])));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const ch = supabase.channel("admin-inbox")
      .on("postgres_changes", { event: "*", schema: "public", table: "order_messages" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "pay_orders" }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [load]);

  const threads = useMemo(() => {
    const last = new Map<string, Msg>();
    const needsReply = new Set<string>();
    for (const m of msgs) if (!last.has(m.order_id)) { last.set(m.order_id, m); if (!m.from_admin) needsReply.add(m.order_id); }
    const s = q.trim().toLowerCase();
    return orders
      .map((o) => ({ o, last: last.get(o.id), unread: needsReply.has(o.id), who: names[o.user_id] || o.payer_name || "Buyer" }))
      .filter((t) => !s || [t.o.reference, t.who, t.o.purpose?.assetName ?? ""].some((v) => v.toLowerCase().includes(s)))
      .sort((a, b) => (b.last?.created_at ?? b.o.created_at).localeCompare(a.last?.created_at ?? a.o.created_at));
  }, [orders, msgs, names, q]);

  const cur = threads.find((t) => t.o.id === sel) ?? threads[0];

  return (
    <div className="grid grid-cols-[320px_1fr] gap-4 min-h-[560px]">
      <div className="rounded-2xl border border-border bg-card flex flex-col overflow-hidden">
        <div className="p-3 border-b border-border">
          <label className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm">
            <Search size={14} className="text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ticket, buyer or asset" className="bg-transparent outline-none flex-1 text-foreground" />
          </label>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && <p className="p-4 text-sm text-muted-foreground">Loading conversations…</p>}
          {!loading && threads.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <MessageCircle className="mx-auto mb-2" size={22} />
              No payment conversations yet. When a buyer places a purchase, its chat appears here.
            </div>
          )}
          {threads.map((t) => (
            <button key={t.o.id} onClick={() => setSel(t.o.id)}
              className={`w-full text-left px-4 py-3 border-b border-border hover:bg-muted ${cur?.o.id === t.o.id ? "bg-muted" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground truncate">{t.who}</span>
                {t.unread && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">Reply</span>}
              </div>
              <p className="text-[11px] text-muted-foreground">{t.o.reference} · {t.o.purpose?.assetName ?? "Order"}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {t.last ? `${t.last.from_admin ? "You: " : ""}${t.last.body || (t.last.attachment_path ? "📎 Attachment" : "")}` : "No messages yet"}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        {cur ? (
          <>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-base font-semibold text-foreground">{cur.who}</p>
                <p className="text-xs text-muted-foreground">Ticket {cur.o.reference} · {cur.o.purpose?.assetName ?? "Order"} · ${Number(cur.o.amount_usd).toLocaleString()} · {cur.o.status.replace(/_/g, " ")}</p>
              </div>
              {cur.o.receipt_path && (
                <button onClick={() => void openPrivate("payment-receipts", cur.o.receipt_path!)} className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted">
                  <FileText size={12} /> View receipt
                </button>
              )}
            </div>
            <OrderChat key={cur.o.id} orderId={cur.o.id} asAdmin />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Select a conversation.</p>
        )}
      </div>
    </div>
  );
}
