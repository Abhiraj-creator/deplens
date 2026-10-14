import rateLimit from "express-rate-limit";
import type { Environment } from "../config/env.js";
import { error } from "../lib/response.js";

export function createAuthRateLimiter(env: Environment) {
	return rateLimit({
		windowMs: env.RATE_LIMIT_WINDOW_MS,
		max: env.RATE_LIMIT_MAX,
		standardHeaders: "draft-8",
		legacyHeaders: false,
		skipSuccessfulRequests: false,
		handler(_req, res) {
			res
				.status(429)
				.json(
					error("RATE_LIMITED", "Too many requests, please try again later"),
				);
		},
	});
}
