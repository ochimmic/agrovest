// Per-order chat between the buyer and AgroVest admins, with receipt attachments.
import { useCallback, useEffect, useRef, useState } from "react";
import { Paperclip, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ACCEPT, openPrivate, uploadPrivate } from "@/lib/uploads";
import { LocalTime } from "@/components/ui/local-time";

type Msg = { id: string; from_admin: boolean; body: string; attachment_path: string | null; created_at: string };

export function OrderChat({ orderId, asAdmin = false }: { orderId: string; asAdmin?: boolean }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("order_messages").select("id,from_admin,body,attachment_path,created_at")
      .eq("order_id", orderId).order("created_at");
    setMsgs((data ?? []) as Msg[]);
  }, [orderId]);

  useEffect(() => {
    void load();
    const ch = supabase.channel(`chat-${orderId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "order_messages", filter: `order_id=eq.${orderId}` }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [orderId, load]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [msgs.length]);

  async function send(file?: File) {
    const body = text.trim();
    if (!body && !file) return;
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Please sign in again");
      const attachment_path = file ? await uploadPrivate("payment-receipts", file, `chat-${orderId}`) : null;
      const { error } = await supabase.from("order_messages").insert({
        order_id: orderId, sender_id: u.user.id, from_admin: asAdmin, body: body || "Sent a receipt", attachment_path,
      });
      if (error) throw error;
      setText(""); void load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not send"); }
    finally { setBusy(false); }
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold text-foreground">{asAdmin ? "Chat with buyer" : "Chat with AgroVest"}</h2>
      <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
        {msgs.length === 0 && <p className="text-[11px] text-muted-foreground">No messages yet. Ask about this payment or send your receipt.</p>}
        {msgs.map((m) => {
          const mine = m.from_admin === asAdmin;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${mine ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                {!mine && <p className="text-[10px] font-medium opacity-70">{m.from_admin ? "AgroVest" : "Buyer"}</p>}
                <p className="whitespace-pre-wrap">{m.body}</p>
                {m.attachment_path && (
                  <button type="button" className="mt-1 underline" onClick={() => void openPrivate("payment-receipts", m.attachment_path!)}>View attachment</button>
                )}
                <p className="mt-0.5 text-[9px] opacity-60"><LocalTime at={m.created_at} /></p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div className="mt-3 flex items-center gap-2">
        {!asAdmin && (
          <>
            <input ref={fileRef} type="file" accept={ACCEPT} className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void send(f); }} />
            <button type="button" aria-label="Attach receipt" disabled={busy} onClick={() => fileRef.current?.click()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground"><Paperclip size={16} /></button>
          </>
        )}
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder="Type a message"
          onKeyDown={(e) => { if (e.key === "Enter") void send(); }}
          className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm" />
        <button type="button" aria-label="Send" disabled={busy || !text.trim()} onClick={() => void send()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"><Send size={16} /></button>
      </div>
    </section>
  );
}
