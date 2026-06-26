// Mock client-side store for the AgroVest prototype.
// Persists user, role, KYC, wallet, portfolio, leads to localStorage.
// Swap for Supabase later — types are stable.

import { useSyncExternalStore } from "react";

export type Role = "explorer" | "investor" | "vendor" | "broker";
export type KycStatus = "none" | "pending" | "review" | "approved" | "rejected" | "more_info";

export type Holding = {
  id: string;
  assetId: string;
  name: string;
  category: "palm" | "cocoa" | "latex";
  units: number;
  unit: "plot" | "acre" | "hectare";
  invested: number;
  purchasedAt: string;
};

export type Tx = {
  id: string;
  type: "invest" | "swap" | "receive" | "send" | "reward" | "topup";
  amount: number;
  token: string;
  status: "pending" | "confirmed";
  hash?: string;
  date: string;
  meta?: string;
};

export type AppState = {
  user: { name: string; email: string; country: string } | null;
  role: Role | null;
  kyc: KycStatus;
  wallet: { created: boolean; address: string; clyst: number; bnb: number; cusd?: number; autoTopUp?: { enabled: boolean; min: number; refill: number }; lastConversion?: { from: "cUSD" | "CLYST"; to: "cUSD" | "CLYST"; inAmt: number; outAmt: number; at: string } | null } | null;
  partnerProgress: number; // 0..100
  holdings: Holding[];
  txs: Tx[];
  leads: { id: string; name: string; status: "invited" | "kyc" | "verified" | "pending" | "completed" }[];
  notificationCount: number;
};

const KEY = "agrovest_state_v1";

const initial: AppState = {
  user: null,
  role: null,
  kyc: "none",
  wallet: null,
  partnerProgress: 18,
  holdings: [],
  txs: [],
  leads: [
    { id: "l1", name: "Adaeze O.", status: "kyc" },
    { id: "l2", name: "Tunde A.", status: "verified" },
    { id: "l3", name: "Chinwe K.", status: "completed" },
  ],
  notificationCount: 3,
};

let state: AppState = load();
const listeners = new Set<() => void>();

function load(): AppState {
  if (typeof window === "undefined") return initial;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial;
    return { ...initial, ...JSON.parse(raw) };
  } catch {
    return initial;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
}

export function getState() { return state; }

export function setState(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) {
  const next = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...next };
  persist();
  listeners.forEach((l) => l());
}

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useAppState<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => selector(state),
    () => selector(initial),
  );
}

export function reset() { state = initial; persist(); listeners.forEach((l) => l()); }

export function addTx(tx: Omit<Tx, "id" | "date">) {
  setState((s) => ({
    txs: [{ ...tx, id: `tx_${Date.now()}`, date: new Date().toISOString() }, ...s.txs],
  }));
}

export function addHolding(h: Omit<Holding, "id" | "purchasedAt">) {
  setState((s) => ({
    holdings: [{ ...h, id: `h_${Date.now()}`, purchasedAt: new Date().toISOString() }, ...s.holdings],
  }));
}
