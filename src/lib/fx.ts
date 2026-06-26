// Simple FX layer for NGN/USD display. Constant indicative rate for the
// prototype — swap for a live feed later. UI must always show both.
export const NGN_PER_USD = 1550;

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

export function useFxRate() {
  // Hook-shaped for future live rate integration.
  return { rate: NGN_PER_USD, source: "indicative" as const };
}
