# AgroVest Secure Assets

Build a complete high-fidelity mobile-first AgroVest app from start to finish using the uploaded documents:

AgroVest Brand Guideline

AgroVest UI/UX Product Brief

Read and follow both documents carefully. The UI/UX Product Brief is the final product logic source. If there is any conflict between older ideas and the regenerated UI/UX brief, follow the regenerated UI/UX brief.

APP IDENTITY

AgroVest is a premium, secure, privacy-first, technology-led, investment-focused, eco-conscious, crypto-compliant real-world asset platform. It should not feel like a farming app, a casual marketplace, or a meme-coin crypto app. It should feel like a serious Apple-level investment and ownership platform for real-world assets.

Core brand tone:
Security. Privacy. Investment. Technology. Real-world asset ownership.

Use the AgroVest brand system:

Midnight Navy: #1B294F

Privacy Violet: #6D5DF6

Agro Green: #00D084

Graphite Black: #101418

Soft White: #F7F9FB

Supporting violet and green shades from the brand guide

Use Inter as the main app interface font

Use Neue Haas Grotesk only for hero-level brand moments if available

Follow the uploaded logo rules exactly

Do not distort, recolor, rotate, or misuse the AgroVest logo

Keep the icon before the wordmark when using the full logo

DESIGN QUALITY REQUIREMENT

Create a premium mobile app with a smooth, fluid, Apple-product feel.

The app must feel:

Smooth

Clean

Minimal

Secure

Premium

Modern

Trustworthy

Fluid

Investment-grade

Use:

Soft screen transitions

Smooth onboarding animations

Card-based layouts

Rounded premium surfaces

Subtle glassmorphism only where appropriate

Gentle shadows

Animated progress states

Fluid tab navigation

Micro-interactions on buttons, cards, toggles, forms, wallet actions, and verification states

Loading skeletons

Animated success states

Empty states

Error states

Security confirmation modals

Motion should be elegant and calm, not childish or overly flashy

APP FLOW

Create the app beginning with:

Splash Screen

Intro / Welcome Screen

User Category Selection Screen

Role-specific Signup Flow

KYC / Verification where required

Wallet Setup where required

Role-based Dashboard

Role-based Navigation and Modules

IMPORTANT ONBOARDING CHANGE

Immediately after the welcome/intro screen, show a user category selection screen.

The user must choose what they are signing in as before signup because each category has different signup requirements.

Show four signup categories:

Explorer

Investor

Vendor

Broker

Do not show Partner as a signup category.

Partner is not a normal onboarding role. Partner is an achieved status. Any Explorer, Investor, Vendor, or Broker can become a Partner only after reaching a defined level of commitment, verification, performance, investment volume, transaction history, or admin approval.

On the role selection screen, include a subtle locked Partner message:
“Partner status is unlocked after verified commitment and AgroVest approval.”

USER CATEGORY LOGIC

EXPLORER

Purpose:
A user who wants to browse, learn, understand AgroVest, view asset previews, and explore before committing.

Explorer signup requirements:

Full name

Email or phone number

Password

Country

Accept Terms, Privacy Policy, and Risk Notice

Optional: Start KYC later

Optional: Create or import wallet later

Explorer permissions:

View public asset summaries

View educational content

Preview FarmVest assets

Preview Property Store

Learn about AssetVault

Start KYC

Upgrade to Investor, Vendor, or Broker later

Explorer dashboard:

Welcome card

KYC prompt

“How AgroVest ownership works” education card

FarmVest preview

AssetVault education card

Role upgrade card

Support card

INVESTOR

Purpose:
A verified user who can invest in FarmVest and other real-world asset opportunities.

Investor signup requirements:

Full legal name

Email or phone number

Password

Country

Nationality

Date of birth

Valid ID upload

Face verification

Address information

Accept investment terms, risk notice, privacy policy, and custody/contract notice

Wallet setup: create or import non-custodial wallet

Recovery phrase education and confirmation

Investor permissions:

Complete KYC

Create/import wallet

View $CLYST/BSC wallet section

Invest in FarmVest

View price breakdown

Pay

Receive custody receipt and contract

Track portfolio

Track expected returns, projected yield, and asset appreciation

Access documents

Access support/dispute flow

Investor dashboard:

Portfolio value

FarmVest holdings

Wallet balance

KYC status

Documents pending/issued

Recommended FarmVest actions

Expected returns with disclaimer

Custody Receipt and Contract section

VENDOR

Purpose:
A verified seller who applies to list approved assets or products through AgroVest.

Vendor signup requirements:

Full legal name

Business name if applicable

Email or phone number

Password

Country

Vendor category

Seller type: individual or business

Valid ID upload

Face verification

Business registration document if applicable

Proof of asset ownership or right to sell

Payout wallet or payment details

Accept vendor terms, dispute policy, refund policy, and verification policy

Vendor permissions:

Apply as vendor

Track approval status

Submit listings

Manage approved listings

Manage orders

Participate in disputes/refunds

View payout/wallet status

Vendor dashboard:

Vendor verification status

Application progress

Listings

Orders

Disputes/refunds

Wallet/payments

Support

No unverified vendor should appear as active.

BROKER

Purpose:
A user who refers and closes eligible land/investment deals.

Broker signup requirements:

Full legal name

Email or phone number

Password

Country

Nationality

Valid ID upload

Face verification

Referral/business details

Broker agreement acceptance

Reward terms acceptance

Payout wallet/payment details

Optional referral source

Admin approval where needed

Broker permissions:

Referral link/code

Lead tracking

Deal attribution

Commission dashboard

Reward qualification tracking

Land/car reward progress

Director approval status

Reward history

Broker dashboard:

Referral link/code

Share button

Lead status

Commission summary

Reward progress

Director approval state

Deal history

Terms and qualification rules

PARTNER STATUS LOGIC

Partner is not a signup category.

Create Partner as an upgrade/status layer across all user roles.

A user can become Partner only after:

Reaching investment volume, vendor sales volume, referral performance, or another commitment threshold

Completing full verification

Meeting AgroVest-defined requirements

Receiving AgroVest/Admin approval

Partner UI:

Locked Partner card in Profile

“Your progress toward Partner status”

Commitment progress bar

Requirements checklist

Apply for review button when eligible

Admin approval status

Partner badge when approved

Partner dashboard only after approval

Partner dashboard features:

Advanced reporting

High-value investment view

Benefits/rewards

Governance/benefit section if enabled

Documents and status history

MAIN APP INFORMATION ARCHITECTURE

Use role-based navigation. Do not show every module equally to every user.

Main tabs:

Home

Invest

AssetVault

PriChat

Services

Profile

Home:

AgroVest logo

Notification icon

Privacy/security status

KYC status card

Portfolio or role-specific summary

Next best action

Module cards

Education strip

Support/dispute entry

Invest:

FarmVest

Property Store

InvestAI discovery

Asset comparison

AssetVault:

Non-custodial wallet

Create wallet

Import wallet

Recovery phrase education

$CLYST balance

Binance Smart Chain badge

Swap supported assets to $CLYST

Transaction history

Wallet safety checklist

PriChat:

Privacy-first messages

Meeting rooms

24-hour deletion timer

Clear notice that backups, abuse reports, legal records, compliance records, and blockchain records are excluded from deletion

Report user/message feature

Services:

M&P Consult

FarmRemit placeholder if approved

Marketplace as later phase or coming soon only

Do not make AgroVest feel like a general shopping app

Profile:

Role

KYC

Documents

Partner status

Settings

Security

Support

Legal

Wallet safety

Logout

CORE MODULES

FARMVEST

FarmVest is the core investment module.

Categories:

Palm Farm

Cocoa Farm

Latex Farm

Each FarmVest asset card should show:

Asset image

Asset name

Location

Unit availability

Price

Risk/return summary

Ownership document explanation

Status

FarmVest detail page must include:

Asset details

Unit selector: Plot, Acre, Hectare

Conversion helper:

6 plots = 1 acre

15 plots = 1 hectare

2.5 acres = 1 hectare

Quantity selector

Price calculator

Base amount

Fees placeholder

Discount after fees

Final payable

Expected return

Projected yield

Asset appreciation

Risk disclaimer

Documents issued: Custody Receipt + Contract

Timeline:
Payment confirmed → AgroVest review → Documents issued → Asset active → Returns/appreciation updates

Pricing logic:

1 plot = $1,000

1 acre = $5,880 after discount

1 hectare = $14,700 after discount

Discounts are applied after fees

Do not invent exact fee values unless the business defines them

Use placeholders such as platform fee, network fee, or processing fee only where needed

ASSETVAULT

AssetVault is the non-custodial AgroVest wallet.

Important rules:

The wallet is non-custodial

Users hold their own keys

AgroVest must not promise recovery of lost recovery phrase

$CLYST is live on Binance Smart Chain

Wallet screens:

Create wallet

Import wallet

Recovery phrase warning

Confirm recovery phrase

Wallet home

$CLYST balance

BSC network badge

Swap screen

Transaction history

Security checklist

View secret phrase with strong warning

Swap screen:

Token selected

Amount

Network fee

Rate

Slippage/price movement if applicable

Final token received

Transaction hash after completion

DOCUMENTS

Create a Documents section where users can view:

Custody Receipt

Contract

Status

Date

Download/share button

Status tags:

Pending

Issued

Signed

Updated

PROPERTY STORE

Create Property Store as a controlled property-commerce layer, not an open random marketplace.

Categories:

Real estate

Automobiles

Household assets

Each listing must show:

Vendor verification badge

AgroVest approval state

Asset documents

Seller profile

Dispute/refund policy

Support entry

M&P CONSULT

M&P means Marketing and Promotion.

Create:

Consultant list

AgroVest-certified consultant badge

Consultant profile

Booking flow

Payment state

Refund request flow

Support path

BROKER REWARDS

Create:

Broker dashboard

Referral link/code

Lead invite/share sheet

Lead tracking statuses:

Invited

KYC started

Verified

Purchase pending

Completed

Commission section

Reward progress

Land/car reward status

Director approval status

Reward certificate/history

ADMIN / OPERATIONS

Even if the main app is consumer-facing, create or specify an admin dashboard because AgroVest depends on approval workflows.

Admin dashboard areas:

KYC review

Vendor verification

Consultant certification

Disputes/refunds

Broker rewards

Partner approval

Document issuance

Audit logs

Admin states:

Submitted

Under review

Approved

Rejected

More information needed

Suspended

Pending director approval

Issued

Updated

Resolved

AUTHENTICATION AND BACKEND

Build the app with:

Supabase authentication

Supabase database

Role-based user profiles

Role-specific onboarding tables

KYC status table

Wallet metadata table

FarmVest assets table

Investment transactions table

Documents table

Vendor applications table

Listings table

Broker referrals table

Rewards table

Partner status table

PriChat messages table

Admin approvals table

Audit logs table

Use mock data where real integrations are not yet available, but structure the app so real integrations can be added later.

Do not implement unsafe real blockchain operations unless proper APIs/contracts are provided. For now, create clean UI placeholders and data models for wallet creation/import, $CLYST display, BSC network display, swaps, and transaction history.

COMPLIANCE AND TRUST UX

The UI must always be clear, conservative, and legally careful.

Add:

KYC gates before investment

KYC gates before vendor selling

KYC gates before broker rewards

Wallet safety education

Risk disclaimers

Confirmation screens

Transparent price breakdowns

Clear ownership document explanation

Privacy notices

Rejected/failed verification states

Support and dispute routes

Suggested investment disclaimer:
“Projected values are estimates based on available asset information and market assumptions. Actual results may vary. Review the custody receipt, contract, and risk information before investing.”

SCREEN LIST TO CREATE

Create the following screens:

Public / Onboarding:

Splash screen

Welcome/Intro screen

User category selection screen

Explorer signup

Investor signup

Vendor signup

Broker signup

Login

Forgot password

Terms acceptance

Privacy notice

Verification:

KYC start

Face verification

ID upload

Nationality/legal name form

KYC progress

KYC approved

KYC rejected

More information needed

Wallet:

Wallet intro

Create wallet

Import wallet

Recovery phrase education

Confirm recovery phrase

Wallet dashboard

Swap

Transaction detail

Security checklist

Explorer:

Explorer dashboard

Education hub

Asset previews

Upgrade role screen

Investor:

Investor dashboard

FarmVest list

FarmVest details

Land unit calculator

Checkout

Payment confirmation

Documents

Portfolio

Asset detail in portfolio

Vendor:

Vendor dashboard

Vendor application

Verification status

Add listing

Listings

Orders

Disputes/refunds

Vendor payments

Broker:

Broker dashboard

Referral tools

Lead tracking

Commission detail

Reward progress

Director approval status

Reward history

Partner:

Partner locked/progress screen

Partner application/review

Partner dashboard after approval

Other modules:

Property Store

Property detail

PriChat list

PriChat room

Meeting room

M&P Consult list

Consultant profile

Booking/payment/refund

Services page

Support

Dispute center

Notifications

Settings

Profile

Security

Legal

Admin:

Admin dashboard

KYC queue

Vendor queue

Consultant certification queue

Dispute/refund queue

Broker reward approval

Partner approval

Document issuance

Audit logs

FINAL REQUIREMENT

Make the first build beautiful, complete, clickable, and realistic with dummy data. It should be mobile-first, responsive, and ready for future backend expansion. Prioritize trust, clarity, onboarding, KYC, wallet safety, FarmVest investment flow, role-based dashboards, and clean premium AgroVest branding.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://agrovest.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/00a3fb8a-68fc-4dd1-befc-198b9e4cfa27).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
