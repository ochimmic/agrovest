// FarmRemit — P2P on/off-ramp with manual settlement.
// Order state machine:
//   created → awaiting_payment → receipt_uploaded → admin_review → confirmed
//   (or) disputed | cancelled
//
// We track orders client-side for the prototype.
import { useSyncExternalStore } from "react";

export type OrderSide = "buy" | "sell"; // buy cUSD with NGN | sell cUSD for NGN
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
  who: "me" | "peer" | "system";
  t: string;
  at: string;
};

export type FRorder = {
  id: string;
  side: OrderSide;
  amountUsd: number;
  rate: number; // NGN per USD agreed
  peer: string;
  bank?: string;
  reference?: string;
  receiptUrl?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  messages: FRMessage[];
};

const KEY = "agrovest_farmremit_v1";

type S = { orders: FRorder[] };

function seed(): FRorder[] {
  const now = Date.now();
  const iso = (offset: number) => new Date(now - offset).toISOString();
  return [
    {
      id: "fr_1001",
      side: "buy",
      amountUsd: 500,
      rate: 1550,
      peer: "Tunde A.",
      bank: "GTBank • 0123456789",
      reference: "AGV-1001",
      status: "awaiting_payment",
      createdAt: iso(60_000 * 18),
      updatedAt: iso(60_000 * 12),
      messages: [
        { id: "m1", who: "system", t: "Order created. Send ₦775,000 to the seller's bank account.", at: iso(60_000 * 18) },
        { id: "m2", who: "peer", t: "Account opened. Awaiting your transfer.", at: iso(60_000 * 12) },
      ],
    },
    {
      id: "fr_1002",
      side: "sell",
      amountUsd: 200,
      rate: 1540,
      peer: "Adaobi N.",
      bank: "Opay • 8101234567",
      reference: "AGV-1002",
      status: "admin_review",
      createdAt: iso(60_000 * 60 * 3),
      updatedAt: iso(60_000 * 22),
      messages: [
        { id: "m1", who: "system", t: "Buyer uploaded payment receipt. Awaiting admin verification.", at: iso(60_000 * 22) },
      ],
    },
    {
      id: "fr_1003",
      side: "buy",
      amountUsd: 1000,
      rate: 1545,
      peer: "Chinwe K.",
      bank: "UBA • 2098765432",
      reference: "AGV-1003",
      status: "confirmed",
      createdAt: iso(60_000 * 60 * 24),
      updatedAt: iso(60_000 * 60 * 23),
      messages: [
        { id: "m1", who: "system", t: "Order settled. 1,000 cUSD credited to your AssetVault.", at: iso(60_000 * 60 * 23) },
      ],
    },
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

export function createOrder(input: { side: OrderSide; amountUsd: number; rate: number; peer: string; bank: string }) {
  const id = `fr_${Date.now()}`;
  const now = new Date().toISOString();
  const order: FRorder = {
    id,
    ...input,
    reference: `AGV-${Math.floor(Math.random() * 9000) + 1000}`,
    status: "awaiting_payment",
    createdAt: now,
    updatedAt: now,
    messages: [{ id: "m0", who: "system", t: "Order created. Follow the steps below to settle.", at: now }],
  };
  s = { orders: [order, ...s.orders] };
  persist();
  emit();
  return order;
}

export function advance(id: string, next: OrderStatus, sysMsg?: string) {
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
              { id: `m${Date.now() + 1}`, who: "system", t: "Receipt sent to AgroVest review.", at: new Date().toISOString() },
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
