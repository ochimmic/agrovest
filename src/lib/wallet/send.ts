// Gas estimation and on-chain transfers for AssetVault.
import { Contract, formatEther, parseUnits } from "ethers";
import { ERC20_ABI, type TokenConfig } from "./chain";
import { getSigner, provider, recordTx, refreshBalances, updateTx, getVaultState } from "./store";

export type GasQuote = { bnb: number; usd: number };

export async function estimateGas(token: TokenConfig, to: string, amount: string): Promise<GasQuote> {
  const p = provider();
  const fee = await p.getFeeData();
  const price = fee.gasPrice ?? parseUnits("3", "gwei");
  // Native transfers are 21k; BEP-20 transfers are ~55k.
  const units = token.native ? 21_000n : 60_000n;
  const bnb = Number(formatEther(price * units));
  const nativeUsd = 612.4;
  void to; void amount;
  return { bnb, usd: bnb * nativeUsd };
}

export async function sendToken(opts: {
  token: TokenConfig;
  to: string;
  amount: string;
  note?: string;
  kind?: "send" | "payment";
}) {
  const s = getSigner();
  if (!s) throw new Error("Unlock your AssetVault first.");
  const wallet = s.connect(provider());
  const value = parseUnits(opts.amount, opts.token.decimals);

  let hash: string;
  if (opts.token.native) {
    const tx = await wallet.sendTransaction({ to: opts.to, value });
    hash = tx.hash;
  } else {
    if (!opts.token.address) throw new Error(`${opts.token.symbol} has no contract address configured yet.`);
    const c = new Contract(opts.token.address, ERC20_ABI, wallet);
    const tx = await c.transfer!(opts.to, value);
    hash = tx.hash;
  }

  recordTx({
    hash,
    kind: opts.kind ?? "send",
    token: opts.token.symbol,
    amount: Number(opts.amount),
    to: opts.to,
    from: wallet.address,
    status: "pending",
    at: new Date().toISOString(),
    network: getVaultState().network,
    ...(opts.note ? { note: opts.note } : {}),
  });

  void provider()
    .waitForTransaction(hash, 1, 120_000)
    .then((r) => {
      updateTx(hash, { status: r && r.status === 1 ? "confirmed" : "failed" });
      void refreshBalances();
    })
    .catch(() => updateTx(hash, { status: "failed" }));

  return hash;
}
