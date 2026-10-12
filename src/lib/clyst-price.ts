// Live $CLYST and BNB prices read from PancakeSwap V2 pools on BSC Mainnet.
// CLYST/WBNB pool gives CLYST in BNB; WBNB/USDT pool gives BNB in USD.
// Results are written back into TOKENS so wallet totals and crypto checkout use live prices.
import { Contract, JsonRpcProvider } from "ethers";
import { useEffect, useState } from "react";
import { NETWORKS, TOKENS } from "@/lib/wallet/chain";

const FACTORY = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const USDT = "0x55d398326f99059fF775485246999027B3197955";
const CLYST = "0xd9C15c88BA928DA13BBBA96DF5054290ed76d3cD";
const PAIR_ABI = [
  "function getReserves() view returns (uint112,uint112,uint32)",
  "function token0() view returns (address)",
];

export type LivePrices = { clystUsd: number; bnbUsd: number; clystBnb: number; at: number };

let cache: LivePrices | null = null;
let inflight: Promise<LivePrices> | null = null;
const TTL = 60_000;

/** Price of `base` quoted in `quote` from a V2 pair (both tokens 18 decimals on BSC). */
async function pairPrice(p: JsonRpcProvider, base: string, quote: string) {
  const f = new Contract(FACTORY, ["function getPair(address,address) view returns (address)"], p);
  const pair: string = await f.getFunction("getPair")(base, quote);
  if (/^0x0+$/.test(pair)) throw new Error("No PancakeSwap pool");
  const c = new Contract(pair, PAIR_ABI, p);
  const [t0, r] = await Promise.all([c.getFunction("token0")(), c.getFunction("getReserves")()]);
  const [r0, r1] = [Number(r[0]), Number(r[1])];
  return (t0 as string).toLowerCase() === base.toLowerCase() ? r1 / r0 : r0 / r1;
}

export async function fetchLivePrices(): Promise<LivePrices> {
  if (cache && Date.now() - cache.at < TTL) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    const p = new JsonRpcProvider(NETWORKS["bsc-mainnet"].rpc, 56, { staticNetwork: true });
    const [clystBnb, bnbUsd] = await Promise.all([pairPrice(p, CLYST, WBNB), pairPrice(p, WBNB, USDT)]);
    const out = { clystBnb, bnbUsd, clystUsd: clystBnb * bnbUsd, at: Date.now() };
    cache = out;
    for (const list of Object.values(TOKENS)) {
      for (const t of list) {
        if (t.symbol === "CLYST") t.usd = out.clystUsd;
        if (t.native) t.usd = out.bnbUsd;
      }
    }
    return out;
  })().finally(() => { inflight = null; });
  return inflight;
}

export function useLivePrices() {
  const [prices, setPrices] = useState<LivePrices | null>(cache);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    const run = () => fetchLivePrices().then((x) => alive && (setPrices(x), setError(false))).catch(() => alive && setError(true));
    run();
    const t = setInterval(run, TTL);
    return () => { alive = false; clearInterval(t); };
  }, []);
  return { prices, error };
}

export function fmtClyst(n: number) {
  return n >= 1000 ? Math.round(n).toLocaleString() : n.toLocaleString(undefined, { maximumSignificantDigits: 6 });
}
