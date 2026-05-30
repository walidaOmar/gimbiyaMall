export const ENV = {
  jwtSecret: process.env.JWT_SECRET ?? "",
  mongodbUri: process.env.MONGODB_URI ?? "",
  mongodbDbName: process.env.MONGODB_DB_NAME ?? "gimbiya_mall",
  port: parseInt(process.env.PORT ?? "3000"),
  isProduction: process.env.NODE_ENV === "production",
  appUrl: process.env.VITE_APP_URL ?? "http://localhost:3000",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? process.env.FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? process.env.FORGE_API_KEY ?? "",
};
