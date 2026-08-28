# AgroVest: Manual Payments, Two Roles, No AssetVault

Three changes: remove AssetVault, make every payment a manual (admin-confirmed) transfer, and split the app into streamlined Investor and Broker experiences.

## 1. Remove AssetVault

- Delete the `/vault` screen and drop it from the bottom tab bar.
- Replace the Vault tab with **Buy Assets**, routed to `/invest/property` (the existing Buy Assets catalogue), with correct active-state highlighting.
- Wallet sub-screens that only existed to serve the Vault (`/wallet/swap`, `/wallet/history`, `/wallet/security`, wallet setup) are folded down to a single read-only **Balance** card inside Profile: confirmed cUSD balance plus a link to payment history. No swap, no markets strip.
- The `cUSD` unit stays as the internal credit users hold after a confirmed payment, with the NGN equivalent shown beside it everywhere.

New investor tab bar: `Home · FarmVest · Buy Assets · GoPay · Profile`.

## 2. One manual payment system

Every payment in the app — FarmVest investment, Buy Assets purchase, GoPay top-up — routes through one shared flow instead of separate checkout logic.

```text
User picks asset / amount
        ↓
Payment Instructions screen
  ├── Bank transfer  → One-Time Account number, bank, beneficiary, countdown
  ├── USDT (BEP-20)  → wallet address + QR + copy
  └── $CLYST         → wallet address + QR + copy
        ↓
"I have made the payment"  (+ optional reference / receipt upload)
        ↓
Status: Awaiting admin confirmation   ← user can chat or call admin
        ↓
Admin approves  →  credit applied, holding created, receipt issued
Admin rejects   →  reason shown, user can retry or dispute
```

- Payment destinations (bank account, USDT address, CLYST address) live in one config file so they can be changed in a single place.
- Every payment creates an **order** with a full status timeline the user can revisit from GoPay or Profile at any time.
- Nothing is credited, and no holding is created, until an admin confirms. Purchases stay in a pending state with a clear badge.

## 3. Admin confirmation protocol

A single **Payments** queue in the admin area (mobile and desktop) listing every pending payment across all products:

- Columns: user, product/purpose, amount (NGN + USD), method, reference, submitted time, age.
- Actions: **Confirm** (credits the user and completes the purchase), **Reject** (requires a reason), **Request more info** (asks for a clearer receipt).
- Filters by status and method; confirmed items keep an audit trail entry with who confirmed and when.
- Confirmation is the only path that changes a user's balance or creates a holding.

## 4. Investor vs Broker

Role is chosen at signup and remembered; sign-in sends each user to their own home.

**Investor** — lands on `/home`
- Portfolio value, active holdings, pending payments, yield outlook
- Tabs: Home · FarmVest · Buy Assets · GoPay · Profile

**Broker** — lands on `/broker`
- Rebuilt dashboard: total referred volume, commission earned vs paid out, lead pipeline by stage, reward-tier progress, referral code/share
- **Request payout** uses the same manual flow in reverse: broker submits payout details, admin confirms the transfer
- Tabs: Dashboard · Leads · Rewards · GoPay · Profile — no Invest/Buy Assets tabs

Vendor and Partner screens remain reachable but are not part of the two primary paths.

## Technical notes

- New `src/lib/payments.ts`: unified order model (`draft → awaiting_payment → submitted → admin_review → confirmed | rejected`), payment-method config, and the credit/holding side effects that only run on confirm. `src/lib/farmremit.ts` is refactored to sit on top of it so existing GoPay orders keep working (the existing hydrate/recover logic is preserved for orders already in localStorage).
- New shared route `/pay/$orderId` renders instructions, countdown, method tabs, "I've paid", and the step tracker — replacing the duplicated logic currently in `prichat.$id.tsx` and `invest.checkout.$id.tsx`.
- `BottomNav` becomes role-aware, reading `role` from the store; `AppShell` passes it through.
- `/vault` is deleted; `wallet.swap`, `wallet.history`, `wallet.security` are removed and their inbound links repointed to Profile.
- Login and signup set `role` and redirect accordingly; a small role guard sends brokers away from investor-only routes and vice versa.
- New admin route `admin.payments.tsx` plus a panel on the desktop console.
- State stays in the existing localStorage store — no backend in this pass, so "admin" actions are performed from the admin screens in the same app. Wiring this to Lovable Cloud (real accounts, server-side confirmation, RLS) is the natural next step once the flows are approved.

## Out of scope for this pass

- Automatic payment verification or on-chain listening
- Real authentication and multi-device sync
