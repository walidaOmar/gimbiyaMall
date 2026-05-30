# Gimbiya Mall — Authentication System Guide
## MERN Stack · MongoDB · JWT · bcrypt · Rate Limiting

---

## Overview

The authentication system has been fully rebuilt as a proper MERN stack
implementation. All Manus OAuth dependencies have been removed. The system
now uses:

- **MongoDB + Mongoose** for data storage (replaces MySQL/Drizzle)
- **bcryptjs** for password hashing (salt rounds: 12)
- **jose** for JWT signing/verification (HS256 algorithm)
- **HTTP-only cookies** for session management
- **In-memory rate limiting** (upgradeable to Upstash Redis)

---

## Role Login Credentials

### Staff Roles (Staff Portal tab)

These accounts are seeded automatically when the server starts.

| Role      | Email                      | Password         | Dashboard URL   |
|-----------|----------------------------|------------------|-----------------|
| Admin     | admin@gimbiyamall.com      | Admin@Gimbiya26     | /admin          |
| Manager   | manager@gimbiyamall.com    | Manager@Gimbiya26   | /manager        |
| Delivery  | delivery@gimbiyamall.com   | Delivery@Gimbiya26  | /delivery       |
| Developer | developer@gimbiyamall.com  | Dev@Gimbiya26 | /developer      |

### Buyer / Affiliate Roles (Shop Account tab)

Buyers register themselves via the signup form. Once registered, an admin
can promote a buyer to "reader" (affiliate) role from the admin dashboard.

| Role    | How to get access        | Dashboard URL |
|---------|--------------------------|---------------|
| Buyer   | Self-register via /auth  | /products     |
| Reader  | Admin enables affiliate  | /affiliate    |

---

## Architecture

```
client/src/pages/Auth.tsx          ← Login/Signup UI (3 modes)
server/auth.ts                     ← tRPC auth router (me, logout, signupBuyer, loginBuyer, loginStaff)
server/models/User.ts              ← Mongoose User schema + comparePassword method
server/mongodb.ts                  ← DB connection + staff seeding
server/_core/auth.ts               ← JWT helpers (createSessionToken, verifySessionToken)
server/_core/context.ts            ← tRPC context (reads cookie → finds user in MongoDB)
server/_core/rateLimit.ts          ← Rate limiting middleware
```

---

## How Authentication Works

### Sign Up (New Buyer)

1. User fills name, email, phone (optional), password, confirm password
2. Frontend calls `trpc.auth.signupBuyer.mutate()`
3. Server validates input with Zod (password: 8+ chars, 1 uppercase, 1 number)
4. Checks MongoDB for duplicate email — throws if found
5. Creates User document; Mongoose pre-save hook bcrypt-hashes the password
6. Signs a JWT containing `{ userId, email, role, name }`
7. Sets JWT as an httpOnly cookie (`gimbiya_session`)
8. Returns `{ success, message, role: "buyer" }`
9. Frontend redirects to `/products`

### Log In (Buyer)

1. User enters email + password
2. Frontend calls `trpc.auth.loginBuyer.mutate()`
3. Server finds user by email — returns generic "Invalid email or password"
   if not found (prevents email enumeration)
4. Checks `user.role` is `buyer` or `reader` — staff must use Staff Portal
5. Calls `user.comparePassword(input.password)` — bcrypt.compare under the hood
6. On success: sign JWT, set cookie, return role
7. Frontend redirects based on role

### Log In (Staff)

1. Staff member clicks a role card or types email + password in Staff Portal
2. Frontend calls `trpc.auth.loginStaff.mutate()`
3. Server finds user by email, verifies role is a staff role
4. Compares bcrypt hash, issues JWT + cookie
5. Returns role, frontend redirects to role-specific dashboard

### Session Verification (Every Request)

1. `createContext()` runs on every tRPC request
2. Reads `gimbiya_session` cookie from request headers
3. Calls `verifySessionToken()` — jose.jwtVerify with HS256
4. Looks up user in MongoDB by `userId` from JWT payload
5. Attaches user to `ctx.user` (or null for unauthenticated)
6. tRPC procedures use `protectedProcedure`, `adminProcedure`, etc. to guard routes

### Logout

1. Frontend calls `trpc.auth.logout.mutate()`
2. Server calls `res.clearCookie("gimbiya_session")`
3. Frontend redirects to `/auth`

---

## Password Security

```
Hashing algorithm: bcrypt
Salt rounds: 12  (takes ~300ms — balances security vs. UX)
Storage: passwordHash field in MongoDB (never returned in API responses)
```

Password rules enforced by Zod (signup):
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number

---

## Rate Limiting

The auth endpoints are protected by IP-based rate limiting:

| Limiter       | Endpoint             | Limit              |
|---------------|----------------------|--------------------|
| Auth limiter  | /api/trpc/auth/*     | 10 requests / 15 min |
| API limiter   | /api/trpc/*          | 200 requests / min   |

After the limit is exceeded, the server returns:
```json
HTTP 429
{ "error": "Too many requests. Please slow down and try again.", "retryAfterSeconds": 847 }
```

### Upgrading to Upstash Redis (Production)

The in-memory store works for single-instance deployments. For production
multi-instance deployments, replace the store in `server/_core/rateLimit.ts`:

```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
// server/_core/rateLimit.ts (production version)
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv(); // needs UPSTASH_REDIS_REST_URL + TOKEN in .env

export const authRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "15 m"),
  prefix: "sahad:auth",
});

// Usage in Express middleware:
// const { success, reset } = await authRateLimiter.limit(clientIp);
// if (!success) res.status(429).json({ error: "Too many requests" });
```

---

## MongoDB Setup

### Option A: MongoDB Atlas (Cloud — Recommended)

1. Go to https://cloud.mongodb.com — create a free account
2. Create a new project → Build a Cluster → Free Tier (M0)
3. Choose a region (e.g. AWS Frankfurt or Google Iowa)
4. Under **Database Access**: Add a new DB user with password authentication
5. Under **Network Access**: Add IP `0.0.0.0/0` (allow all) or your server IP
6. Click **Connect** → **Connect your application** → copy the connection string
7. Replace `<password>` with your DB user password in the string
8. Paste into `.env` as `MONGODB_URI`

### Option B: Local MongoDB

```bash
# Install MongoDB Community Edition
# macOS:
brew tap mongodb/brew && brew install mongodb-community

# Ubuntu:
sudo apt install mongodb

# Start:
brew services start mongodb-community   # macOS
sudo systemctl start mongod             # Ubuntu

# .env:
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DB_NAME=gimbiya_mall
```

---

## Required npm Packages

The following packages need to be installed (if not already present):

```bash
pnpm add mongoose bcryptjs
pnpm add -D @types/bcryptjs @types/mongoose
```

Remove MySQL/Drizzle packages once migration is complete:
```bash
pnpm remove mysql2 drizzle-orm drizzle-kit
```

---

## JWT Configuration

```
Algorithm: HS256
Expiry: 1 year (configurable via options.expiresInMs)
Cookie name: gimbiya_session
Cookie flags: httpOnly=true, secure=true (prod), sameSite=strict (prod)
```

Generate a strong `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Security Best Practices Implemented

1. **Passwords are never stored in plaintext** — bcrypt hashes stored only
2. **JWT stored in httpOnly cookie** — not accessible via JavaScript (XSS protection)
3. **Generic error messages** — "Invalid email or password" regardless of which is wrong (prevents enumeration)
4. **Role separation** — buyers cannot use staff portal; staff cannot use buyer portal
5. **Input validation** — Zod schemas enforce format on every API input
6. **Rate limiting** — prevents brute force on auth endpoints
7. **HTTPS in production** — `secure: true` on cookies when `NODE_ENV=production`
8. **`passwordHash` field excluded by default** — Mongoose `select: false` means password never leaks into API responses
9. **Seeded accounts use the same hashing** — bcrypt.genSalt(12) + hash, not plaintext seeds

---

## tRPC Auth Endpoints Reference

| Endpoint              | Type     | Input                                           | Returns                              |
|-----------------------|----------|-------------------------------------------------|--------------------------------------|
| `auth.me`             | query    | (none)                                          | User object or null                  |
| `auth.logout`         | mutation | (none)                                          | `{ success: true }`                  |
| `auth.signupBuyer`    | mutation | name, email, phone?, password, confirmPassword  | `{ success, message, role }`         |
| `auth.loginBuyer`     | mutation | email, password                                 | `{ success, message, role }`         |
| `auth.loginStaff`     | mutation | email, password                                 | `{ success, message, role }`         |

---

## Future Recommendations

1. **Email verification** — Send a confirmation email on signup using Nodemailer
   or Resend (https://resend.com). Block login until email is verified.

2. **Forgot password flow** — Generate a time-limited reset token (nanoid),
   store hashed in MongoDB, email the plain token, accept via a reset form.

3. **Refresh tokens** — Issue short-lived access tokens (15 min) + long-lived
   refresh tokens (30 days) for better security posture.

4. **Google Sign-In** — Use `passport-google-oauth20` for buyers. Already
   referenced in the TODO for admin/manager onboarding.

5. **Two-factor authentication (2FA)** — Use `speakeasy` or `otplib` for TOTP
   (Google Authenticator). Enforce for admin/developer roles.

6. **Account lockout** — After N failed login attempts, lock the account for
   X minutes. Store `failedAttempts` and `lockedUntil` on the User model.

7. **Audit log** — Log every auth event (login, logout, signup, failed attempt)
   to a separate MongoDB `authLogs` collection with IP, user-agent, timestamp.

8. **Session revocation** — Store a `sessionVersion` counter on the user; embed
   it in the JWT. Increment on password change to invalidate all active sessions.
