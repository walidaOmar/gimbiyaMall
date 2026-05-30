# Implementation Spec — Demo to Production (Approved Answers)

_Last updated: 2026-04-25_

## 1) Buyer Order Completion
- Payment model: **Pay-before-processing** only.
- Delivery fee mode: **Distance-based (GPS)**.
- Cart behavior: **Split cart by store is enabled**.
- Cancellation rule: if order is already `processing`, cancellation requires **special approval**.

## 2) Payment Completion
- Monnify launch mode: **Test-only pilot** first.
- Partial payment: **Enabled**.
- Timeout for unpaid orders: **1000 seconds**.
- Payment failure alert recipient: **Developer**.

## 3) Delivery Confirmation
- Rider assignment: **Both automatic and manual** by **Developer/Admin**.
- Auto-assignment strategy: prioritize **top responsive + fastest delivery riders**.
- Mandatory proof of delivery: **OTP + Photo**.
- Rider can mark delivered without OTP: **No**.
- Failed delivery attempt charging policy: **Direct costs**.

## 4) Commission & Disbursement
- Commission becomes withdrawable at: **Delivery confirmation**.
- Disbursement mode: **Manual approval first**.
- Refund behavior: **Prorate by fulfillment stage**.
- Affiliate minimum withdrawal threshold: **Enabled** (exact threshold to be configured).

## 5) Governance & Compliance
- KYC requirements: **NIN, Residential Address, BVN, Emergency Contact, CAC, Utility/NEPA bill**.
- Mandatory audit artifacts: **Webhook logs + payout receipts**.
- Commission override authority: **Developer + Super Admin**.
- VAT/Tax invoice generation: **Required**.

## Implemented in this change set
1. Added `server/productionConfig.ts` to centralize approved production policy decisions.
2. Added `server/deliverySequence.ts` for next-step delivery workflow enforcement:
   - 1000-second unpaid timeout checks,
   - cancellation approval logic,
   - distance-fee calculation,
   - delivery status transition validation,
   - proof-of-delivery (OTP + photo) enforcement,
   - rider auto-selection by responsiveness and speed.
3. Added `server/deliverySequence.test.ts` with coverage for the above policy rules.

## Local Startup Command
- Start the development server with: `pnpm run dev`
- Frontend-only mode (if needed): `pnpm run dev:ui`
