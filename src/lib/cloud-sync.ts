// Keeps the signed-in user's orders, AssetPay plans, holdings and activity
// in sync with the shared server (live updates via realtime).
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { setState, type Holding, type Tx } from "@/lib/store";
import { clearPayments, onOrderSettled, refreshPayments } from "@/lib/payments";
import { clearPlans, refreshPlans } from "@/lib/assetpay";

export async function refreshPortfolio() {
  const [h, t] = await Promise.all([
    supabase.from("holdings").select("*").order("purchased_at", { ascending: false }),
    supabase.from("portfolio_txs").select("*").order("created_at", { ascending: false }).limit(100),
  ]);
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  const holdings: Holding[] = (h.data ?? []).filter((r) => r.user_id === uid).map((r) => ({
    id: r.id, assetId: r.asset_id, name: r.name, category: r.category as Holding["category"],
    units: Number(r.units), unit: r.unit as Holding["unit"], invested: Number(r.invested), purchasedAt: r.purchased_at,
  }));
  const txs: Tx[] = (t.data ?? []).filter((r) => r.user_id === uid).map((r) => ({
    id: r.id, type: r.type as Tx["type"], amount: Number(r.amount), token: r.token,
    status: r.status as Tx["status"], ...(r.hash ? { hash: r.hash } : {}), date: r.created_at, ...(r.meta ? { meta: r.meta } : {}),
  }));
  setState({ holdings, txs });
}

let channel: RealtimeChannel | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
function debounced(fn: () => void) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(fn, 250);
}

export function startCloudSync() {
  void refreshPayments();
  void refreshPlans();
  void refreshPortfolio();
  onOrderSettled(() => { void refreshPlans(); void refreshPortfolio(); });
  if (channel) return;
  channel = supabase
    .channel("agrovest-sync")
    .on("postgres_changes", { event: "*", schema: "public", table: "pay_orders" }, () => debounced(() => void refreshPayments()))
    .on("postgres_changes", { event: "*", schema: "public", table: "assetpay_plans" }, () => void refreshPlans())
    .on("postgres_changes", { event: "*", schema: "public", table: "holdings" }, () => void refreshPortfolio())
    .on("postgres_changes", { event: "*", schema: "public", table: "portfolio_txs" }, () => void refreshPortfolio())
    .subscribe();
}

export function stopCloudSync() {
  if (channel) { void supabase.removeChannel(channel); channel = null; }
  clearPayments();
  clearPlans();
  setState({ holdings: [], txs: [] });
}
