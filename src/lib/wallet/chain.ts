// BSC network + token configuration for AssetVault.
// Switch DEFAULT_NETWORK to "mainnet" when going live.

export type NetworkId = "bsc-testnet" | "bsc-mainnet";

export type NetworkConfig = {
  id: NetworkId;
  label: string;
  chainId: number;
  rpc: string;
  explorer: string;
  nativeSymbol: string;
  faucet?: string;
};

export const NETWORKS: Record<NetworkId, NetworkConfig> = {
  "bsc-testnet": {
    id: "bsc-testnet",
    label: "BSC Testnet",
    chainId: 97,
    rpc: "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
    explorer: "https://testnet.bscscan.com",
    nativeSymbol: "tBNB",
    faucet: "https://www.bnbchain.org/en/testnet-faucet",
  },
  "bsc-mainnet": {
    id: "bsc-mainnet",
    label: "BSC Mainnet",
    chainId: 56,
    rpc: "https://bsc-dataseed.bnbchain.org",
    explorer: "https://bscscan.com",
    nativeSymbol: "BNB",
  },
};

export const DEFAULT_NETWORK: NetworkId = "bsc-mainnet";

export type TokenConfig = {
  symbol: string;
  name: string;
  decimals: number;
  /** Empty string = contract not deployed / not supplied yet. */
  address: string;
  native?: boolean;
  /** USD price used for the fiat equivalent shown in the UI. */
  usd: number;
  custom?: boolean;
};

/** Built-in tokens per network. Addresses can be swapped in one place. */
export const TOKENS: Record<NetworkId, TokenConfig[]> = {
  "bsc-mainnet": [
    { symbol: "BNB", name: "BNB", decimals: 18, address: "", native: true, usd: 612.4 },
    { symbol: "USDT", name: "Tether USD", decimals: 18, address: "0x55d398326f99059fF775485246999027B3197955", usd: 1 },
    { symbol: "CLYST", name: "Clyst", decimals: 18, address: "0xd9C15c88BA928DA13BBBA96DF5054290ed76d3cD", usd: 0.42 },
  ],
  "bsc-testnet": [
    { symbol: "tBNB", name: "Test BNB", decimals: 18, address: "", native: true, usd: 612.4 },
    { symbol: "USDT", name: "Tether USD (test)", decimals: 18, address: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd", usd: 1 },
  ],
};

/** Tokens accepted for AgroVest purchases. */
export const PAYABLE_SYMBOLS = ["USDT", "BNB", "tBNB", "CLYST"];

/** Where in-app payments are sent — one BSC treasury for BNB, USDT and $CLYST. */
export const TREASURY_ADDRESS = "0x69f4d2fabde49656e24a65f06106ccbc2f64e295";

export const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

export function txUrl(net: NetworkId, hash: string) {
  return `${NETWORKS[net].explorer}/tx/${hash}`;
}
export function addressUrl(net: NetworkId, addr: string) {
  return `${NETWORKS[net].explorer}/address/${addr}`;
}
export function shortAddr(a?: string | null) {
  if (!a) return "";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}
