// BuyByBit (formerly AssetPay) — installment ("pay small-small") plans for FarmVest and Buy Assets.
//
// Rules:
//  - Deposit chosen by the buyer, minimum 10%. Balance split monthly over 3, 6 or 12 months.
//  - Each installment is paid through the normal 3 rails (crypto / NGN / USD) and
//    confirmed manually by an admin like any other payment.
//  - Holding + documents are issued only after the plan is fully paid.
//  - Missed installment: 7-day grace (reminder) → 5% late fee → cancelled after
//    30 days overdue, 30% of the amount paid is forfeited.
import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { PayPurpose } from "@/lib/payments";

export const MIN_DEPOSIT_PCT = 10;
export const PLAN_MONTHS = [3, 6, 12] as const;
export const GRACE_DAYS = 7;
export const LATE_FEE_PCT = 5;
export const CANCEL_AFTER_DAYS = 30;
export const CANCEL_FEE_PCT = 30; // forfeiture on cancellation or default

const DAY = 86_400_000;

export type InstallmentStatus = "upcoming" | "due" | "grace" | "late" | "processing" | "paid";

export type Installment = {
  index: number; // 0 = deposit
  dueAt: string;
  amountUsd: number;
  lateFeeUsd: number;
  paid: boolean;
  paidAt?: string;
  orderId?: string;
};

export type Plan = {
  id: string;
  purpose: Omit<PayPurpose, "kind">;
  totalUsd: number;
  depositPct: number;
  months: number;
  status: "active" | "completed" | "cancelled";
  cancelReason?: string;
  refundUsd?: number;
  createdAt: string;
  installments: Installment[];
};

type S = { plans: Plan[]; loaded: boolean };
let s: S = { plans: [], loaded: false };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
let queue: Promise<unknown> = Promise.resolve();
function enqueue(fn: () => PromiseLike<{ error: { message: string } | null }>) {
  queue = queue.then(async () => {
    const { error } = await fn();
    if (error) { console.error(error); toast.error(error.message); await refreshPlans(); }
  });
  return queue;
}
type Row = { id: string; purpose: unknown; total_usd: number; deposit_pct: number; months: number; status: string; cancel_reason: string | null; refund_usd: number | null; installments: unknown; created_at: string };
const fromRow = (r: Row): Plan => ({
  id: r.id, purpose: r.purpose as Plan["purpose"], totalUsd: Number(r.total_usd), depositPct: Number(r.deposit_pct), months: r.months,
  status: r.status as Plan["status"], ...(r.cancel_reason ? { cancelReason: r.cancel_reason } : {}),
  ...(r.refund_usd != null ? { refundUsd: Number(r.refund_usd) } : {}), createdAt: r.created_at, installments: r.installments as Installment[],
});
export async function refreshPlans() {
  const { data, error } = await supabase.from("assetpay_plans").select("*").order("created_at", { ascending: false });
  if (error) { console.error(error); return; }
  s = { plans: (data as Row[]).map(fromRow), loaded: true };
  sweep();
  emit();
}
export function clearPlans() { s = { plans: [], loaded: false }; emit(); }
function persistPlan(p: Plan) {
  void enqueue(() => supabase.from("assetpay_plans").update({
    installments: p.installments as never, status: p.status, cancel_reason: p.cancelReason ?? null, refund_usd: p.refundUsd ?? null,
  }).eq("id", p.id));
}

export function useAssetPay<T>(sel: (s: S) => T): T {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => sel(s),
    () => sel(s),
  );
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

export function buildSchedule(totalUsd: number, depositPct: number, months: number, start = new Date()) {
  const deposit = round2((totalUsd * depositPct) / 100);
  const rest = round2(totalUsd - deposit);
  const each = round2(rest / months);
  const list: Installment[] = [{ index: 0, dueAt: start.toISOString(), amountUsd: deposit, lateFeeUsd: 0, paid: false }];
  for (let i = 1; i <= months; i++) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i);
    const amt = i === months ? round2(rest - each * (months - 1)) : each;
    list.push({ index: i, dueAt: d.toISOString(), amountUsd: amt, lateFeeUsd: 0, paid: false });
  }
  return list;
}

export function createPlan(input: { purpose: Omit<PayPurpose, "kind">; totalUsd: number; depositPct: number; months: number }): Plan {
  const plan: Plan = {
    id: `ap_${crypto.randomUUID()}`,
    purpose: input.purpose,
    totalUsd: input.totalUsd,
    depositPct: Math.max(MIN_DEPOSIT_PCT, Math.min(90, input.depositPct)),
    months: input.months,
    status: "active",
    createdAt: new Date().toISOString(),
    installments: buildSchedule(input.totalUsd, input.depositPct, input.months),
  };
  s = { ...s, plans: [plan, ...s.plans] };
  emit();
  void enqueue(() => supabase.from("assetpay_plans").insert({
    id: plan.id, purpose: plan.purpose as never, total_usd: plan.totalUsd, deposit_pct: plan.depositPct, months: plan.months,
    installments: plan.installments as never,
  }));
  return plan;
}

function update(id: string, fn: (p: Plan) => Plan) {
  let changed: Plan | undefined;
  s = { ...s, plans: s.plans.map((p) => (p.id === id ? (changed = fn(p)) : p)) };
  emit();
  if (changed) persistPlan(changed);
}

export const getPlan = (id: string) => s.plans.find((p) => p.id === id);

export function installmentStatus(i: Installment, now = Date.now()): InstallmentStatus {
  if (i.paid) return "paid";
  if (i.orderId) return "processing";
  const late = now - new Date(i.dueAt).getTime();
  if (late < -3 * DAY) return "upcoming";
  if (late < 0) return "due";
  if (late <= GRACE_DAYS * DAY) return "grace";
  return "late";
}

/** Amount currently owed for an installment, including any late fee. */
export function amountDue(i: Installment, now = Date.now()) {
  const fee = installmentStatus(i, now) === "late" ? round2((i.amountUsd * LATE_FEE_PCT) / 100) : i.lateFeeUsd;
  return round2(i.amountUsd + fee);
}

export function paidUsd(p: Plan) {
  return round2(p.installments.filter((i) => i.paid).reduce((a, i) => a + i.amountUsd, 0));
}

export function nextInstallment(p: Plan) {
  return p.installments.find((i) => !i.paid);
}

/** Apply late fees and cancel plans overdue beyond the limit. */
export function sweep(now = Date.now()) {
  const changed: Plan[] = [];
  s = {
    ...s,
    plans: s.plans.map((p) => {
      if (p.status !== "active") return p;
      const inst = p.installments.map((i) => {
        if (!i.paid && !i.orderId && installmentStatus(i, now) === "late" && i.lateFeeUsd === 0) {
          return { ...i, lateFeeUsd: round2((i.amountUsd * LATE_FEE_PCT) / 100) };
        }
        return i;
      });
      const expired = inst.some((i) => !i.paid && !i.orderId && now - new Date(i.dueAt).getTime() > CANCEL_AFTER_DAYS * DAY);
      if (expired) {
        const paid = round2(inst.filter((i) => i.paid).reduce((a, i) => a + i.amountUsd, 0));
        const np: Plan = {
          ...p,
          installments: inst,
          status: "cancelled" as const,
          cancelReason: `Installment more than ${CANCEL_AFTER_DAYS} days overdue.`,
          refundUsd: round2(paid * (1 - CANCEL_FEE_PCT / 100)),
        };
        changed.push(np);
        return np;
      }
      const np = { ...p, installments: inst };
      if (JSON.stringify(inst) !== JSON.stringify(p.installments)) changed.push(np);
      return np;
    }),
  };
  changed.forEach(persistPlan);
}

export function attachOrder(planId: string, index: number, orderId: string) {
  update(planId, (p) => ({
    ...p,
    installments: p.installments.map((i) => (i.index === index ? { ...i, orderId } : i)),
  }));
}

/** Called when an admin rejects an installment payment — frees the slot to pay again. */
export function releaseOrder(planId: string, index: number) {
  update(planId, (p) => ({
    ...p,
    installments: p.installments.map((i) => (i.index === index ? { ...i, orderId: undefined } : i)),
  }));
}

export function cancelPlan(id: string, reason = "Cancelled by buyer.") {
  const p = getPlan(id);
  if (!p) return;
  update(id, (x) => ({ ...x, status: "cancelled", cancelReason: reason, refundUsd: round2(paidUsd(p) * (1 - CANCEL_FEE_PCT / 100)) }));
}

export function installmentLabel(i: number) {
  return i === 0 ? "Deposit" : `Installment ${i}`;
}

