/**
 * JWT session helpers — pure self-contained auth, no external OAuth.
 */

import { SignJWT, jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import type { IUser } from "../models/User";

export const COOKIE_NAME = "gimbiya_session";
const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

/** Signs a JWT session token for a given user. */
export async function createSessionToken(
  user: Pick<IUser, "_id" | "email" | "role" | "name">,
  options: { expiresInMs?: number } = {}
): Promise<string> {
  const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
  const expirationSeconds = Math.floor((Date.now() + expiresInMs) / 1000);

  return new SignJWT({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(expirationSeconds)
    .sign(getSecretKey());
}

/** Verifies a JWT and returns its payload, or null if invalid/expired. */
export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ["HS256"] });
    const { userId, email, role, name } = payload as Record<string, unknown>;
    if (
      typeof userId !== "string" ||
      typeof email !== "string" ||
      typeof role !== "string" ||
      typeof name !== "string"
    ) return null;
    return { userId, email, role, name };
  } catch {
    return null;
  }
}

/** Extracts the session cookie value from a request. */
export function getSessionToken(req: Request): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;
  return parseCookieHeader(cookieHeader)[COOKIE_NAME];
}

/** Consistent cookie options for Set-Cookie. */
export function getSessionCookieOptions(req: Request) {
  const isProduction = process.env.NODE_ENV === "production";
  const isSecure = isProduction || req.protocol === "https" || req.headers["x-forwarded-proto"] === "https";

  // For cross-origin deployments (Netlify frontend + Railway backend) we must
  // set SameSite='none' and secure=true so the browser will accept and send
  // the session cookie across origins. In non-secure dev, fall back to 'lax'.
  const sameSite: "none" | "lax" = isSecure ? "none" : "lax";

  return {
    httpOnly: true,
    secure: isSecure,
    sameSite,
    maxAge: ONE_YEAR_MS,
    path: "/",
  };
}
