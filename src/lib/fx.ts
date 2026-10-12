// NGN/USD rate. Starts from a fallback, then loads the live market rate and
// refreshes it periodically. NGN_PER_USD is a live binding: importers always
// read the latest value. Components re-render on change via useFxRate().
import { useEffect, useSyncExternalStore } from "react";

const FALLBACK = 1550;
export let NGN_PER_USD = FALLBACK;
let source: "fallback" | "live" = "fallback";
let updatedAt: string | null = null;

const listeners = new Set<() => void>();
let snapshot = { rate: NGN_PER_USD, source, updatedAt };
const REFRESH_MS = 10 * 60_000;
let started = false;

async function load() {
  try {
    const r = await fetch("https://open.er-api.com/v6/latest/USD");
    const d = await r.json();
    const rate = Number(d?.rates?.NGN);
    if (d?.result === "success" && rate > 100 && rate < 100_000) {
      const rounded = Math.round(rate * 100) / 100;
      if (rounded !== NGN_PER_USD || source !== "live") {
        NGN_PER_USD = rounded;
        source = "live";
        updatedAt = d.time_last_update_utc ?? new Date().toUTCString();
        snapshot = { rate: NGN_PER_USD, source, updatedAt };
        listeners.forEach((l) => l());
      }
    }
  } catch {
    /* keep last known rate */
  }
}

export function startFxUpdates() {
  if (started || typeof window === "undefined") return;
  started = true;
  void load();
  setInterval(load, REFRESH_MS);
  window.addEventListener("focus", () => void load());
}

export function toNgn(usd: number) {
  return Math.round(usd * NGN_PER_USD);
}

export function fmtUsd(usd: number, opts: { decimals?: boolean } = {}) {
  return opts.decimals
    ? `$${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `$${Math.round(usd).toLocaleString()}`;
}

export function fmtNgn(usd: number) {
  return `₦${toNgn(usd).toLocaleString()}`;
}

/** Subscribe to the live rate; re-renders when it changes. */
export function useFxRate() {
  useEffect(() => startFxUpdates(), []);
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => snapshot,
    () => snapshot,
  );
}
