import { APP_NAME } from "../config/app.js";
import { Router } from "express";
import type { Environment } from "../config/env.js";
import { ok } from "../lib/response.js";

export function createHealthRouter(env: Environment) {
  const healthRouter = Router();

  healthRouter.get("/health", (_request, response) => {
    response.json(ok({ app: APP_NAME, environment: env.NODE_ENV, status: "ok" as const }));
  });

  return healthRouter;
}
