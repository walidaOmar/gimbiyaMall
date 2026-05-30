import { createRemoteJWKSet, jwtVerify } from "jose";

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? "gimbiya-mall";
const FIREBASE_ISSUER = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
const FIREBASE_JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

const firebaseJwks = createRemoteJWKSet(new URL(FIREBASE_JWKS_URL));

export interface FirebaseIdTokenPayload {
  uid: string;
  email: string;
  name?: string;
  emailVerified: boolean;
}

export async function verifyFirebaseIdToken(
  token: string
): Promise<FirebaseIdTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, firebaseJwks, {
      issuer: FIREBASE_ISSUER,
      audience: FIREBASE_PROJECT_ID,
      algorithms: ["RS256"],
    });

    if (!payload || typeof payload !== "object") return null;

    const email = payload.email;
    const uid = payload.sub;
    if (typeof email !== "string" || typeof uid !== "string") {
      return null;
    }

    return {
      uid,
      email,
      name: typeof payload.name === "string" ? payload.name : undefined,
      emailVerified: payload.email_verified === true,
    };
  } catch {
    return null;
  }
}
