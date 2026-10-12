// Broker tiers (set by AgroVest). Volume = total land sold to referred investors, in plots.
import { PLOTS_PER_ACRE, PLOTS_PER_HECTARE } from "@/lib/pricing";

export type Tier = { name: string; minPlots: number; milestonePlots: number | null; range: string; reward: string };

export const BROKER_TIERS: Tier[] = [
  { name: "Bronze", minPlots: 0, milestonePlots: null, range: "No referrals yet", reward: "Starter badge" },
  { name: "Silver", minPlots: 0.5, milestonePlots: 11.5, range: "0.5 – 11.5 plots", reward: "5% commission" },
  { name: "Gold", minPlots: 2 * PLOTS_PER_ACRE, milestonePlots: 11.5 * PLOTS_PER_ACRE, range: "2 – 11.5 acres", reward: "5% + 3 plots" },
  { name: "Diamond", minPlots: 12 * PLOTS_PER_ACRE, milestonePlots: 23.5 * PLOTS_PER_HECTARE, range: "12 acres – 23.5 hectares", reward: "5% + 1 acre + car" },
  { name: "Platinum", minPlots: 24 * PLOTS_PER_HECTARE, milestonePlots: 100 * PLOTS_PER_HECTARE, range: "24 – 100 hectares", reward: "5% + free withdrawal + Land Cruiser + AgroVest partnership" },
];

export const FARM_COMMISSION_PCT = 5;
export const EMERGENCY_WITHDRAWAL_FEE_PCT = 20;

export function tierFor(plots: number): Tier {
  return [...BROKER_TIERS].reverse().find((t) => plots >= t.minPlots && (t.minPlots > 0 || plots === 0)) ?? BROKER_TIERS[0]!;
}

/** Withdrawal is free once the current tier's milestone is reached; otherwise a 20% emergency fee applies. */
export function withdrawalFee(plots: number, amount: number) {
  const t = tierFor(plots);
  const free = t.name === "Platinum" || (t.milestonePlots != null && plots >= t.milestonePlots);
  const fee = free ? 0 : Math.round(amount * EMERGENCY_WITHDRAWAL_FEE_PCT) / 100;
  return { free, fee, net: amount - fee, tier: t };
}
