/**
 * main.tsx — Demo Mode Entry Point
 *
 * Uses the mock tRPC client from lib/trpc.ts — no server needed.
 * The trpc.Provider is a no-op in demo mode.
 *
 * TO SWITCH TO PRODUCTION:
 *   Replace the trpc import in lib/trpc.ts with the real createTRPCReact version,
 *   then restore this file to use httpBatchStreamLink.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import { trpc } from "./lib/trpc";
import { firebaseAuth } from "@/lib/firebase";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

// Get API URL from environment variable or use relative path for local dev
const deriveCodespaceApiUrl = () => {
  if (typeof window === "undefined") return null;

  const host = window.location.host;
  const isGithubDev = host.endsWith(".app.github.dev") || host.endsWith(".github.dev");
  if (!isGithubDev) return null;

  const match = host.match(/^(.*)-3000(\.app\.github\.dev|\.github\.dev)$/);
  if (!match) return null;

  return `${window.location.protocol}//${match[1]}-3001${match[2]}/api/trpc`;
};

const apiUrl =
  import.meta.env.VITE_API_URL ||
  deriveCodespaceApiUrl() ||
  "/api/trpc";

// In production we expect a relative URL (`/api/trpc`) so requests go through
// the Netlify proxy. Only warn when the value looks malformed (neither
// relative nor absolute http(s)).
if (import.meta.env.PROD && !apiUrl.startsWith("/") && !apiUrl.startsWith("http")) {
  console.warn("VITE_API_URL looks misconfigured:", apiUrl);
}

const trpcClient = trpc.createClient({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: apiUrl,
      // Include credentials so cookie-based sessions work (Set-Cookie / HttpOnly)
      fetch: (input, init) => fetch(input, { ...init, credentials: "include" }),
      headers: async () => {
        try {
          const currentUser = firebaseAuth.currentUser;
          console.debug("trpc header: firebase currentUser present?", !!currentUser);

          // If a demo email is stored in localStorage (dev/demo mode), send it
          // to the backend via a header so the server can return a mock session
          // when the DB is offline. Key: `GIMBIYA_DEMO_EMAIL`.
          let demoHeader: Record<string, string> = {};
          try {
            if (typeof window !== "undefined") {
              const demoEmail = localStorage.getItem("GIMBIYA_DEMO_EMAIL");
              if (demoEmail) demoHeader = { "x-demo-session-email": demoEmail };
            }
          } catch (e) {
            /* ignore localStorage failures */
          }

          if (!currentUser) return demoHeader;
          const token = await currentUser.getIdToken();
          return { authorization: `Bearer ${token}`, ...demoHeader };
        } catch (err) {
          console.warn("Failed to build auth headers for trpc:", err);
          return {};
        }
      },
    }),
  ],
});

console.log("trpc apiUrl:", apiUrl);

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
