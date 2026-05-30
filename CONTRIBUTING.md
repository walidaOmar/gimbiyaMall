# Contributing to Gimbiya Mall

> Read this before writing a single line of code. It exists to prevent the
> most common source of bugs: building frontend before backend is solid,
> and mixing concerns across layers.

---

## The Golden Rule — Backend First, Always

```
Schema → Route → Test → Frontend → Feature Flag
```

Never skip a step. Never go backwards. If your frontend breaks, the bug
is almost always in the backend layer you skipped testing.

---

## Step-by-Step Development Workflow

### Step 1 — Define the data shape (MongoDB model)
Before writing any route, define exactly what data you need.

```typescript
// server/models/YourModel.ts
export interface IYourModel extends Document {
  field: string;
  // ...
}
```

Ask yourself:
- Does this need a new Mongoose model, or extend an existing one?
- What indexes does it need for performance?
- Does any field reference another collection?

### Step 2 — Write the tRPC route

```typescript
// In server/routers.ts, inside the correct sub-router
yourRoute: appropriateProcedure   // NEVER publicProcedure for protected data
  .input(z.object({
    field: z.string().min(1),
    optionalField: z.string().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    // validate business rules here
    // call the DB
    // return typed result
    return { success: true };
  }),
```

**Which procedure to use:**

| Who can call it | Use |
|----------------|-----|
| Anyone | `publicProcedure` |
| Logged-in buyer + reader | `buyerProcedure` |
| Admin only | `adminProcedure` |
| Manager only | `managerProcedure` |
| Stock manager only | `stockManagerProcedure` |
| Manager + stock_manager + admin + developer | `inventoryProcedure` |
| Delivery only | `deliveryProcedure` |
| Affiliate (reader) only | `readerProcedure` |
| All staff, no buyers | `staffProcedure` |
| Developer only | `developerProcedure` |

### Step 3 — Write the Vitest test BEFORE running the code

```typescript
// server/yourfeature.test.ts
import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

describe("yourRoute", () => {
  it("blocks wrong role with FORBIDDEN", async () => {
    const caller = appRouter.createCaller(makeCtx("buyer"));
    await expect(caller.yourRouter.yourRoute({ field: "x" }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("validates input — rejects empty field", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    await expect(caller.yourRouter.yourRoute({ field: "" }))
      .rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("passes correct input for right role", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const p = caller.yourRouter.yourRoute({ field: "valid" });
    // DB will fail (no connection in test) but RBAC + validation passes
    await expect(p).rejects.not.toMatchObject({ code: "FORBIDDEN" });
    await expect(p).rejects.not.toMatchObject({ code: "BAD_REQUEST" });
  });
});
```

Run with: `pnpm test`

### Step 4 — Build the frontend component

Only after the backend route is tested do you touch the frontend.

```typescript
// client/src/pages/<role>/YourPage.tsx
const result = (trpc as any).yourRouter.yourRoute.useMutation({
  onSuccess: () => toast.success("Done!"),
  onError: (e: any) => toast.error(e.message),
});
```

### Step 5 — Gate with a feature flag

```bash
# In .env
FEATURE_YOUR_FEATURE=false
```

```typescript
// In server/routers.ts
if (process.env.FEATURE_YOUR_FEATURE !== "true") {
  throw new TRPCError({ code: "NOT_FOUND", message: "Feature not enabled" });
}
```

---

## Fee Calculations — ALWAYS Use pricing.ts

```typescript
// ✅ CORRECT — import from single source of truth
import { calcFinalPrice, calcTransactionFee, calcCommissionSplit } from './pricing';

// ❌ WRONG — never calculate fees inline
const fee = amount * 0.015;  // duplicates logic, causes drift
```

---

## Branch Protection Rules

```
main (DOME)      → FROZEN. No merges. Reference only.
GIMBIYA MALL     → Your working branch. All features go here first.
production       → Merge from GIMBIYA MALL only after: pnpm test passes + pnpm build:full passes
deployment       → Merge from production only after: smoke test on staging passes
```

**Never push directly to `production` or `deployment`.**
Always open a Pull Request and use the PR checklist.

---

## Common Bug Patterns and How to Avoid Them

### Bug: "Works in demo but breaks with real data"
**Cause:** Frontend was built using mock data that doesn't match the real API shape.
**Fix:** Always check that your tRPC route's return type matches what the frontend expects.
Build the route first, check its output, then build the UI.

### Bug: "Route works for one role but breaks for another"
**Cause:** Wrong RBAC procedure, or business logic doesn't check ownership.
**Fix:** Write a test for every role — both allowed and blocked. Check `ctx.user._id === resource.ownerId` for ownership-sensitive operations.

### Bug: "Commission calculated differently in two places"
**Cause:** Fee logic duplicated across files.
**Fix:** All fee math lives in `server/pricing.ts`. Import from there everywhere. Zero exceptions.

### Bug: "TypeScript passes but runtime crashes"
**Cause:** Using `as any` too liberally or skipping Zod validation.
**Fix:** Validate all inputs with Zod. Only use `as any` for `ctx.user` casting, and comment why.

### Bug: "Works locally but fails in production"
**Cause:** Missing environment variable, wrong `NODE_ENV`, or MongoDB connection not established.
**Fix:** Check `.env.example` — every key there must exist in Railway. Run `pnpm build:full` locally before promoting a branch.

### Bug: "Pushing to wrong branch"
**Cause:** Working directly on `production` or `deployment`.
**Fix:** Always verify your current branch before pushing: `git branch`. Set up branch protection rules on GitHub.

---

## Copilot Tips — Getting the Best Suggestions

1. **Always have the right file open in context.** If you're adding a tRPC route, have `server/routers.ts` and `server/rbac.ts` open.

2. **Write the comment first, then let Copilot suggest.** Example:
   ```typescript
   // adjustStock: stock_manager only, validates productId and quantityChange,
   // prevents stock below zero, logs to console for Phase 2 inventory log
   adjustStock: stockManagerProcedure
   // → now accept Copilot's suggestion
   ```

3. **Reject suggestions that use publicProcedure for financial routes.** Copilot doesn't know your RBAC rules — you do.

4. **Use Copilot Chat to explain the Giorno model** before asking it to generate code for a new revenue layer. Paste the relevant section of `.github/copilot-instructions.md` as context.

5. **Never accept Copilot's suggested fee calculations inline.** Always redirect to `pricing.ts`.

---

## Testing Commands

```bash
pnpm test              # run all tests
pnpm test -- --watch   # watch mode during development
pnpm check             # TypeScript type check (no compilation)
pnpm build:full        # full production build check
pnpm dev:ui            # frontend only (demo mode, no MongoDB needed)
pnpm dev               # full stack (needs .env with MONGODB_URI)
```

---

## Phase Roadmap (Do Not Skip Phases)

| Phase | What | Revenue Layer |
|-------|------|--------------|
| 1 (NOW) | Live platform, all 9 dashboards, demo complete | Merchant subscriptions |
| 2 | Transaction fee (1.5%) + Monnify revenue share | Layers 2 + 3 |
| 3 | Supplier marketplace tab (3–5 wholesalers) | Layer 4 |
| 4 | BNPL at checkout (CredPal/Carbon) + merchant capital | Layers 6A + 6B |
| 5 | GIG / Kwik Delivery integration | Layer 5 |
| 6 | Promoted listings + market intelligence reports | Layers 7 + 8 |
| 7 | Brand affiliate campaigns + anonymised data subscriptions | Layer 9 |

**Do not start Phase 2 until Phase 1 is running live with real merchants.**
Each phase activates a feature flag — no code changes needed to enable.
