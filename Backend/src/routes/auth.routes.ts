import { Router } from "express";
import type { Environment } from "../config/env.js";
import { error, ok } from "../lib/response.js";
import { createAuthMiddleware } from "../middleware/auth.middleware.js";
import { createAuthService } from "../services/auth.service.js";
import {
	loginSchema,
	registerSchema,
	updateProfileSchema,
} from "./auth.schemas.js";

const REFRESH_COOKIE = "refresh_token";

function cookieOptions(env: Environment, maxAge?: number) {
	return {
		httpOnly: true,
		secure: env.NODE_ENV === "production" ? true : env.COOKIE_SECURE,
		sameSite: env.COOKIE_SAME_SITE as "strict" | "lax" | "none",
		path: "/api/v1/auth",
		...(maxAge !== undefined ? { maxAge } : {}),
	};
}

export function createAuthRouter(env: Environment) {
	const router = Router();
	const authService = createAuthService(env);
	const { requireAuth } = createAuthMiddleware(env);

	/**
	 * POST /api/v1/auth/register
	 * Body: { name, email, password }
	 * Returns: user profile + sets refresh cookie + access token in body
	 */
	router.post("/register", async (req, res, next) => {
		try {
			const body = registerSchema.parse(req.body);

			const { user, tokens } = await authService.register(body);

			res.cookie(
				REFRESH_COOKIE,
				tokens.refreshToken,
				cookieOptions(env, 7 * 24 * 60 * 60 * 1000),
			);
			res.status(201).json(ok({ user, accessToken: tokens.accessToken }));
		} catch (err) {
			next(err);
		}
	});

	/**
	 * POST /api/v1/auth/login
	 * Body: { email, password }
	 * Returns: user profile + access token; sets refresh cookie
	 */
	router.post("/login", async (req, res, next) => {
		try {
			const body = loginSchema.parse(req.body);
			const { user, tokens } = await authService.login(body);

			res.cookie(
				REFRESH_COOKIE,
				tokens.refreshToken,
				cookieOptions(env, 7 * 24 * 60 * 60 * 1000),
			);
			res.json(ok({ user, accessToken: tokens.accessToken }));
		} catch (err) {
			next(err);
		}
	});

	/**
	 * POST /api/v1/auth/refresh
	 * Reads refresh token from HttpOnly cookie
	 * Returns: new access token + rotates refresh cookie
	 */
	router.post("/refresh", async (req, res, next) => {
		try {
			const rawToken: string | undefined = req.cookies?.[REFRESH_COOKIE];
			if (!rawToken) {
				res
					.status(401)
					.json(error("REFRESH_TOKEN_INVALID", "No refresh token"));
				return;
			}

			const tokens = await authService.refresh(rawToken);
			res.cookie(
				REFRESH_COOKIE,
				tokens.refreshToken,
				cookieOptions(env, 7 * 24 * 60 * 60 * 1000),
			);
			res.json(ok({ accessToken: tokens.accessToken }));
		} catch (err) {
			next(err);
		}
	});

	/**
	 * POST /api/v1/auth/logout
	 * Clears refresh cookie and revokes the session
	 */
	router.post("/logout", requireAuth, async (req, res, next) => {
		try {
			const userId = req.auth?.sub;
			console.log(userId);
			
			if (!userId) {
				res.status(401).json(error("UNAUTHORIZED", "Authentication required"));
				return;
			}
			const rawToken: string | undefined = req.cookies?.[REFRESH_COOKIE];
			await authService.logout(userId, rawToken);
			res.clearCookie(REFRESH_COOKIE, cookieOptions(env));
			res.json(ok({ message: "Logged out successfully" }));
		} catch (err) {
			next(err);
		}
	});

	/**
	 * GET /api/v1/auth/me
	 * Returns: authenticated user's profile (for client-side hydration)
	 */
	router.get("/me", requireAuth, async (req, res, next) => {
		try {
			const userId = req.auth?.sub;
			if (!userId) {
				res.status(401).json(error("UNAUTHORIZED", "Authentication required"));
				return;
			}
			const user = await authService.getProfile(userId);
			res.json(ok({ user }));
		} catch (err) {
			next(err);
		}
	});

	/**
	 * PATCH /api/v1/auth/me
	 * Body: { name?, avatarUrl? }
	 * Updates allowed profile fields only
	 */
	router.patch("/me", requireAuth, async (req, res, next) => {
		try {
			const userId = req.auth?.sub;
			if (!userId) {
				res.status(401).json(error("UNAUTHORIZED", "Authentication required"));
				return;
			}
			const body = updateProfileSchema.parse(req.body);
			const user = await authService.updateProfile(userId, body);
			res.json(ok({ user }));
		} catch (err) {
			next(err);
		}
	});

	return router;
}
