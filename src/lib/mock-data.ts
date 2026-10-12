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
    pricePerPlot: 741.94,
    expectedYield: "30–50% / yr (from Y3)",
    appreciation: "+18% / 3yr",
    risk: "Conservative",
    status: "Active",
    cover: "from-emerald-500/80 to-emerald-700",
    image: abeokutaPalmEstate.url,
    description:
      "AgroVest's flagship oil-palm plantation in Abeokuta. Mature harvest cycles backed by long-term off-take contracts with regional millers. Investors receive a Custody Receipt and on-asset Contract.",
  },
  {
    id: "fv-cocoa-01",
    name: "Ondo Cocoa Belt",
    category: "cocoa",
    location: "Ondo, Nigeria",
    unitsAvailable: 287,
    pricePerPlot: 741.94,
    expectedYield: "30–50% / yr (from Y3)",
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
    pricePerPlot: 741.94,
    expectedYield: "30–50% / yr (from Y3)",
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

import { landPrice, propertyPrice, type LandUnit } from "@/lib/pricing";
export function priceFor(unit: LandUnit, qty: number) { return landPrice(unit, qty); }
export function propertyFees(price: number) { return propertyPrice(price); }
