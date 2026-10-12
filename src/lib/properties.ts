// Buy Assets houses — managed by AgroVest admins in the cloud. Prices are stored in NGN (source of truth).
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NGN_PER_USD } from "@/lib/fx";
import { propertyPrice } from "@/lib/pricing";
import houseLekki from "@/assets/house-lekki.jpg";
import houseAbuja from "@/assets/house-abuja.jpg";
import houseAbeokuta from "@/assets/house-abeokuta.jpg";

const SAMPLE_IMAGES: Record<string, string> = { p1: houseLekki, p2: houseAbuja, p3: houseAbeokuta };

export type HouseRow = {
  id: string; title: string; location: string; category: string; market_price_ngn: number;
  title_doc: string; verified: boolean; inspection_date: string; survey_ok: boolean; structural_ok: boolean;
  title_search_ok: boolean; description: string; disclaimer: string; image_path: string | null; status: string;
  created_at: string;
};
export type House = HouseRow & {
  image: string | null;
  /** Market price in USD, derived from NGN. */
  price: number;
};

export const ngnToUsd = (ngn: number) => Math.round((ngn / NGN_PER_USD) * 100) / 100;
export const housePrice = (h: { market_price_ngn: number }) => propertyPrice(ngnToUsd(Number(h.market_price_ngn)));

async function imageUrl(row: HouseRow) {
  if (row.image_path) {
    const { data } = await supabase.storage.from("property-images").createSignedUrl(row.image_path, 60 * 60 * 24 * 7);
    if (data?.signedUrl) return data.signedUrl;
  }
  return SAMPLE_IMAGES[row.id] ?? null;
}

async function hydrate(rows: HouseRow[]): Promise<House[]> {
  return Promise.all(rows.map(async (r) => ({ ...r, market_price_ngn: Number(r.market_price_ngn), price: ngnToUsd(Number(r.market_price_ngn)), image: await imageUrl(r) })));
}

export async function fetchHouses(opts: { all?: boolean } = {}) {
  let q = supabase.from("properties").select("*").order("created_at", { ascending: false });
  if (!opts.all) q = q.in("status", ["active", "sold"]);
  const { data, error } = await q;
  if (error) throw error;
  return hydrate((data ?? []) as HouseRow[]);
}

export async function fetchHouse(id: string) {
  const { data } = await supabase.from("properties").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  return (await hydrate([data as HouseRow]))[0]!;
}

export function useHouses(opts: { all?: boolean } = {}) {
  const [houses, setHouses] = useState<House[] | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    fetchHouses(opts).then((h) => live && setHouses(h)).catch(() => live && setHouses([]));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.all, tick]);
  return { houses, reload: () => setTick((t) => t + 1) };
}

export function useHouse(id: string) {
  const [house, setHouse] = useState<House | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    fetchHouse(id).then((h) => live && setHouse(h)).catch(() => live && setHouse(null));
    return () => { live = false; };
  }, [id]);
  return house;
}
