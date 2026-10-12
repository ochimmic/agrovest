// Unified payment orders for AgroVest.
//
// Every purchase is paid on-chain from AssetVault into the AgroVest treasury,
// then waits for a manual admin confirmation. Nothing is credited and no
// holding is created until an admin confirms.
//
//   awaiting_payment → paid_onchain → admin_review → confirmed | rejected
import { useSyncExternalStore } from "react";

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
  category: "palm" | "cocoa" | "latex" | "property";
  unit: "plot" | "acre" | "hectare" | "house";
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
  /** Private storage path of the uploaded transfer receipt. */
  receiptPath?: string;
  createdAt: string;
  updatedAt: string;
  purpose: PayPurpose;
  timeline: { t: string; at: string }[];
};

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type S = { orders: PayOrder[]; loaded: boolean };
let s: S = { orders: [], loaded: false };
const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }

// Serialise writes so e.g. "create order" always lands before "mark paid".
let queue: Promise<unknown> = Promise.resolve();
function enqueue<T>(fn: () => PromiseLike<{ error: { message: string } | null }>, onDone?: () => void) {
  queue = queue.then(async () => {
    const { error } = await fn();
    if (error) { console.error(error); toast.error(error.message); }
    await refreshPayments();
    onDone?.();
  });
  return queue;
}

type Row = {
  id: string; reference: string; rail: string; payer_name: string; amount_usd: number; rate: number; token: string;
  tx_hash: string | null; network: string | null; status: string; reason: string | null; purpose: unknown; timeline: unknown;
  created_at: string; updated_at: string; receipt_path?: string | null;
};
function fromRow(r: Row): PayOrder {
  return {
    id: r.id, reference: r.reference, rail: r.rail as PayRail, payerName: r.payer_name, amountUsd: Number(r.amount_usd),
    rate: Number(r.rate), token: r.token, ...(r.tx_hash ? { txHash: r.tx_hash } : {}), ...(r.network ? { network: r.network } : {}),
    status: r.status as PayStatus, ...(r.reason ? { reason: r.reason } : {}), createdAt: r.created_at, updatedAt: r.updated_at,
    ...(r.receipt_path ? { receiptPath: r.receipt_path } : {}),
    purpose: r.purpose as PayPurpose, timeline: (r.timeline as PayOrder["timeline"]) ?? [],
  };
}

export async function refreshPayments() {
  const { data, error } = await supabase.from("pay_orders").select("*").order("created_at", { ascending: false }).limit(500);
  if (error) { console.error(error); return; }
  s = { orders: (data as Row[]).map(fromRow), loaded: true };
  emit();
}
export function clearPayments() { s = { orders: [], loaded: false }; emit(); }

export function usePayments<T>(sel: (s: S) => T): T {
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
  const id = `pay_${crypto.randomUUID()}`;
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
  s = { ...s, orders: [order, ...s.orders] };
  emit();
  void enqueue(() => supabase.from("pay_orders").insert({
    id, reference: order.reference, rail, payer_name: order.payerName, amount_usd: order.amountUsd,
    rate: order.rate, token: order.token, purpose: order.purpose as never, timeline: order.timeline as never,
  }));
  return order;
}

function local(id: string, p: Partial<PayOrder>, note?: string) {
  const now = new Date().toISOString();
  s = { ...s, orders: s.orders.map((o) => o.id === id ? { ...o, ...p, updatedAt: now, timeline: note ? [...o.timeline, { t: note, at: now }] : o.timeline } : o) };
  emit();
}

/** Buyer says they've completed a bank transfer — sends it to the admin queue. */
export function markTransferNotified(id: string, receiptPath?: string) {
  local(id, { status: "payment_notified", ...(receiptPath ? { receiptPath } : {}) }, "Buyer confirmed the bank transfer. Awaiting AgroVest verification.");
  return enqueue(() => supabase.rpc("order_mark_transfer", receiptPath ? { p_id: id, p_receipt: receiptPath } : { p_id: id }));
}

export function markPaidOnChain(id: string, txHash: string, network: string) {
  local(id, { status: "admin_review", txHash, network });
  return enqueue(() => supabase.rpc("order_mark_onchain", { p_id: id, p_tx_hash: txHash, p_network: network }));
}

/** Admin confirms — the server creates the holding for the buyer. */
export function confirmPayOrder(id: string) {
  local(id, { status: "confirmed" });
  return enqueue(() => supabase.rpc("admin_confirm_order", { p_id: id }), onSettled);
}

export function rejectPayOrder(id: string, reason: string) {
  local(id, { status: "rejected", reason });
  return enqueue(() => supabase.rpc("admin_reject_order", { p_id: id, p_reason: reason }), onSettled);
}

export function requestMoreInfo(id: string, note: string) {
  return enqueue(() => supabase.rpc("admin_request_info", { p_id: id, p_note: note }));
}

let settledHook: (() => void) | null = null;
export function onOrderSettled(fn: () => void) { settledHook = fn; }
function onSettled() { settledHook?.(); }

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
