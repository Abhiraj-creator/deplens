import type { RequestHandler } from "express";
import type { Environment } from "../config/env.js";
import { AuthError } from "../lib/auth-errors.js";
import { error } from "../lib/response.js";
import type { AccessTokenPayload } from "../lib/tokens.js";
import { createTokenService } from "../lib/tokens.js";

/** Augment Express Request to carry the decoded token payload */
declare global {
	namespace Express {
		interface Request {
			auth?: AccessTokenPayload;
		}
	}
}

export function createAuthMiddleware(env: Environment) {
	const tokens = createTokenService(env);

	/**
	 * Extracts and validates the Bearer access token from the Authorization header.
	 * Sets req.auth on success; throws 401 on failure.
	 */
	const requireAuth: RequestHandler = (req, res, next) => {
		const header = req.headers.authorization;
		if (!header?.startsWith("Bearer ")) {
			res.status(401).json(error("UNAUTHORIZED", "Authentication required"));
			return;
		}

		try {
			const token = header.slice(7);
			req.auth = tokens.verifyAccessToken(token);
			next();
		} catch (err) {
			if (err instanceof AuthError) {
				res.status(err.statusCode).json(error(err.code, err.message));
				return;
			}
			res.status(401).json(error("TOKEN_INVALID", "Token is invalid"));
		}
	};

	/**
	 * Role authorization middleware — must be used AFTER requireAuth.
	 * requireRole("admin") only allows admin users through.
	 */
	const requireRole =
		(...roles: Array<"user" | "admin">): RequestHandler =>
		(req, res, next) => {
			if (!req.auth) {
				res.status(401).json(error("UNAUTHORIZED", "Authentication required"));
				return;
			}
			if (!roles.includes(req.auth.role)) {
				res.status(403).json(error("FORBIDDEN", "Insufficient permissions"));
				return;
			}
			next();
		};

	return { requireAuth, requireRole };
}

export type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;
