import express from "express";
import type { Environment } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/error-handler.js";
import { createHealthRouter } from "./routes/health.routes.js";

export function createApp(env: Environment) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "20kb" }));
  app.use("/api/v1", createHealthRouter(env));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
