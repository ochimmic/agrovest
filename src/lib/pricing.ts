// FarmVest land pricing (locked product rules, set by AgroVest).
//  - 1 plot = ₦950,000 land + ₦200,000 non-refundable management fee.
//  - 6 plots = 1 acre · 2.5 acres = 1 hectare (15 plots).
//  - Discount on the land price by total size:
//      under 1 acre          → 0%
//      1 acre – under 12 acres  → 2%
//      12 acres – under 24 ha   → 3%
//      24 ha – 100 ha           → 4%
import { NGN_PER_USD } from "@/lib/fx";

export type LandUnit = "plot" | "acre" | "hectare";
export const LAND_NGN_PER_PLOT = 950_000;
export const MGMT_NGN_PER_PLOT = 200_000;
export const PLOTS_PER_ACRE = 6;
export const ACRES_PER_HECTARE = 2.5;
export const PLOTS_PER_HECTARE = PLOTS_PER_ACRE * ACRES_PER_HECTARE; // 15
export const MAX_HECTARES = 100;

export function toPlots(unit: LandUnit, qty: number) {
  return unit === "plot" ? qty : unit === "acre" ? qty * PLOTS_PER_ACRE : qty * PLOTS_PER_HECTARE;
}

export function convertLand(plots: number) {
  return { plots, acres: plots / PLOTS_PER_ACRE, hectares: plots / PLOTS_PER_HECTARE };
}

export function discountPctFor(plots: number): number {
  if (plots >= 24 * PLOTS_PER_HECTARE) return 4;
  if (plots >= 12 * PLOTS_PER_ACRE) return 3;
  if (plots >= PLOTS_PER_ACRE) return 2;
  return 0;
}

const usd = (ngn: number) => Math.round((ngn / NGN_PER_USD) * 100) / 100;

/** Full price breakdown. NGN is the source of truth; USD is derived for display/crypto. */
export function landPrice(unit: LandUnit, qty: number) {
  const plots = toPlots(unit, qty);
  const landNgn = plots * LAND_NGN_PER_PLOT;
  const discountPct = discountPctFor(plots);
  const discountNgn = Math.round((landNgn * discountPct) / 100);
  const mgmtNgn = plots * MGMT_NGN_PER_PLOT;
  const totalNgn = landNgn - discountNgn + mgmtNgn;
  return {
    plots,
    discountPct,
    landNgn, discountNgn, mgmtNgn, totalNgn,
    base: usd(landNgn),
    discount: usd(discountNgn),
    managementFee: usd(mgmtNgn),
    final: usd(totalNgn),
  };
}

// Buy Assets (properties): AgroVest price is 1% below market; escrow is 3% of AgroVest price.
export const PROPERTY_DISCOUNT_PCT = 1;
export const PROPERTY_ESCROW_PCT = 3;
export const BROKER_PROPERTY_COMMISSION_PCT = 2;
export function propertyPrice(actual: number) {
  const agrovest = Math.round(actual * (1 - PROPERTY_DISCOUNT_PCT / 100) * 100) / 100;
  const escrow = Math.round(agrovest * PROPERTY_ESCROW_PCT) / 100;
  return { actual, agrovest, escrow, total: Math.round((agrovest + escrow) * 100) / 100 };
}
