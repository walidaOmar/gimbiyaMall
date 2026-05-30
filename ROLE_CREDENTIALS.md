# Gimbiya Mall — Role Login Credentials

All staff accounts are **seeded automatically** into MongoDB the first time the
server connects. You do not need to create them manually.

---

## Staff Accounts (use the Staff Portal tab on /auth)

| Role          | Email                       | Password         | Dashboard URL       |
|---------------|----------------------------|------------------|---------------------|
| Developer     | developer@sahadstores.com   | Developer@123456 | /developer          |
| Admin         | admin@sahadstores.com       | Admin@123456     | /admin              |
| Manager       | manager@sahadstores.com     | Manager@123456   | /manager            |
| Stock Manager | stock@sahadstores.com       | Stock@123456     | /stock-manager      |
| Delivery      | delivery@sahadstores.com    | Delivery@123456  | /delivery           |

---

## Buyer Accounts (use the Shop Account tab on /auth)

Buyers **register themselves** at `/auth` → Create Account.

Password requirements:
- Minimum 8 characters
- At least one uppercase letter (A–Z)
- At least one number (0–9)

---

## Affiliate (Reader) Accounts

The **reader** role is granted by an Admin:
1. Admin logs in → /admin/affiliates
2. Finds the buyer by email
3. Clicks **Enable Affiliate**

Once promoted, the buyer logs in via the **Shop Account** tab (same
email + password) and is redirected to `/affiliate`.

---

## 7-Role Hierarchy & Onboarding Authority

```
Developer (Architect)
├── Can onboard: Admin, Manager, Stock Manager, Delivery
│
Admin (Merchant)
├── Can onboard: Stock Manager, Affiliate
│
Manager (Branch)
├── Can onboard: Stock Manager
│
Stock Manager   — inventory read/write only
Delivery        — order status updates only
Affiliate       — referral links & commissions only
Buyer           — self-registers, shops, places orders
```

---

## Role Permissions Matrix

| Feature                    | Developer | Admin | Manager | StockMgr | Delivery | Reader | Buyer |
|----------------------------|:---------:|:-----:|:-------:|:--------:|:--------:|:------:|:-----:|
| Platform analytics         | ✅        | ✅    |         |          |          |        |       |
| Onboard stores/branches    | ✅        |       |         |          |          |        |       |
| Onboard any staff role     | ✅        |       |         |          |          |        |       |
| View all orders            | ✅        | ✅    | ✅      |          |          |        |       |
| Manage products            |           |       | ✅      |          |          |        |       |
| Manage categories          |           | ✅    | ✅      |          |          |        |       |
| Manage users / roles       |           | ✅    |         |          |          |        |       |
| Enable affiliates          |           | ✅    |         |          |          |        |       |
| Onboard stock manager      |           | ✅    | ✅      |          |          |        |       |
| View inventory             |           | ✅    | ✅      | ✅       |          |        |       |
| Adjust stock               |           | ✅    | ✅      | ✅       |          |        |       |
| Request restock            |           |       |         | ✅       |          |        |       |
| View delivery orders       |           |       |         |          | ✅       |        |       |
| Update delivery status     |           |       |         |          | ✅       |        |       |
| Generate referral links    |           |       |         |          |          | ✅     |       |
| View affiliate earnings    |           |       |         |          |          | ✅     |       |
| Place orders / cart        |           |       |         |          |          | ✅     | ✅    |

---

## Auth Architecture

```
/auth  →  Shop Account tab   →  loginBuyer / signupBuyer  (buyer, reader)
/auth  →  Staff Portal tab   →  loginStaff                (developer, admin, manager, stock_manager, delivery)
```

- Passwords are hashed with **bcrypt (12 salt rounds)** — never stored in plain text.
- Sessions use **JWT (HS256)** signed with `JWT_SECRET`, stored in an `httpOnly` cookie.
- Rate limiting: **10 auth attempts per 15 minutes** per IP (brute-force protection).
- No external OAuth dependency — fully self-contained.

---

## Demo Navigator

The floating **Demo Navigator** bar at the bottom of every page lets you
jump between all 8 role views instantly:

```
🏠 Home | 🛍 Products | 🛒 Buyer | 🛡 Admin | 📦 Manager | 🗂 StockMgr | 🚚 Delivery | 🔗 Affiliate | 💻 Developer
```
