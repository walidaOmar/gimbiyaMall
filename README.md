# 🛍 Gimbiya Mall

> **The infrastructure layer of Nigerian e-commerce.**  
> Built on the Giorno Model — the platform sits between every entity and earns a small fee at each money-flow point.

---

## What Is Gimbiya Mall?

Gimbiya Mall gives Nigerian merchants the same operating system Jumia uses — but the merchant keeps their customers, owns their data, and the platform earns a small, fair fee from every entity in the ecosystem, every time they sit at the table.

**9 Revenue Layers. 7 Roles. One platform.**

---

## Quick Start

### Option A — Frontend Demo (No setup needed)
```bash
git clone https://github.com/your-org/RanoPalaza-Gimbiya-Mall.git
cd RanoPalaza-Gimbiya-Mall
pnpm install
pnpm run dev:ui
```
Open **http://localhost:5173** — use the floating Demo Navigator to explore all 9 role dashboards.

### Option B — Full Stack (MongoDB required)
```bash
cp .env.example .env     # fill in MONGODB_URI and JWT_SECRET
pnpm install
pnpm run dev
```

---

## Node + pnpm troubleshooting
If you see errors like `Cannot find module './tailwindcss-oxide.linux-x64-gnu.node'`, the issue is usually a Node version mismatch or disabled optional dependencies.

Run these exact commands:
```bash
nvm install 22
nvm use 22
pnpm config set optional true
rm -rf node_modules
pnpm install --force
pnpm run dev
```

If the error persists, send the output of:
```bash
node -v
pnpm -v
pnpm config get optional
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 5 + Tailwind v4 + shadcn/ui |
| Backend | Express.js + tRPC v11 |
| Database | MongoDB / Mongoose |
| Auth | JWT + bcrypt (12 rounds) + HTTPOnly cookies |
| Payments | Monnify (Nigerian gateway) |
| Tests | Vitest |
| Deployment | Railway / Render / Docker |

---

## The 7-Role Hierarchy

```
Developer (Architect)
├── Onboards: Admin, Store, Branch, Manager, Stock Manager, Affiliate, Delivery
│
Admin (Merchant)
├── Onboards: Stock Manager, Affiliate
│
Manager (Branch)
├── Onboards: Stock Manager
│
Stock Manager   — inventory read/write
Delivery        — order status only
Affiliate       — referral links + commissions
Buyer           — self-registers, shops
```

---

## Demo Credentials

| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| Developer | developer@sahadstores.com | Developer@123456 | /developer |
| Admin | admin@sahadstores.com | Admin@123456 | /admin |
| Manager | manager@sahadstores.com | Manager@123456 | /manager |
| Stock Manager | stock@sahadstores.com | Stock@123456 | /stock-manager |
| Delivery | delivery@sahadstores.com | Delivery@123456 | /delivery |
| Buyer | register at /auth | your password | /buyer |

---

## Revenue Architecture

| # | Layer | Rate | Who Pays |
|---|-------|------|---------|
| 1 | Platform Subscription | ₦45k–₦120k/yr | Merchant |
| 2 | Transaction Fee | 1.5% per order | Platform cut |
| 3 | Payment Revenue Share | 0.2–0.5% | Payment partner |
| 4 | Supply Chain Referrals | 3–5% | Wholesaler |
| 5 | Logistics Referrals | 3–5% | Courier |
| 6A | Buyer BNPL Referral | 1–2% | Fintech |
| 6B | Merchant Capital Fee | 1–3% | Fintech |
| 7 | Promoted Listings | ₦5k–₦20k/week | Merchant |
| 8 | Market Intelligence | Subscription | Brands/Investors |
| 9 | Affiliate Network | % of campaign | Brands |

---

## Branch Strategy

```
main (DOME)     → frozen prototype
GIMBIYA MALL    → active development ← you are here
production      → merchant-ready (PR-gated)
deployment      → live on Railway (tagged releases)
```

---

## Running Tests

```bash
pnpm test
```

Tests: pricing calculations, RBAC enforcement, stock manager routes, auth.

---

## Development Guide

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full workflow, common bug patterns, and Copilot tips.

---

## Phase Roadmap

- **Phase 1 (Now):** Live platform — all 9 dashboards, demo complete
- **Phase 2:** 1.5% transaction fee + Monnify revenue share
- **Phase 3:** Supplier marketplace (3–5 wholesalers)
- **Phase 4:** BNPL at checkout (CredPal/Carbon) + merchant capital
- **Phase 5:** GIG/Kwik Delivery integration
- **Phase 6:** Promoted listings + market intelligence
- **Phase 7:** Brand affiliate campaigns + data subscriptions

---

## Open in Codespaces

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/your-org/RanoPalaza-Gimbiya-Mall)

> The devcontainer installs pnpm, all extensions, and runs `pnpm install` automatically.  
> Just open the Codespace and run `pnpm run dev:ui`.

---

*© 2026 Gimbiya Mall. Built with the Giorno Infrastructure Model.*
