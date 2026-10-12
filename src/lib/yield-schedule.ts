// FarmVest yield schedule (locked product rule, set by AgroVest)
//
// Years 1–2: maturation, no ROI.
// Year 3:    30% annual ROI (maturity begins between the 3rd and 4th year).
// Year 4:    40% annual ROI.
// Year 5+:   50% annual ROI, every year after.

export type YieldYear = {
  year: number;
  pct: number;            // % of principal earned that year
  withdrawable: boolean;  // can the investor pull this year's yield?
  note?: string;
};

export function yieldPctForYear(year: number): number {
  if (year < 3) return 0;
  if (year === 3) return 0.30;
  if (year === 4) return 0.40;
  return 0.50; // Year 5 and beyond
}

export function isWithdrawable(year: number): boolean {
  return year >= 3;
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
          : y >= 5
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
export function withdrawableByYear(principal: number, year: number): number {
  let amt = 0;
  for (let y = 1; y <= year; y++) {
    if (isWithdrawable(y)) amt += principal * yieldPctForYear(y);
  }
  return amt;
}

export const YIELD_HEADLINE = "30–50% / yr (from Y3)";
export const YIELD_DESCRIPTION =
  "Maturity begins between the 3rd and 4th year: 30% annual ROI in Year 3, 40% in Year 4, then 50% every year from Year 5 onward.";
