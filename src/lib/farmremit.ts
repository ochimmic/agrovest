// GoPay — Bank transfer top-up between the user and AgroVest.
// There is no peer-to-peer selling. Every order is the user paying NGN
// into AgroVest's settlement bank; AgroVest admin confirms the receipt
// and credits cUSD to the user's AssetVault.
//
// Order state machine:
//   created → awaiting_payment → receipt_uploaded → admin_review → confirmed
//   (or) disputed | cancelled
import { useSyncExternalStore } from "react";
import { addHolding, addTx } from "@/lib/store";

// Kept for backward compatibility with existing imports; only "buy" is used.
export type OrderSide = "buy";
export type OrderStatus =
  | "created"
  | "awaiting_payment"
  | "receipt_uploaded"
  | "admin_review"
  | "confirmed"
  | "disputed"
  | "cancelled";

export type FRMessage = {
  id: string;
  who: "me" | "agrovest" | "system";
  t: string;
  at: string;
};

export type InvestmentPurpose = {
  kind: "investment";
  assetId: string;
  assetName: string;
  category: "palm" | "cocoa" | "latex";
  unit: "plot" | "acre" | "hectare";
  qty: number;
};

export type VirtualAccount = {
  bank: string;            // AgroVest Bank (settlement partner)
  accountNumber: string;   // One-time 10-digit NUBAN, unique per order
  accountName: string;     // Beneficiary name shown to the payer
  expiresAt: string;       // ISO; account closes after this
};

export type FRorder = {
  id: string;
  side: OrderSide;
  amountUsd: number;
  rate: number; // NGN per USD agreed
  peer: string; // always "AgroVest"
  bank?: string; // legacy display string (kept for back-compat)
  virtualAccount?: VirtualAccount; // one-time account number for this order
  reference?: string;
  receiptUrl?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  messages: FRMessage[];
  purpose?: InvestmentPurpose; // optional: when order funds an investment
};

const KEY = "agrovest_farmremit_v1";

const AGROVEST_BANK_NAME = "AgroVest Bank";
const AGROVEST_BENEFICIARY = "AgroVest Ltd / Escrow";

// Generate a unique one-time NUBAN-style account number (10 digits).
// Deterministic when a seed string is provided so SSR/CSR + storage stay stable.
function genAccountNumber(seedStr?: string) {
  if (seedStr) {
    let h = 0;
    for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) >>> 0;
    return ("9" + String(h).padStart(9, "0")).slice(0, 10);
  }
  return "9" + Math.floor(100_000_000 + Math.random() * 899_999_999).toString();
}

function makeVirtualAccount(orderId: string, createdAtIso: string): VirtualAccount {
  const expires = new Date(new Date(createdAtIso).getTime() + 30 * 60_000).toISOString();
  return {
    bank: AGROVEST_BANK_NAME,
    accountNumber: genAccountNumber(orderId),
    accountName: AGROVEST_BENEFICIARY,
    expiresAt: expires,
  };
}

type S = { orders: FRorder[] };

function seed(): FRorder[] {
  const now = Date.now();
  const iso = (offset: number) => new Date(now - offset).toISOString();
  const mk = (
    id: string,
    amountUsd: number,
    rate: number,
    reference: string,
    status: OrderStatus,
    createdOffset: number,
    updatedOffset: number,
    messages: FRMessage[],
  ): FRorder => {
    const createdAt = iso(createdOffset);
    return {
      id,
      side: "buy",
      amountUsd,
      rate,
      peer: "AgroVest",
      bank: `${AGROVEST_BANK_NAME} · ${AGROVEST_BENEFICIARY}`,
      virtualAccount: makeVirtualAccount(id, createdAt),
      reference,
      status,
      createdAt,
      updatedAt: iso(updatedOffset),
      messages,
    };
  };
  return [
    mk("fr_1001", 500, 1550, "AGV-1001", "awaiting_payment", 60_000 * 18, 60_000 * 12, [
      { id: "m1", who: "system", t: "Order created. A one-time account number has been issued — transfer ₦775,000 to it.", at: iso(60_000 * 18) },
      { id: "m2", who: "agrovest", t: "We're standing by — upload your receipt once the transfer is sent.", at: iso(60_000 * 12) },
    ]),
    mk("fr_1002", 200, 1540, "AGV-1002", "admin_review", 60_000 * 60 * 3, 60_000 * 22, [
      { id: "m1", who: "system", t: "Receipt uploaded. Awaiting AgroVest admin confirmation.", at: iso(60_000 * 22) },
    ]),
    mk("fr_1003", 1000, 1545, "AGV-1003", "confirmed", 60_000 * 60 * 24, 60_000 * 60 * 23, [
      { id: "m1", who: "system", t: "Receipt confirmed. 1,000 cUSD credited to your AssetVault.", at: iso(60_000 * 60 * 23) },
    ]),
  ];
}

function load(): S {
  if (typeof window === "undefined") return { orders: seed() };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { orders: seed() };
    return JSON.parse(raw);
  } catch {
    return { orders: seed() };
  }
}

let s: S = load();
const listeners = new Set<() => void>();
function persist() {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}
function emit() { listeners.forEach((l) => l()); }

export function useFarmRemit<T>(sel: (s: S) => T): T {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => sel(s),
    () => sel(s),
  );
}

export function getOrder(id: string) {
  return s.orders.find((o) => o.id === id);
}

export function createOrder(input: {
  amountUsd: number;
  rate: number;
  purpose?: InvestmentPurpose;
}) {
  const id = `fr_${Date.now()}`;
  const now = new Date().toISOString();
  const order: FRorder = {
    id,
    side: "buy",
    amountUsd: input.amountUsd,
    rate: input.rate,
    peer: "AgroVest",
    bank: AGROVEST_BANK,
    reference: `AGV-${Math.floor(Math.random() * 9000) + 1000}`,
    status: "awaiting_payment",
    createdAt: now,
    updatedAt: now,
    purpose: input.purpose,
    messages: [{
      id: "m0",
      who: "system",
      t: input.purpose
        ? `Order created to fund your ${input.purpose.assetName} investment. Transfer NGN to AgroVest, then upload the receipt.`
        : "Order created. Transfer NGN to AgroVest's settlement account, then upload the receipt.",
      at: now,
    }],
  };
  s = { orders: [order, ...s.orders] };
  persist();
  emit();
  return order;
}

export function advance(id: string, next: OrderStatus, sysMsg?: string) {
  const order = s.orders.find((o) => o.id === id);
  s = {
    orders: s.orders.map((o) =>
      o.id === id
        ? {
            ...o,
            status: next,
            updatedAt: new Date().toISOString(),
            messages: sysMsg
              ? [...o.messages, { id: `m${Date.now()}`, who: "system", t: sysMsg, at: new Date().toISOString() }]
              : o.messages,
          }
        : o,
    ),
  };
  persist();
  emit();

  // When AgroVest confirms the receipt, credit cUSD and fulfil any
  // attached investment purpose.
  if (next === "confirmed" && order) {
    addTx({
      type: "topup",
      amount: order.amountUsd,
      token: "USD",
      status: "confirmed",
      meta: `GoPay · ${order.reference ?? order.id}`,
    });
    if (order.purpose) {
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
        token: "USD",
        status: "confirmed",
        meta: order.purpose.assetName,
      });
    }
  }
}

export function uploadReceipt(id: string, url: string) {
  s = {
    orders: s.orders.map((o) =>
      o.id === id
        ? {
            ...o,
            receiptUrl: url,
            status: "admin_review",
            updatedAt: new Date().toISOString(),
            messages: [
              ...o.messages,
              { id: `m${Date.now()}`, who: "me", t: "Uploaded payment receipt.", at: new Date().toISOString() },
              { id: `m${Date.now() + 1}`, who: "system", t: "Receipt sent to AgroVest admin for confirmation.", at: new Date().toISOString() },
            ],
          }
        : o,
    ),
  };
  persist();
  emit();
}

export function sendMessage(id: string, t: string) {
  s = {
    orders: s.orders.map((o) =>
      o.id === id
        ? { ...o, messages: [...o.messages, { id: `m${Date.now()}`, who: "me", t, at: new Date().toISOString() }], updatedAt: new Date().toISOString() }
        : o,
    ),
  };
  persist();
  emit();
}

export const statusLabel: Record<OrderStatus, string> = {
  created: "Created",
  awaiting_payment: "Awaiting payment",
  receipt_uploaded: "Receipt uploaded",
  admin_review: "Admin review",
  confirmed: "Settled",
  disputed: "Disputed",
  cancelled: "Cancelled",
};

export const statusTone: Record<OrderStatus, "warn" | "violet" | "agro" | "danger" | "neutral"> = {
  created: "neutral",
  awaiting_payment: "warn",
  receipt_uploaded: "violet",
  admin_review: "violet",
  confirmed: "agro",
  disputed: "danger",
  cancelled: "neutral",
};
