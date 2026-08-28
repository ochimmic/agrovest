# AgroVest MVP: Real BSC AssetVault, Manual Payments, GoPay Retired

AssetVault stays and becomes a real BSC (BEP-20) wallet. Every in-app payment is deducted from AssetVault. GoPay stops being a P2P product and becomes a read-only deposit history. Admin confirmation stays manual.

## 1. AssetVault becomes a real BSC wallet

Non-custodial wallet that runs in the browser — keys never leave the device, no backend holds funds.

- Create wallet: generate a 12-word phrase (BIP-39), show it once, confirm it, then encrypt the key with the user's password and store only the encrypted blob locally. Import an existing phrase or private key too.
- Unlock with password (or biometric prompt where the device supports it) before any send.
- Live balances read from the BSC chain: BNB, USDT, cUSD, $CLYST, plus **Add token** by contract address for any other BEP-20.
- Receive: address + QR + copy.
- Send: pick token, paste/scan address, amount with max, live gas estimate in BNB and NGN/USD, confirm sheet, then a real on-chain transaction with a BscScan link and pending → confirmed status.
- Activity list backed by real chain history for the wallet address.
- Network switch between BSC Mainnet and BSC Testnet so the whole thing can be tested end to end with free test BNB before going live.

Markets strip, cUSD balance card, and the existing badges stay.

### Two things that need your input

- **Token contracts.** Real balances need real BEP-20 contract addresses for cUSD and $CLYST on BSC. USDT and BNB are known. If those two tokens aren't deployed yet, they'll be wired as configurable addresses and stay at zero until you supply them — everything else still works.
- **Mainnet is real money.** The MVP will default to BSC Testnet so we can test safely; flipping to mainnet is a one-line config change once you're happy.

## 2. Payments come out of AssetVault

One shared checkout used by FarmVest, Buy Assets, and anything else:

```text
Pick asset / amount
        ↓
Pay from AssetVault  →  cUSD / USDT / $CLYST balance check
        ↓
Sign + send on-chain to the AgroVest treasury address
        ↓
Order status: awaiting admin confirmation   ← chat or call admin
        ↓
Admin confirms  →  holding created, documents issued
Admin rejects   →  reason shown, retry or dispute
```

- Insufficient balance offers a **Fund wallet** route.
- Nothing is credited and no holding is created until an admin confirms — the on-chain transfer alone doesn't complete a purchase.

## 3. Funding the wallet (One-Time Account stays)

Two ways to add value, both manually confirmed:

- **Bank transfer (NGN)** — generates a One-Time Account number with the existing countdown and "I've made the transfer" step. Admin confirms and credits cUSD.
- **Crypto deposit** — send USDT/BNB/$CLYST straight to the wallet address; arrives on-chain with no admin step.

## 4. GoPay retired

- Removed from the bottom tab bar and from the services grid.
- The screen survives as **Deposit history** reachable from Profile and from AssetVault, listing past and pending bank-transfer deposits with their status. Existing saved orders keep working.
- No P2P, no counterparties, no sell side.

New investor tab bar: `Home · Invest · AssetVault · Buy Assets · Profile`.

## 5. Admin confirmation

One **Payments** queue in the admin area covering bank deposits and asset purchases: user, purpose, amount (NGN + USD), method, on-chain tx hash where applicable, submitted time, age. Actions: Confirm, Reject with reason, Request more info. Confirmation is the only thing that credits a balance or creates a holding, and every action leaves an audit entry.

## 6. Build and test

Testing is part of this pass, not an afterthought: create a wallet, fund it with testnet BNB/USDT, send between two addresses, buy an asset with the balance, confirm it from the admin queue, and check the holding and documents appear. Dark mode and the contrast check run over every new screen.

## Technical notes

- `ethers` v6 in the browser. Encrypted JSON keystore in localStorage; password-derived key, never persisted in plain text.
- `src/lib/wallet/` — chain config (RPC, chainId, explorer, token list), keystore, balances (multicall-style batched `balanceOf`), send/gas, tx history via BscScan API.
- BSC RPC and BscScan API key proxied through a TanStack server function so the key isn't in the client bundle.
- `src/lib/payments.ts` — one order model (`draft → paid_onchain | awaiting_transfer → admin_review → confirmed | rejected`) that both the wallet checkout and the bank-transfer flow feed into. `src/lib/farmremit.ts` refactors onto it, keeping the existing hydrate/recover logic so saved orders survive.
- Wallet screens are client-only (`ClientOnly` / lazy import) — key material and `window.crypto` must not touch SSR.
- `/vault` gains sub-routes for send, receive, add-token, and settings; `wallet.swap` is dropped, `wallet.history` folds into the vault activity list.
- New `admin.payments.tsx` plus a panel on the desktop console.
- State stays in localStorage this pass; balances and transactions are real chain data. Real accounts and server-side confirmation come with Lovable Cloud in the next pass.

## Out of scope

- Swaps / DEX routing
- Custodial recovery of lost phrases (impossible by design)
- Broker vs Investor dashboard split — next pass, as agreed
