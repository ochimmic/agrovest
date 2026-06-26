// FarmVest yield schedule (locked product rule)
//
// Years 1–2: maturation, no yield accrued.
// Year 3:    20% yield — accrued but LOCKED (cannot be withdrawn).
// Year 4:    30% yield — withdrawable.
// Year 5:    40% yield — withdrawable.
// Year 6+:   50% yield per year — withdrawable, in perpetuity.
//
// The Year 3 amount remains in the holding and can be withdrawn from Year 4
// onward together with that year's distribution.

export type YieldYear = {
  year: number;
  pct: number;            // % of principal earned that year
  withdrawable: boolean;  // can the investor pull this year's yield?
  note?: string;
};

export function yieldPctForYear(year: number): number {
  if (year < 3) return 0;
  if (year === 3) return 0.20;
  if (year === 4) return 0.30;
  if (year === 5) return 0.40;
  return 0.50; // Year 6 and beyond
}

export function isWithdrawable(year: number): boolean {
  return year >= 4;
}

export function buildSchedule(years: number): YieldYear[] {
  return Array.from({ length: years }, (_, i) => {
    const y = i + 1;
    return {
      year: y,
      pct: yieldPctForYear(y),
      withdrawable: isWithdrawable(y),
      note:
        y < 3
          ? "Maturation period"
          : y === 3
            ? "Accrued · locked"
            : y >= 6
              ? "Steady-state"
              : "Withdrawable",
    };
  });
}

// Build a cumulative portfolio-value series ending at `years` years.
// Returns one point per quarter so the chart curves smoothly while still
// reflecting the discrete annual yield steps.
export function buildYieldSeries(principal: number, years: number): number[] {
  const pointsPerYear = 4;
  const total = years * pointsPerYear + 1;
  const arr: number[] = [];
  for (let i = 0; i < total; i++) {
    const t = i / pointsPerYear; // years elapsed (fractional)
    // Sum completed-year yields
    let cum = 0;
    const fullYears = Math.floor(t);
    for (let y = 1; y <= fullYears; y++) cum += yieldPctForYear(y);
    // Pro-rate the in-progress year
    const frac = t - fullYears;
    if (frac > 0) cum += yieldPctForYear(fullYears + 1) * frac;
    arr.push(principal * (1 + cum));
  }
  return arr;
}

// Withdrawable cumulative amount at end of a given year.
// Year 3 yield is unlocked together with Year 4's distribution.
export function withdrawableByYear(principal: number, year: number): number {
  let amt = 0;
  for (let y = 1; y <= year; y++) {
    if (isWithdrawable(y)) amt += principal * yieldPctForYear(y);
  }
  if (year >= 4) amt += principal * yieldPctForYear(3); // Y3 unlocks at Y4
  return amt;
}

export const YIELD_HEADLINE = "20–50% / yr (Y3–Y6+)";
export const YIELD_DESCRIPTION =
  "Yield begins in Year 3 at 20% and steps up by 10% each year to 50% in Year 6, then stays at 50% per year. Year 3 yield accrues but is locked; withdrawals start from Year 4.";
