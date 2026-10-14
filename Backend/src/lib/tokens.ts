import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import type { Environment } from "../config/env.js";
import { authErrors } from "./auth-errors.js";

export interface AccessTokenPayload {
	sub: string; // userId
	email: string;
	role: "user" | "admin";
	iat?: number;
	exp?: number;
}

export interface RefreshTokenPayload {
	sub: string; // userId
	jti: string; // unique token ID
	iat?: number;
	exp?: number;
}

export function createTokenService(env: Environment) {
	function signAccessToken(
		payload: Omit<AccessTokenPayload, "iat" | "exp">,
	): string {
		return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
			expiresIn: env.JWT_ACCESS_EXPIRES_IN as NonNullable<
				jwt.SignOptions["expiresIn"]
			>,
		});
	}

	function verifyAccessToken(token: string): AccessTokenPayload {
		try {
			return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
		} catch (err) {
			if (err instanceof jwt.TokenExpiredError) throw authErrors.tokenExpired();
			throw authErrors.tokenInvalid();
		}
	}

	function signRefreshToken(userId: string): { token: string; jti: string } {
		const jti = crypto.randomUUID();
		const token = jwt.sign({ sub: userId, jti }, env.JWT_REFRESH_SECRET, {
			expiresIn: env.JWT_REFRESH_EXPIRES_IN as NonNullable<
				jwt.SignOptions["expiresIn"]
			>,
		});
		return { token, jti };
	}

	function verifyRefreshToken(token: string): RefreshTokenPayload {
		try {
			return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
		} catch (err) {
			if (err instanceof jwt.TokenExpiredError)
				throw authErrors.refreshTokenInvalid();
			throw authErrors.refreshTokenInvalid();
		}
	}

	/** Hash a refresh token for safe storage — never store the raw token */
	function hashRefreshToken(token: string): string {
		return crypto.createHash("sha256").update(token).digest("hex");
	}

	return {
		signAccessToken,
		verifyAccessToken,
		signRefreshToken,
		verifyRefreshToken,
		hashRefreshToken,
	};
}

export type TokenService = ReturnType<typeof createTokenService>;
