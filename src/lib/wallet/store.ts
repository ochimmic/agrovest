// Reactive AssetVault state: network, tokens, balances, unlocked signer.
// Balances and transactions are real on-chain data read over JSON-RPC.
import { useSyncExternalStore } from "react";
import { Contract, JsonRpcProvider, formatUnits } from "ethers";
import type { HDNodeWallet, Wallet } from "ethers";
import {
  DEFAULT_NETWORK, ERC20_ABI, NETWORKS, TOKENS,
  type NetworkId, type TokenConfig,
} from "./chain";
import { hasVault, readMeta } from "./keystore";

export type Balance = { symbol: string; raw: bigint; formatted: number };

export type VaultTx = {
  hash: string;
  kind: "send" | "receive" | "payment";
  token: string;
  amount: number;
  to?: string;
  from?: string;
  status: "pending" | "confirmed" | "failed";
  at: string;
  network: NetworkId;
  note?: string;
};

type State = {
  ready: boolean;          // hydrated from localStorage
  exists: boolean;         // a keystore is present
  address: string | null;
  network: NetworkId;
  customTokens: TokenConfig[];
  balances: Record<string, Balance>;
  loading: boolean;
  error: string | null;
  txs: VaultTx[];
};

const NET_KEY = "agrovest_vault_network_v1";
const TOK_KEY = "agrovest_vault_tokens_v1";
const TX_KEY = "agrovest_vault_txs_v1";

let state: State = {
  ready: false,
  exists: false,
  address: null,
  network: DEFAULT_NETWORK,
  customTokens: [],
  balances: {},
  loading: false,
  error: null,
  txs: [],
};

const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }
function set(patch: Partial<State>) { state = { ...state, ...patch }; emit(); }

let hydrated = false;
export function hydrateVault() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  let network = DEFAULT_NETWORK;
  let customTokens: TokenConfig[] = [];
  let txs: VaultTx[] = [];
  try {
    const n = localStorage.getItem(NET_KEY) as NetworkId | null;
    if (n && NETWORKS[n]) network = n;
    customTokens = JSON.parse(localStorage.getItem(TOK_KEY) ?? "[]");
    txs = JSON.parse(localStorage.getItem(TX_KEY) ?? "[]");
  } catch { /* ignore */ }
  const meta = readMeta();
  set({
    ready: true,
    exists: hasVault(),
    address: meta?.address ?? null,
    network,
    customTokens,
    txs,
  });
  if (meta?.address) void refreshBalances();
}

export function useVault<T>(sel: (s: State) => T): T {
  if (typeof window !== "undefined" && !hydrated) queueMicrotask(hydrateVault);
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => sel(state),
    () => sel(state),
  );
}

export function getVaultState() { return state; }

export function tokenList(s: State = state): TokenConfig[] {
  return [...TOKENS[s.network], ...s.customTokens];
}

export function provider(net: NetworkId = state.network) {
  return new JsonRpcProvider(NETWORKS[net].rpc, NETWORKS[net].chainId, { staticNetwork: true });
}

export function setNetwork(net: NetworkId) {
  localStorage.setItem(NET_KEY, net);
  set({ network: net, balances: {} });
  void refreshBalances();
}

export function setAddress(address: string | null) {
  set({ address, exists: !!address, balances: {} });
  if (address) void refreshBalances();
}

export function addCustomToken(t: TokenConfig) {
  const next = [...state.customTokens.filter((x) => x.address.toLowerCase() !== t.address.toLowerCase()), { ...t, custom: true }];
  localStorage.setItem(TOK_KEY, JSON.stringify(next));
  set({ customTokens: next });
  void refreshBalances();
}

export function removeCustomToken(address: string) {
  const next = state.customTokens.filter((x) => x.address.toLowerCase() !== address.toLowerCase());
  localStorage.setItem(TOK_KEY, JSON.stringify(next));
  set({ customTokens: next });
}

export async function refreshBalances() {
  const { address, network } = state;
  if (!address) return;
  set({ loading: true, error: null });
  const p = provider(network);
  const tokens = tokenList();
  const out: Record<string, Balance> = {};
  try {
    await Promise.all(
      tokens.map(async (t) => {
        try {
          let raw = 0n;
          if (t.native) {
            raw = await p.getBalance(address);
          } else if (t.address) {
            const c = new Contract(t.address, ERC20_ABI, p);
            raw = await c.balanceOf!(address);
          }
          out[t.symbol] = { symbol: t.symbol, raw, formatted: Number(formatUnits(raw, t.decimals)) };
        } catch {
          out[t.symbol] = { symbol: t.symbol, raw: 0n, formatted: 0 };
        }
      }),
    );
    set({ balances: out, loading: false });
  } catch (e: any) {
    set({ loading: false, error: e?.message ?? "Could not reach the network." });
  }
}

export function balanceOf(symbol: string) {
  return state.balances[symbol]?.formatted ?? 0;
}

/** Total portfolio value in USD across all held tokens. */
export function totalUsd() {
  return tokenList().reduce((sum, t) => sum + (state.balances[t.symbol]?.formatted ?? 0) * t.usd, 0);
}

function persistTxs() {
  try { localStorage.setItem(TX_KEY, JSON.stringify(state.txs.slice(0, 100))); } catch { /* ignore */ }
}

export function recordTx(tx: VaultTx) {
  set({ txs: [tx, ...state.txs.filter((t) => t.hash !== tx.hash)] });
  persistTxs();
}

export function updateTx(hash: string, patch: Partial<VaultTx>) {
  set({ txs: state.txs.map((t) => (t.hash === hash ? { ...t, ...patch } : t)) });
  persistTxs();
}

/** In-memory only — never persisted. Cleared on lock/refresh. */
let signer: HDNodeWallet | Wallet | null = null;
export function setSigner(w: HDNodeWallet | Wallet | null) { signer = w; emit(); }
export function getSigner() { return signer; }
export function isUnlocked() { return !!signer; }
