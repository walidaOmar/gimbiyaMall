# Gimbiya Mall — Startup Guide

## Quick Start — Two Options

---

### Option A: Frontend Only (Demo — No Server Needed)

The fastest way to see the full platform. No MongoDB, no backend required.

```bash
# 1. Enter project root
cd RanoPalaza-Gimbiya-Mall

# 2. Install dependencies
pnpm install

# 3. Start Vite frontend only
pnpm run dev:ui
```

Open **http://localhost:5173**

Every page is open. Use the **Demo Navigator bar** at the bottom to jump between all 9 role dashboards.

---

### Option B: Full Stack (Frontend + Backend + MongoDB)

```bash
# 1. Copy environment file
cp .env.example .env       # then fill in MONGODB_URI and JWT_SECRET

# 2. Install dependencies
pnpm install

# 3. Start full stack (frontend + backend)
pnpm dev
```

Open **http://localhost:5173** (frontend) and **http://localhost:3000** (API).

Staff accounts are seeded automatically on first connection to MongoDB.

---

## Environment Variables (.env)

```env
# Required for backend
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net
MONGODB_DB_NAME=gimbiya_mall
JWT_SECRET=<64-char random hex — generate with: openssl rand -hex 32>

# Required for payments (Phase 2)
MONNIFY_API_KEY=
MONNIFY_SECRET_KEY=
MONNIFY_CONTRACT_CODE=

# Required for referral links
VITE_APP_URL=http://localhost:5173

# Production only
NODE_ENV=production

# Feature flags (enable per phase)
FEATURE_TRANSACTION_FEE=false
```

---

## 9-Role Demo Credentials

| Role          | Email                       | Password         | Dashboard          |
|---------------|----------------------------|------------------|--------------------|
| Developer     | developer@sahadstores.com   | Developer@123456 | /developer         |
| Admin         | admin@sahadstores.com       | Admin@123456     | /admin             |
| Manager       | manager@sahadstores.com     | Manager@123456   | /manager           |
| Stock Manager | stock@sahadstores.com       | Stock@123456     | /stock-manager     |
| Delivery      | delivery@sahadstores.com    | Delivery@123456  | /delivery          |
| Buyer         | (self-register at /auth)    | own password     | /buyer             |
| Reader        | (promoted from buyer)       | own password     | /affiliate         |

---

## Demo Navigator Bar

A floating bar at the bottom of every page lets you jump between all role dashboards instantly:

```
🏠 Home | 🛍 Products | 🛒 Buyer | 🛡 Admin | 📦 Manager | 🗂 StockMgr | 🚚 Delivery | 🔗 Affiliate | 💻 Developer
```

---

## Git Branch Strategy

```
main (DOME)         → frozen prototype — do not touch
GIMBIYA MALL        → active development (this branch)
production          → next: create after DEMO checklist passes
deployment          → next: create after production smoke test
```

Promotion command sequence:
```bash
# Step 1: All tests green
pnpm test

# Step 2: Clean build
pnpm build:full

# Step 3: Promote to production
git checkout -b production
git merge GIMBIYA-MALL

# Step 4: After staging smoke test
git checkout -b deployment
git merge production
git tag v1.0.0-demo
```

---

## Running Tests

```bash
pnpm test
```

Test files:
- `server/pricing.test.ts` — fee calculation logic (30+ tests)
- `server/rbac.test.ts` — all 7 role procedures (allow + block)
- `server/stockmanager.test.ts` — stock manager routes + input validation
- `server/commission.test.ts` — existing commission module
- `server/auth.logout.test.ts` — session cookie clearing
