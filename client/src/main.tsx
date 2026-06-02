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
const apiUrl = import.meta.env.VITE_API_URL || "/api/trpc";

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: apiUrl,
      transformer: superjson,
        // Include credentials so cookie-based sessions work (Set-Cookie / HttpOnly)
        fetch: (input, init) => fetch(input, { ...init, credentials: 'include' }),
        headers: async () => {
          const currentUser = firebaseAuth.currentUser;
          if (!currentUser) return {};
          const token = await currentUser.getIdToken();
          return { authorization: `Bearer ${token}` };
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
