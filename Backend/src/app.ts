import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import type { Environment } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/error-handler.js";
import { createAuthRateLimiter } from "./middleware/rate-limit.js";
import { createAuthRouter } from "./routes/auth.routes.js";
import { createHealthRouter } from "./routes/health.routes.js";

export function createApp(env: Environment) {
	const app = express();

	// Security
	app.disable("x-powered-by");

	// CORS — only allow configured frontend origin
	app.use(
		cors({
			origin: env.FRONTEND_URL,
			credentials: true, // allow cookies
			methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
			allowedHeaders: ["Content-Type", "Authorization"],
		}),
	);

	// Body parsing
	app.use(express.json({ limit: "20kb" }));
	app.use(cookieParser());

	// Routes
	app.use("/api/v1", createHealthRouter(env));
	app.use("/api/v1/auth", createAuthRateLimiter(env), createAuthRouter(env));

	// Error handling (must be last)
	app.use(notFound);
	app.use(errorHandler);

	return app;
}
