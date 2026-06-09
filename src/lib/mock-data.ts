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
  status: "Active" | "Reserved" | "Funding";
  cover: string; // gradient class
  description: string;
};

export const farmAssets: FarmAsset[] = [
  {
    id: "fv-palm-01",
    name: "Cross River Palm Estate",
    category: "palm",
    location: "Cross River, Nigeria",
    unitsAvailable: 412,
    pricePerPlot: 1000,
    expectedYield: "9–12% / yr",
    appreciation: "+18% / 3yr",
    risk: "Conservative",
    status: "Active",
    cover: "from-emerald-500/80 to-emerald-700",
    description:
      "Mature oil palm plantation with established harvest cycles. Yields backed by long-term off-take contracts with regional millers.",
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
    status: "Active",
    cover: "from-amber-700 to-amber-900",
    description:
      "Premium cocoa belt with global export demand. Investors receive custody receipt and on-asset contract.",
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
    status: "Funding",
    cover: "from-teal-500 to-emerald-700",
    description:
      "Natural rubber tapping reserve with industrial-grade output, supported by long-cycle commodity contracts.",
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
  { id: "d1", title: "Custody Receipt — Cross River Palm", status: "Issued" as const, date: "2025-08-12" },
  { id: "d2", title: "Asset Contract — Cross River Palm", status: "Signed" as const, date: "2025-08-12" },
  { id: "d3", title: "Custody Receipt — Ondo Cocoa", status: "Pending" as const, date: "2025-09-02" },
];

// Unit math per brief: 1 plot = $1,000; 6 plots = 1 acre ($5,880 after discount); 15 plots = 1 hectare ($14,700).
export function priceFor(unit: "plot" | "acre" | "hectare", qty: number) {
  const base = unit === "plot" ? 1000 * qty : unit === "acre" ? 6000 * qty : 15000 * qty;
  const platformFee = Math.round(base * 0.02);
  const networkFee = unit === "plot" ? 0 : Math.round(base * 0.005);
  const subtotal = base + platformFee + networkFee;
  const discount =
    unit === "acre" ? subtotal - 5880 * qty : unit === "hectare" ? subtotal - 14700 * qty : 0;
  const final = subtotal - Math.max(discount, 0);
  return { base, platformFee, networkFee, subtotal, discount: Math.max(discount, 0), final };
}
