// Encrypted, non-custodial key storage. The mnemonic/private key never leaves
// the device: only an ethers encrypted-JSON keystore blob is persisted.
import { HDNodeWallet, Mnemonic, Wallet } from "ethers";

const KEY = "agrovest_vault_keystore_v1";
const META = "agrovest_vault_meta_v1";

export type VaultMeta = {
  address: string;
  createdAt: string;
  /** true when the wallet was imported rather than generated here */
  imported: boolean;
  backedUp: boolean;
};

export function hasVault() {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(KEY);
}

export function readMeta(): VaultMeta | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(META);
    return raw ? (JSON.parse(raw) as VaultMeta) : null;
  } catch {
    return null;
  }
}

export function writeMeta(patch: Partial<VaultMeta>) {
  if (typeof window === "undefined") return;
  const next = { ...(readMeta() ?? { address: "", createdAt: new Date().toISOString(), imported: false, backedUp: false }), ...patch };
  localStorage.setItem(META, JSON.stringify(next));
}

export function readKeystore() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}

export function clearVault() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  localStorage.removeItem(META);
}

/** Generate a fresh BIP-39 12-word wallet (not yet persisted). */
export function generateWallet(): HDNodeWallet {
  return Wallet.createRandom();
}

export function walletFromPhrase(phrase: string): HDNodeWallet {
  const clean = phrase.trim().replace(/\s+/g, " ").toLowerCase();
  if (!Mnemonic.isValidMnemonic(clean)) throw new Error("That recovery phrase isn't valid.");
  return HDNodeWallet.fromPhrase(clean);
}

export function walletFromPrivateKey(pk: string): Wallet {
  const clean = pk.trim();
  return new Wallet(clean.startsWith("0x") ? clean : `0x${clean}`);
}

/** Encrypt with the user's password and persist. Returns the address. */
export async function persistWallet(
  wallet: HDNodeWallet | Wallet,
  password: string,
  opts: { imported: boolean; backedUp: boolean },
) {
  const json = await wallet.encrypt(password);
  localStorage.setItem(KEY, json);
  writeMeta({
    address: wallet.address,
    createdAt: new Date().toISOString(),
    imported: opts.imported,
    backedUp: opts.backedUp,
  });
  return wallet.address;
}

/** Decrypt the stored keystore with the password. Throws on bad password. */
export async function unlockWallet(password: string): Promise<HDNodeWallet | Wallet> {
  const json = readKeystore();
  if (!json) throw new Error("No wallet on this device.");
  try {
    return await Wallet.fromEncryptedJson(json, password);
  } catch {
    throw new Error("Wrong password.");
  }
}
