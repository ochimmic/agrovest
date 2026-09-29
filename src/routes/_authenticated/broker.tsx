import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Share2, Copy, Users, BadgeCheck, Landmark, Wallet } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/shell/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { LocalTime } from "@/components/ui/local-time";

export const Route = createFileRoute("/_authenticated/broker")({
  head: () => ({
    meta: [
      { title: "Broker dashboard | AgroVest" },
      { name: "description", content: "Share your AgroVest referral link, track referred investors and request payouts." },
      { property: "og:title", content: "Broker dashboard | AgroVest" },
      { property: "og:description", content: "Referral tracking and payouts for AgroVest brokers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Broker,
});

type Ref = { full_name: string; joined_at: string; kyc: string; purchases: number };
type Payout = { id: string; amount_usd: number; method: string; status: string; admin_note: string | null; created_at: string };
type Method = { method: "bank" | "crypto"; bank?: string; account_name?: string; account_number?: string; address?: string; token?: string };

function Broker() {
  const { user, roles } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [refs, setRefs] = useState<Ref[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [m, setM] = useState<Method>({ method: "bank" });
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const [p, r, po] = await Promise.all([
      supabase.from("profiles").select("referral_code,payout_method").eq("id", user.id).single(),
      supabase.rpc("my_referrals"),
      supabase.from("payout_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setCode(p.data?.referral_code ?? null);
    if (p.data?.payout_method) setM(p.data.payout_method as Method);
    setRefs((r.data ?? []) as Ref[]);
    setPayouts((po.data ?? []) as Payout[]);
  }, [user]);
  useEffect(() => { void load(); }, [load]);

  const link = code ? `${typeof window !== "undefined" ? window.location.origin : ""}/signup/investor?ref=${code}` : "";
  const isBroker = roles.includes("broker");

  async function share() {
    if (navigator.share) { try { await navigator.share({ title: "Invest with AgroVest", url: link }); } catch { /* cancelled */ } }
    else { await navigator.clipboard?.writeText(link); toast.success("Link copied"); }
  }

  const methodOk = m.method === "bank" ? !!(m.bank && m.account_name && m.account_number) : !!(m.address && /^0x[a-fA-F0-9]{40}$/.test(m.address));

  async function saveMethod() {
    if (!user || !methodOk) return toast.error(m.method === "bank" ? "Fill in all bank details" : "Enter a valid BSC wallet address (0x…)");
    const { error } = await supabase.from("profiles").update({ payout_method: m }).eq("id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Payout details saved");
  }

  async function request() {
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("Enter an amount");
    if (!methodOk) return toast.error("Save your payout details first");
    setBusy(true);
    const { error } = await supabase.from("payout_requests").insert({ amount_usd: amt, method: m.method, details: m });
    setBusy(false);
    if (error) return toast.error(error.message);
    setAmount(""); toast.success("Payout requested. AgroVest will review it."); void load();
  }

  const input = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm";
  return (
    <AppShell>
      <div className="px-4 pt-3 pb-6 space-y-4">
        <section className="rounded-3xl gradient-agro p-5 text-white shadow-pop">
          <p className="text-xs uppercase tracking-widest text-white/80">Your referral code</p>
          <p className="mt-2 text-2xl font-semibold tabular">{code ?? (isBroker ? "Loading…" : "Brokers only")}</p>
          {code && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white/15 p-2">
              <code className="flex-1 truncate text-xs">{link}</code>
              <button aria-label="Copy link" onClick={() => { void navigator.clipboard?.writeText(link); toast.success("Link copied"); }} className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center"><Copy size={14} /></button>
              <button aria-label="Share link" onClick={() => void share()} className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center"><Share2 size={14} /></button>
            </div>
          )}
        </section>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card border border-border p-3">
            <Users size={14} className="text-violet" />
            <p className="mt-1 text-xs text-muted-foreground">Referred</p>
            <p className="text-lg font-semibold text-navy">{refs.length}</p>
          </div>
          <div className="rounded-2xl bg-card border border-border p-3">
            <BadgeCheck size={14} className="text-agro" />
            <p className="mt-1 text-xs text-muted-foreground">Have invested</p>
            <p className="text-lg font-semibold text-navy">{refs.filter((r) => r.purchases > 0).length}</p>
          </div>
        </div>
        <p className="rounded-2xl bg-secondary p-3 text-[11px] text-muted-foreground">Commission rates and rewards will be announced soon. Every referral is already being tracked to your account.</p>

        <section>
          <h2 className="text-sm font-semibold text-navy mb-2">People you referred</h2>
          {refs.length === 0 ? <p className="text-xs text-muted-foreground">No sign-ups yet. Share your link to get started.</p> : (
            <ul className="space-y-2">
              {refs.map((r, i) => (
                <li key={i} className="flex items-center justify-between rounded-2xl bg-card border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-navy">{r.full_name || "New investor"}</p>
                    <p className="text-[11px] text-muted-foreground">Joined <LocalTime at={r.joined_at} /> · {r.purchases} purchase{r.purchases === 1 ? "" : "s"}</p>
                  </div>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium capitalize">KYC {r.kyc.replace("_", " ")}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {isBroker && (
          <section className="rounded-3xl border border-border bg-card p-4 space-y-3">
            <h2 className="text-sm font-semibold text-navy">Payout details</h2>
            <div className="grid grid-cols-2 gap-2">
              {(["bank", "crypto"] as const).map((k) => (
                <button key={k} onClick={() => setM({ ...m, method: k })}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium ${m.method === k ? "border-agro bg-agro-soft text-agro" : "border-border"}`}>
                  {k === "bank" ? <Landmark size={13} /> : <Wallet size={13} />}{k === "bank" ? "Bank transfer" : "Crypto (BSC)"}
                </button>
              ))}
            </div>
            {m.method === "bank" ? (
              <>
                <input className={input} placeholder="Bank name" value={m.bank ?? ""} onChange={(e) => setM({ ...m, bank: e.target.value })} />
                <input className={input} placeholder="Account name" value={m.account_name ?? ""} onChange={(e) => setM({ ...m, account_name: e.target.value })} />
                <input className={input} placeholder="Account number" inputMode="numeric" value={m.account_number ?? ""} onChange={(e) => setM({ ...m, account_number: e.target.value })} />
              </>
            ) : (
              <>
                <input className={input} placeholder="BSC wallet address (0x…)" value={m.address ?? ""} onChange={(e) => setM({ ...m, address: e.target.value.trim() })} />
                <select className={input} value={m.token ?? "USDT"} onChange={(e) => setM({ ...m, token: e.target.value })}>
                  <option>USDT</option><option>CLYST</option>
                </select>
              </>
            )}
            <button onClick={() => void saveMethod()} className="w-full rounded-full bg-secondary py-2 text-sm font-medium">Save payout details</button>
            <div className="flex gap-2 pt-2 border-t border-border">
              <input className={input} placeholder="Amount (USD)" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <button disabled={busy} onClick={() => void request()} className="shrink-0 rounded-full bg-agro px-4 text-sm font-medium text-white disabled:opacity-50">Request</button>
            </div>
            {payouts.length > 0 && (
              <ul className="space-y-1.5">
                {payouts.map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-xs">
                    <span>${Number(p.amount_usd).toLocaleString()} · {p.method} · <LocalTime at={p.created_at} /></span>
                    <span className={`font-medium capitalize ${p.status === "paid" ? "text-agro" : p.status === "rejected" ? "text-destructive" : "text-warn"}`}>{p.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </AppShell>
  );
}
