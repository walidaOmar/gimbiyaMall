import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { User, type IUser } from "../models/User";
import { getSessionToken, verifySessionToken } from "./auth";
import { verifyFirebaseIdToken } from "./firebaseAuth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: IUser | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: IUser | null = null;

  try {
    const token = getSessionToken(opts.req);
    const session = await verifySessionToken(token);

    if (session?.userId) {
      user = await User.findById(session.userId).exec();
      if (user) {
        // Touch lastSignedIn in background
        User.findByIdAndUpdate(session.userId, { lastSignedIn: new Date() }).exec();
      }
    }

    if (!user) {
      const authHeader = Array.isArray(opts.req.headers.authorization)
        ? opts.req.headers.authorization[0]
        : opts.req.headers.authorization;
      const bearerToken =
        typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer ")
          ? authHeader.slice(7).trim()
          : undefined;

      if (bearerToken) {
        const firebasePayload = await verifyFirebaseIdToken(bearerToken);
        if (firebasePayload?.email) {
          user = await User.findOne({
            email: firebasePayload.email.toLowerCase().trim(),
          }).exec();
          if (user) {
            User.findByIdAndUpdate(user._id, { lastSignedIn: new Date() }).exec();
          }
        }
      }
    }
  } catch {
    user = null;
  }

  return { req: opts.req, res: opts.res, user };
}
