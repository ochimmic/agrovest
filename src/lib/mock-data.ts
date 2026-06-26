export type FarmAsset = {
  id: string;
  name: string;
  category: "palm" | "cocoa" | "latex";
  location: string;
  unitsAvailable: number;
  pricePerPlot: number;
  expectedYield: string;
  appreciation: string;
  risk: "Low" | "Moderate" | "Conservative";
  status: "Active" | "Reserved" | "Funding" | "Coming soon";
  cover: string;
  image?: string;
  description: string;
  comingSoon?: boolean;
  launchEta?: string;
};

import abeokutaPalmEstate from "@/assets/abeokuta-palm-estate.jpg.asset.json";

export const farmAssets: FarmAsset[] = [
  {
    id: "fv-palm-01",
    name: "Abeokuta Palm Estate",
    category: "palm",
    location: "Abeokuta, Ogun State, Nigeria",
    unitsAvailable: 412,
    pricePerPlot: 1000,
    expectedYield: "9–12% / yr",
    appreciation: "+18% / 3yr",
    risk: "Conservative",
    status: "Active",
    cover: "from-emerald-500/80 to-emerald-700",
    description:
      "AgroVest's flagship oil-palm plantation in Abeokuta. Mature harvest cycles backed by long-term off-take contracts with regional millers. Investors receive a Custody Receipt and on-asset Contract.",
  },
  {
    id: "fv-cocoa-01",
    name: "Ondo Cocoa Belt",
    category: "cocoa",
    location: "Ondo, Nigeria",
    unitsAvailable: 287,
    pricePerPlot: 1000,
    expectedYield: "10–14% / yr",
    appreciation: "+22% / 3yr",
    risk: "Moderate",
    status: "Coming soon",
    cover: "from-amber-700 to-amber-900",
    description:
      "Premium cocoa belt with global export demand. Launching next cycle — join the notify list to be first in line when units open.",
    comingSoon: true,
    launchEta: "Q1 2027",
  },
  {
    id: "fv-latex-01",
    name: "Edo Latex Reserve",
    category: "latex",
    location: "Edo, Nigeria",
    unitsAvailable: 156,
    pricePerPlot: 1000,
    expectedYield: "8–11% / yr",
    appreciation: "+15% / 3yr",
    risk: "Low",
    status: "Coming soon",
    cover: "from-teal-500 to-emerald-700",
    description:
      "Natural rubber tapping reserve with industrial-grade output. Opening to investors in the next funding window.",
    comingSoon: true,
    launchEta: "Q2 2027",
  },
];

export const properties = [
  { id: "p1", title: "Lekki Residence — 3 Bed", price: 145000, location: "Lekki, Lagos", category: "Real Estate", vendor: "GoldHaven Realty", verified: true },
  { id: "p2", title: "Toyota Camry 2022", price: 28500, location: "Abuja", category: "Automobile", vendor: "PrimeAuto", verified: true },
  { id: "p3", title: "Premium Sofa Suite", price: 3400, location: "PH, Rivers", category: "Household", vendor: "Aurum Living", verified: false },
];

export const consultants = [
  { id: "c1", name: "Adaobi Nwosu", role: "Marketing Strategy", rating: 4.9, certified: true, fee: 250 },
  { id: "c2", name: "Idris Bello", role: "Brand Promotion", rating: 4.8, certified: true, fee: 320 },
  { id: "c3", name: "Marie Okafor", role: "Investor Comms", rating: 4.7, certified: false, fee: 180 },
];

export const documents = [
  { id: "d1", title: "Custody Receipt — Abeokuta Palm", status: "Issued" as const, date: "2025-08-12" },
  { id: "d2", title: "Asset Contract — Abeokuta Palm", status: "Signed" as const, date: "2025-08-12" },
  { id: "d3", title: "Custody Receipt — Ondo Cocoa", status: "Pending" as const, date: "2025-09-02" },
];

// Fee structure (locked):
//   Platform fee   = 3% of base
//   Escrow reserve = 20% of base (held in escrow, released on milestones)
//   Network fee    = 0.5% on bundle units (acre / hectare) only
// 1 plot = $1,000; 6 plots = 1 acre ($5,880 after discount); 15 plots = 1 hectare ($14,700).
export const FEES = { platformPct: 0.03, escrowReservePct: 0.2, networkPct: 0.005 } as const;

export function priceFor(unit: "plot" | "acre" | "hectare", qty: number) {
  const base = unit === "plot" ? 1000 * qty : unit === "acre" ? 6000 * qty : 15000 * qty;
  const platformFee = Math.round(base * FEES.platformPct);
  const networkFee = unit === "plot" ? 0 : Math.round(base * FEES.networkPct);
  const escrowReserve = Math.round(base * FEES.escrowReservePct);
  const subtotal = base + platformFee + networkFee;
  const discount =
    unit === "acre" ? subtotal - 5880 * qty : unit === "hectare" ? subtotal - 14700 * qty : 0;
  const final = subtotal - Math.max(discount, 0);
  return { base, platformFee, networkFee, escrowReserve, subtotal, discount: Math.max(discount, 0), final };
}

export function propertyFees(price: number) {
  const platformFee = Math.round(price * FEES.platformPct);
  const escrowReserve = Math.round(price * FEES.escrowReservePct);
  const total = price + platformFee;
  return { price, platformFee, escrowReserve, total };
}
