import { describe, expect, it } from "vitest";
import { landPrice, propertyPrice } from "./pricing";
import { yieldPctForYear } from "./yield-schedule";
import { CANCEL_FEE_PCT } from "./assetpay";
import { tierFor, withdrawalFee } from "./broker-tiers";

describe("FarmVest pricing", () => {
  it("1 plot = ₦950,000 land + ₦200,000 management fee", () => {
    expect(landPrice("plot", 1).totalNgn).toBe(1_150_000);
  });
  it("5.5 plots get no discount", () => expect(landPrice("plot", 5.5).discountPct).toBe(0));
  it("1 acre gets 2% on land", () => {
    const p = landPrice("acre", 1);
    expect(p.plots).toBe(6);
    expect(p.discountNgn).toBe(114_000);
  });
  it("12 acres get 3%", () => expect(landPrice("acre", 12).discountPct).toBe(3));
  it("24 hectares get 4%", () => expect(landPrice("hectare", 24).discountPct).toBe(4));
  it("1 hectare = 15 plots", () => expect(landPrice("hectare", 1).plots).toBe(15));
});

describe("yield", () => {
  it("30% / 40% / 50%", () => {
    expect(yieldPctForYear(2)).toBe(0);
    expect(yieldPctForYear(3)).toBe(0.3);
    expect(yieldPctForYear(4)).toBe(0.4);
    expect(yieldPctForYear(9)).toBe(0.5);
  });
});

describe("Buy Assets", () => {
  it("AgroVest price 1% less, escrow 3% of it", () => {
    const p = propertyPrice(100_000);
    expect(p.agrovest).toBe(99_000);
    expect(p.escrow).toBe(2_970);
  });
});

describe("Buy By Bit & brokers", () => {
  it("forfeiture is 30%", () => expect(CANCEL_FEE_PCT).toBe(30));
  it("tiers", () => {
    expect(tierFor(0).name).toBe("Bronze");
    expect(tierFor(3).name).toBe("Silver");
    expect(tierFor(12).name).toBe("Gold");
    expect(tierFor(360).name).toBe("Platinum");
  });
  it("emergency withdrawal costs 20%", () => expect(withdrawalFee(3, 1000).fee).toBe(200));
  it("free after milestone", () => expect(withdrawalFee(11.5, 1000).fee).toBe(0));
});
