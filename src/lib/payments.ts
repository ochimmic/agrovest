// Unified payment orders for AgroVest.
//
// Every purchase is paid on-chain from AssetVault into the AgroVest treasury,
// then waits for a manual admin confirmation. Nothing is credited and no
// holding is created until an admin confirms.
//
//   awaiting_payment → paid_onchain → admin_review → confirmed | rejected
import { useSyncExternalStore } from "react";
import { addHolding, addTx } from "@/lib/store";

export type PayStatus =
  | "awaiting_payment"
  | "paid_onchain"
  | "payment_notified"
  | "admin_review"
  | "confirmed"
  | "rejected";

/** How the buyer is paying. */
export type PayRail = "crypto" | "ngn" | "usd";

export type PayPurpose = {
  kind: "investment" | "asset";
  assetId: string;
  assetName: string;
  category: "palm" | "cocoa" | "latex";
  unit: "plot" | "acre" | "hectare";
  qty: number;
  /** Set when this payment is one installment of an AssetPay plan. */
  planId?: string;
  installment?: number;
};

export type PayOrder = {
  id: string;
  /** Unique ticket the admin uses to reconcile, e.g. AGV-NG-482013. */
  reference: string;
  rail: PayRail;
  payerName: string;
  amountUsd: number;
  rate: number;
  token: string;
  txHash?: string;
  network?: string;
  status: PayStatus;
  reason?: string;
  createdAt: string;
  updatedAt: string;
  purpose: PayPurpose;
  timeline: { t: string; at: string }[];
};

const KEY = "agrovest_payments_v1";

type S = { orders: PayOrder[] };
let s: S = { orders: [] };
let hydrated = false;
const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }
function persist() {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

function hydrateFromStorage() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    s = { orders: (JSON.parse(raw) as S).orders ?? [] };
    emit();
  } catch { /* ignore */ }
}

export function usePayments<T>(sel: (s: S) => T): T {
  if (typeof window !== "undefined" && !hydrated) queueMicrotask(hydrateFromStorage);
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => sel(s),
    () => sel(s),
  );
}

export function getPayOrder(id: string) {
  return s.orders.find((o) => o.id === id);
}

export function listPayOrders() { return s.orders; }

const RAIL_TAG: Record<PayRail, string> = { crypto: "CRY", ngn: "NG", usd: "USD" };

function makeTicket(rail: PayRail) {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `AGV-${RAIL_TAG[rail]}-${n}`;
}

export function createPayOrder(input: {
  amountUsd: number;
  rate: number;
  token: string;
  rail?: PayRail;
  payerName?: string;
  purpose: PayPurpose;
}): PayOrder {
  const now = new Date().toISOString();
  const id = `pay_${Date.now()}`;
  const rail: PayRail = input.rail ?? "crypto";
  const order: PayOrder = {
    id,
    reference: makeTicket(rail),
    rail,
    payerName: input.payerName || "AgroVest user",
    amountUsd: input.amountUsd,
    rate: input.rate,
    token: input.token,
    status: "awaiting_payment",
    createdAt: now,
    updatedAt: now,
    purpose: input.purpose,
    timeline: [{ t: `Order created for ${input.purpose.assetName}.`, at: now }],
  };
  s = { orders: [order, ...s.orders] };
  persist();
  emit();
  return order;
}

/** Buyer says they've completed a bank transfer — sends it to the admin queue. */
export function markTransferNotified(id: string, note?: string) {
  patch(
    id,
    { status: "payment_notified" },
    note ?? "Buyer confirmed the bank transfer. Awaiting AgroVest verification.",
  );
}

function patch(id: string, p: Partial<PayOrder>, note?: string) {
  const now = new Date().toISOString();
  s = {
    orders: s.orders.map((o) =>
      o.id === id
        ? {
            ...o,
            ...p,
            updatedAt: now,
            timeline: note ? [...o.timeline, { t: note, at: now }] : o.timeline,
          }
        : o,
    ),
  };
  persist();
  emit();
}

export function markPaidOnChain(id: string, txHash: string, network: string) {
  patch(id, { status: "admin_review", txHash, network }, `Payment sent on-chain (${txHash.slice(0, 10)}…). Awaiting AgroVest confirmation.`);
}

/** Admin confirms — this is the only path that creates a holding. */
type InstallmentHooks = { confirm: (planId: string, i: number) => void; release: (planId: string, i: number) => void };
let installmentHooks: InstallmentHooks | null = null;
export function registerInstallmentHooks(h: InstallmentHooks) { installmentHooks = h; }

export function confirmPayOrder(id: string) {
  const order = s.orders.find((o) => o.id === id);
  if (!order || order.status === "confirmed") return;
  if (order.purpose.planId != null && order.purpose.installment != null) {
    patch(id, { status: "confirmed" }, "AgroVest confirmed this AssetPay installment.");
    installmentHooks?.confirm(order.purpose.planId, order.purpose.installment);
    addTx({ type: "invest", amount: order.amountUsd, token: order.token, status: "confirmed", meta: `AssetPay · ${order.purpose.assetName}`, ...(order.txHash ? { hash: order.txHash } : {}) });
    return;
  }
  patch(id, { status: "confirmed" }, "AgroVest confirmed the payment. Holding created and documents issued.");
  addHolding({
    assetId: order.purpose.assetId,
    name: order.purpose.assetName,
    category: order.purpose.category,
    units: order.purpose.qty,
    unit: order.purpose.unit,
    invested: order.amountUsd,
  });
  addTx({
    type: "invest",
    amount: order.amountUsd,
    token: order.token,
    status: "confirmed",
    meta: order.purpose.assetName,
    ...(order.txHash ? { hash: order.txHash } : {}),
  });
}

export function rejectPayOrder(id: string, reason: string) {
  patch(id, { status: "rejected", reason }, `Rejected by AgroVest: ${reason}`);
  const o = s.orders.find((x) => x.id === id);
  if (o?.purpose.planId != null && o.purpose.installment != null) installmentHooks?.release(o.purpose.planId, o.purpose.installment);
}

export function requestMoreInfo(id: string, note: string) {
  patch(id, { status: "admin_review" }, `AgroVest requested more information: ${note}`);
}

export const payStatusLabel: Record<PayStatus, string> = {
  awaiting_payment: "Awaiting payment",
  paid_onchain: "Payment sent",
  payment_notified: "Transfer notified",
  admin_review: "Awaiting confirmation",
  confirmed: "Confirmed",
  rejected: "Rejected",
};

export const payStatusTone: Record<PayStatus, "warn" | "violet" | "agro" | "danger"> = {
  awaiting_payment: "warn",
  paid_onchain: "violet",
  payment_notified: "violet",
  admin_review: "warn",
  confirmed: "agro",
  rejected: "danger",
};
