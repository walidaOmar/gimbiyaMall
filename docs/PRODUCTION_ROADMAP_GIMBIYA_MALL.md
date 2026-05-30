# Gimbiya Mall Production Branch Roadmap

## Branching Decision
- **Production branch name:** `production`.
- **Created from:** current working branch (demo baseline in this repository).
- **Goal:** stabilize and harden the demo into a live, revenue-generating virtual mall platform.

## What Exists Already (Good Foundation)
The repository already includes several core Phase 1 and Phase 2 primitives:

1. **Role-based workflows and dashboards** in client and server layers (developer/admin/manager/stock manager/delivery/affiliate(b"reader")/buyer).
2. **Central pricing logic** in `server/pricing.ts`, including:
   - `TRANSACTION_FEE_RATE = 0.015` (1.5%),
   - split models for with/without referral.
3. **Monnify helper module** in `server/monnify.ts` for payment init + verification + webhook signature validation.
4. **Order lifecycle support** in `server/routers.ts` and `server/models/Order.ts`, including status transitions and delivery assignment.

## Phase 1 (Foundation): Production-Ready Scope

### 1) Multi-role launch hardening
- [ ] Confirm all 9 dashboards are wired to real APIs (not fallback/mock paths).
- [ ] Enforce route-level role guards on both frontend and backend.
- [ ] Add smoke tests for each role login and one critical action per role.

### 2) Merchant onboarding (Developer-led)
- [ ] Keep manual onboarding in developer dashboard as initial flow.
- [ ] Add merchant onboarding checklist state:
  - profile completed,
  - subscription paid,
  - first category created,
  - first product listed,
  - payment settlement account configured.

### 3) Subscription activation
- [ ] Add subscription plan entity (₦45k/₦75k/₦120k yearly tiers).
- [ ] Link plan state to merchant account `isActive`.
- [ ] Add renewal reminders and grace-period behavior.

### 4) Store-scoped catalog integrity
- [ ] Ensure manager/admin can only mutate categories/products scoped to their store.
- [ ] Add tests that reject cross-store access attempts.
- [ ] Add indexing for product lookup by store + category.

### 5) Seed account management
- [ ] Keep first-run seed accounts but move credentials to environment-secure bootstrap values.
- [ ] Force password reset on first login for seed users.

## Phase 2 (Financial Engine): Production-Ready Scope

### 1) Transaction fee + commission source of truth
- [ ] Keep all fee math in `server/pricing.ts`.
- [ ] Remove duplicate or divergent commission formulas elsewhere.
- [ ] Validate fee totals at order-creation time and before disbursement.

### 2) Monnify payment activation
- [ ] Confirm sandbox vs production keys switch by environment.
- [ ] Ensure payment reference maps to a **single target order**.
- [ ] Lock idempotency for webhook processing to avoid double-marking paid orders.

### 3) Webhook automation
- [ ] Add/verify `/api/webhooks/monnify` route:
  - validate HMAC-SHA512 signature,
  - parse event,
  - resolve order by payment reference,
  - update `paymentStatus: paid` + order status transitions,
  - write immutable audit log.

### 4) Commission ledger and disbursement
- [ ] Create `commissionledger` collection/table with:
  - orderId,
  - actorIds (developer/admin/delivery/affiliate),
  - percentage split snapshot,
  - amount snapshot,
  - status (`pending`, `approved`, `disbursed`, `reversed`),
  - disbursement reference,
  - timestamps.
- [ ] Generate ledger entry exactly once when order becomes `paid`.
- [ ] Trigger disbursement only after successful delivery (or policy-defined milestone).

## End-to-End Production Workflow (Target)
1. Buyer places order -> system computes subtotal + 1.5% platform fee + commission splits.
2. Buyer pays via Monnify checkout link.
3. Monnify webhook validates signature and marks order paid.
4. Admin/Manager assigns delivery rider.
5. Delivery moves from assigned -> in_transit -> delivered.
6. Commission ledger finalizes split according to referral presence:
   - With referral: Affiliate 50%, Developer 20%, Admin 20%, Delivery 10%
   - Without referral: Affiliate 0%, Developer 30%, Admin 60%, Delivery 10%
7. Disbursement engine executes payout and records settlement references.

## Open Questions Required Before Final Production Build

### Buyer Checkout & Fulfilment
1. Do you want **pay-before-processing only**, or allow **cash on delivery** for selected stores?
2. Should delivery fees be fixed, zone-based, or distance-based (GPS)?
3. Can buyers split one cart into multiple store orders automatically at checkout?
4. What is your cancellation/refund policy after payment but before dispatch?

### Payment (Monnify)
5. Which Monnify account mode should go live first: test-only pilot or full production?
6. Should we support partial payments, or strict full payment only?
7. What is the timeout window for unpaid initiated orders (e.g., auto-cancel after 30 minutes)?
8. Who receives payment failure alerts (merchant only, admin only, or both)?

### Delivery Operations
9. Is rider assignment manual only, or should we add auto-assignment rules?
10. What proof of delivery is mandatory: OTP, signature, photo, or all?
11. Can a rider mark delivered without buyer OTP confirmation?
12. How should failed delivery attempts be priced and retried?

### Commission & Disbursement
13. When exactly should commission become withdrawable: payment success, delivery confirmation, or return-window close?
14. Do you want automatic daily disbursement, weekly batch, or manual approval first?
15. For refunded orders, do we reverse all commissions immediately or prorate by fulfillment stage?
16. Should affiliates have a minimum withdrawal threshold (for example ₦5,000)?

### Governance & Compliance
17. What KYC level is required for merchants, riders, and affiliates before payout?
18. Which audit artifacts are mandatory for finance review (webhook logs, payout receipts, settlement CSV)?
19. Who can override commission disputes: Developer only, or Developer + Super Admin?
20. Do you need VAT/tax invoices generated per order for merchants and buyers?

## Recommended Next Delivery Sequence
1. Freeze current demo behavior with regression tests.
2. Implement webhook idempotency and order-bound payment verification.
3. Implement commission ledger write-path and payout state machine.
4. Add delivery proof + dispute handling.
5. Run pilot with limited merchants and one settlement cycle.
6. Go live with production Monnify credentials.
