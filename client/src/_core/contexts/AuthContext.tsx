/**
 * AuthContext.tsx — Production-grade auth state
 *
 * HOW IT WORKS:
 * 1. On app load, calls auth.me via tRPC to check the server JWT cookie
 * 2. If the cookie is valid, the server returns the full user object
 * 3. User state lives in React memory — NOT localStorage
 * 4. On login/signup, auth.me is re-fetched (the server set the cookie)
 * 5. On logout, the server clears the cookie and user state is set to null
 *
 * WHY THIS FIXES THE BUG:
 * The old version stored user in localStorage from login response, but the
 * login response only returned { success, role, message } — not a full user.
 * This caused undefined name/email in the navbar and broke after page refresh.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { signOut } from "firebase/auth";
import { trpc } from "@/lib/trpc";
import { firebaseAuth } from "@/lib/firebase";

// ── Types ────────────────────────────────────────────────────────────────────

export type AuthUser = {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  isAffiliate: boolean;
  isActive: boolean;
  profileImage?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  createdAt?: string;
  updatedAt?: string;
} | null;

export type AuthContextValue = {
  user: AuthUser;
  loading: boolean;
  error: unknown | null;
  isAuthenticated: boolean;
  /** Call this after login/signup — refetches auth.me to get fresh user data */
  refetchUser: () => void;
  /** Clears user state immediately (call after server logout) */
  clearUser: () => void;
  /** @deprecated Use refetchUser() after login instead */
  setUser: (user: AuthUser) => void;
  logout: () => Promise<void>;
};

// ── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown | null>(null);

  // ── Fetch current user from server ────────────────────────────────────────
  // auth.me reads the httpOnly cookie and returns the full user document.
  // This is called on mount and after any login/signup action.
  const authMe = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 30_000, // 30 seconds — don't hammer the server
  });

  // Sync local state with server response
  useEffect(() => {
    if (authMe.isLoading) {
      setLoading(true);
      return;
    }

    setLoading(false);

    if (authMe.error) {
      setError(authMe.error);
      setUserState(null);
      return;
    }

    // auth.me returns null if not logged in, or the full user object
    if (authMe.data) {
      setUserState(authMe.data as AuthUser);
      setError(null);
    } else {
      setUserState(null);
    }
  }, [authMe.data, authMe.isLoading, authMe.error]);

  // ── refetchUser — call after login/signup ────────────────────────────────
  const refetchUser = useCallback(() => {
    authMe.refetch();
  }, [authMe]);

  // ── clearUser — call after logout ────────────────────────────────────────
  const clearUser = useCallback(() => {
    setUserState(null);
  }, []);

  // ── setUser — legacy compatibility (used in Auth.tsx onSuccess) ──────────
  // We now IGNORE the passed value and just refetch from server.
  // This ensures we always have the full, correct user object.
  const setUser = useCallback(
    (_ignoredValue: AuthUser) => {
      // Refetch from server to get the real full user object
      authMe.refetch();
    },
    [authMe]
  );

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      clearUser();
    },
    onError: () => {
      clearUser();
    },
  });

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    setUserState(null);
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // ignore server logout failures
    }
    try {
      await signOut(firebaseAuth);
    } catch {
      // ignore firebase sign-out failures
    }
    window.location.href = "/";
  }, [logoutMutation]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      isAuthenticated: !!user,
      refetchUser,
      clearUser,
      setUser,
      logout,
    }),
    [user, loading, error, refetchUser, clearUser, setUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return context;
}
