import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { connectDB } from "../mongodb";
import { authRateLimiter, apiRateLimiter } from "./rateLimit";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => { server.close(() => resolve(true)); });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(start = 3000): Promise<number> {
  for (let p = start; p < start + 20; p++) {
    if (await isPortAvailable(p)) return p;
  }
  throw new Error(`No available port found from ${start}`);
}

async function startServer() {
  // 1. Connect MongoDB and seed staff accounts
  await connectDB();

  const app = express();
  const server = createServer(app);

  // 2. Configure CORS for production deployment
  const corsOrigin = process.env.CORS_ORIGIN || "https://gimbiyamall.netlify.app";
  const corsOptions = {
    origin: corsOrigin,
    credentials: true,
    optionsSuccessStatus: 200,
  };
  app.use(cors(corsOptions));

  // 3. Rate limiting: stricter on auth, general on all API
  app.use("/api/trpc/auth", authRateLimiter);
  app.use("/api/trpc", apiRateLimiter);

  // 4. tRPC router — all API handled here, no separate OAuth routes
  app.use(
    "/api/trpc",
    createExpressMiddleware({ router: appRouter, createContext })
  );

  // 5. Other routes can still use express body parsing if needed
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // 6. Frontend (Vite dev or static build)
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) console.log(`Port ${preferredPort} busy, using ${port}`);

  server.listen(port, () => {
    console.log(`\n🛍️  Gimbiya Mall → http://localhost:${port}/`);
    console.log(`📦  API         → http://localhost:${port}/api/trpc`);
    console.log(`\n👤  Staff Login Credentials:`);
    console.log(`   admin       admin@sahadstores.com      Admin@123456`);
    console.log(`   manager     manager@sahadstores.com    Manager@123456`);
    console.log(`   delivery    delivery@sahadstores.com   Delivery@123456`);
    console.log(`   developer   developer@sahadstores.com  Developer@123456`);
    console.log(`   buyer       register at /auth          (self-signup)\n`);
  });
}

startServer().catch(console.error);
