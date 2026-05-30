/**
 * Auth tRPC router
 *
 * ── Role Login Details ───────────────────────────────────────────────────────
 *
 *  Role          │ Email                       │ Password         │ Tab
 * ─────────────────────────────────────────────────────────────────────────────
 *  developer     │ developer@sahadstores.com   │ Developer@123456 │ Staff Portal
 *  admin         │ admin@sahadstores.com        │ Admin@123456     │ Staff Portal
 *  manager       │ manager@sahadstores.com      │ Manager@123456   │ Staff Portal
 *  stock_manager │ stock@sahadstores.com        │ Stock@123456     │ Staff Portal
 *  delivery      │ delivery@sahadstores.com     │ Delivery@123456  │ Staff Portal
 *  buyer         │ (self-registered)            │ (own password)   │ Sign In tab
 *  reader        │ (promoted from buyer)        │ (own password)   │ Sign In tab
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Staff accounts are seeded into MongoDB at server startup (server/mongodb.ts).
 * Buyers register themselves. Admin can promote a buyer to "reader" (affiliate).
 *
 * FIXES in this version:
 * 1. loginStaff now includes "stock_manager" in allowed staff roles
 * 2. logout is a mutation (not query) — properly clears the httpOnly cookie
 * 3. auth.me returns full user object (name, email, role, isAffiliate, etc.)
 *    so the frontend AuthContext always gets a complete user after refetch
 */

import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { User } from "./models/User";
import { verifyFirebaseIdToken } from "./_core/firebaseAuth";
import {
  createSessionToken,
  getSessionCookieOptions,
  COOKIE_NAME,
} from "./_core/auth";

// ── Password policy ──────────────────────────────────────────────────────────
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

// ─────────────────────────────────────────────────────────────────────────────

export const authRouter = router({
  /**
   * auth.me
   * Returns the currently authenticated user (password hash excluded).
   * Frontend calls this on every page load to check session state.
   * Returns null when not logged in.
   *
   * FIX: Returns the FULL user document so AuthContext always has
   * name, email, role, isAffiliate, _id — not just the mutation response.
   */
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return null;

    // Return safe user object (passwordHash is select:false, so not included)
    return {
      _id:          ctx.user._id.toString(),
      name:         ctx.user.name,
      email:        ctx.user.email,
      role:         ctx.user.role,
      phone:        ctx.user.phone ?? null,
      profileImage: ctx.user.profileImage ?? null,
      address:      ctx.user.address ?? null,
      city:         ctx.user.city ?? null,
      state:        ctx.user.state ?? null,
      country:      ctx.user.country ?? "Nigeria",
      isActive:     ctx.user.isActive,
      isAffiliate:  ctx.user.isAffiliate,
      createdAt:    ctx.user.createdAt?.toISOString() ?? null,
      updatedAt:    ctx.user.updatedAt?.toISOString() ?? null,
    };
  }),

  /**
   * auth.logout
   * Clears the session cookie, logging the user out.
   * FIX: Changed from publicProcedure.query to .mutation so React Query
   * invalidation and cache clearing works properly.
   */
  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie(COOKIE_NAME, { path: "/" });
    return { success: true } as const;
  }),

  /**
   * auth.signupBuyer
   * Open to anyone — all sign-ups are assigned the "buyer" role.
   * Password hashed with bcrypt (12 salt rounds) before saving.
   * Auto-logs in after successful registration by setting the JWT cookie.
   *
   * Validation rules:
   *   - name        ≥ 2 chars
   *   - email       valid format, must be unique
   *   - password    ≥ 8 chars, 1 uppercase, 1 number
   *   - confirmPassword must match password
   */
  signupBuyer: publicProcedure
    .input(
      z.object({
        name:            z.string().min(2, "Name must be at least 2 characters"),
        email:           z.string().email("Invalid email address"),
        phone:           z.string().optional(),
        password:        passwordSchema,
        confirmPassword: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Validate password match
      if (input.password !== input.confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      // Check for duplicate email
      const existing = await User.findOne({
        email: input.email.toLowerCase().trim(),
      });
      if (existing) {
        throw new Error("Email already registered. Please sign in instead.");
      }

      // Hash password
      const salt         = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(input.password, salt);

      // Create user
      const user = await User.create({
        name:         input.name.trim(),
        email:        input.email.toLowerCase().trim(),
        passwordHash,
        phone:        input.phone?.trim() || undefined,
        role:         "buyer",
        isActive:     true,
        isAffiliate:  false,
      });

      // Auto-login: set JWT cookie so auth.me refetch works immediately
      const token = await createSessionToken(user);
      ctx.res.cookie(COOKIE_NAME, token, getSessionCookieOptions(ctx.req));

      return {
        success: true,
        message: "Account created successfully! Welcome to Gimbiya Mall.",
        role:    "buyer",
      };
    }),

  /**
   * auth.loginBuyer
   * For customers (buyer) and affiliates (reader) only.
   * Uses generic error message to prevent email enumeration.
   * Staff accounts are rejected here — they must use loginStaff.
   */
  loginBuyer: publicProcedure
    .input(
      z.object({
        email:    z.string().email("Invalid email address"),
        password: z.string().min(1, "Password is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Fetch with passwordHash explicitly (select:false in schema)
      const user = await User.findOne({
        email: input.email.toLowerCase().trim(),
      }).select("+passwordHash");

      // Generic error — do NOT reveal whether the email exists
      if (!user) throw new Error("Invalid email or password.");

      if (!user.isActive) {
        throw new Error(
          "Your account has been deactivated. Please contact support."
        );
      }

      // Reject staff from buyer portal
      const buyerRoles = ["buyer", "reader"];
      if (!buyerRoles.includes(user.role)) {
        throw new Error("Staff accounts must use the Staff Portal login.");
      }

      const isValid = await user.comparePassword(input.password);
      if (!isValid) throw new Error("Invalid email or password.");

      // Update last sign-in in background
      User.findByIdAndUpdate(user._id, { lastSignedIn: new Date() }).exec();

      // Set JWT cookie
      const token = await createSessionToken(user);
      ctx.res.cookie(COOKIE_NAME, token, getSessionCookieOptions(ctx.req));

      return {
        success: true,
        message: "Welcome back!",
        role:    user.role,
      };
    }),

  /**
   * auth.firebaseLogin
   * Verifies a Firebase ID token and signs the user in on the backend.
   * If the user does not exist yet, a new buyer record is created.
   */
  firebaseLogin: publicProcedure
    .input(
      z.object({ idToken: z.string().min(1, "Firebase ID token is required") })
    )
    .mutation(async ({ input, ctx }) => {
      const firebasePayload = await verifyFirebaseIdToken(input.idToken);
      if (!firebasePayload?.email) {
        throw new Error("Invalid Firebase token.");
      }

      const email = firebasePayload.email.toLowerCase().trim();
      let user = await User.findOne({ email }).select("+passwordHash");

      if (!user) {
        const randomPassword = crypto.randomBytes(32).toString("hex");
        const passwordHash = await bcrypt.hash(randomPassword, 12);

        user = await User.create({
          name:         firebasePayload.name?.trim() || email.split("@")[0],
          email,
          passwordHash,
          role:         "buyer",
          isActive:     true,
          isAffiliate:  false,
        });
      }

      if (!user.isActive) {
        throw new Error("Your account has been deactivated. Please contact support.");
      }

      const token = await createSessionToken(user);
      ctx.res.cookie(COOKIE_NAME, token, getSessionCookieOptions(ctx.req));

      return {
        success: true,
        message: "Signed in with Firebase successfully.",
        role:    user.role,
      };
    }),

  /**
   * auth.loginStaff
   * For admin, manager, stock_manager, delivery, and developer roles.
   * Staff accounts are seeded into MongoDB at startup via mongodb.ts.
   * Buyer/reader accounts are rejected — they use loginBuyer.
   *
   * FIX: Added "stock_manager" to staffRoles array.
   */
  loginStaff: publicProcedure
    .input(
      z.object({
        email:    z.string().email("Invalid email address"),
        password: z.string().min(1, "Password is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await User.findOne({
        email: input.email.toLowerCase().trim(),
      }).select("+passwordHash");

      if (!user) throw new Error("Invalid email or password.");

      if (!user.isActive) {
        throw new Error(
          "Account deactivated. Please contact the administrator."
        );
      }

      // FIX: now includes "stock_manager"
      const staffRoles = ["admin", "manager", "stock_manager", "delivery", "developer"];
      if (!staffRoles.includes(user.role)) {
        throw new Error("Buyer accounts must use the Shop Account login.");
      }

      const isValid = await user.comparePassword(input.password);
      if (!isValid) throw new Error("Invalid email or password.");

      // Update last sign-in in background
      User.findByIdAndUpdate(user._id, { lastSignedIn: new Date() }).exec();

      // Set JWT cookie
      const token = await createSessionToken(user);
      ctx.res.cookie(COOKIE_NAME, token, getSessionCookieOptions(ctx.req));

      return {
        success: true,
        message: `Logged in as ${user.role}`,
        role:    user.role,
      };
    }),
});
