import bcrypt from "bcryptjs";
import type { Environment } from "../config/env.js";
import { authErrors } from "../lib/auth-errors.js";
import { createTokenService } from "../lib/tokens.js";
import { UserModel } from "../models/user.model.js";
import type {
	LoginBody,
	RegisterBody,
	UpdateProfileBody,
} from "../routes/auth.schemas.js";

/** Public user shape — safe to include in API responses */
export interface UserProfile {
	id: string;
	name: string;
	email: string;
	avatarUrl: string;
	role: "user" | "admin";
	createdAt: string;
}

export interface AuthTokens {
	accessToken: string;
	/** Raw refresh token — set in HttpOnly cookie, never log */
	refreshToken: string;
}

function toProfile(user: {
	_id: unknown;
	name: string;
	email: string;
	avatarUrl: string;
	role: string;
	createdAt: Date;
}): UserProfile {
	return {
		id: String(user._id),
		name: user.name,
		email: user.email,
		avatarUrl: user.avatarUrl,
		role: user.role as "user" | "admin",
		createdAt: user.createdAt.toISOString(),
	};
}

export function createAuthService(env: Environment) {
	const tokens = createTokenService(env);

	async function register(
		body: RegisterBody,
	): Promise<{ user: UserProfile; tokens: AuthTokens }> {
		const existing = await UserModel.findOne({ email: body.email });
		if (existing) throw authErrors.emailExists();

		const passwordHash = await bcrypt.hash(body.password, env.BCRYPT_ROUNDS);
		const user = await UserModel.create({
			name: body.name,
			email: body.email,
			passwordHash,
		});

		const result = await issueTokensForUser(user.id, user.email, user.role);
		return { user: toProfile(user), tokens: result };
	}

	async function login(
		body: LoginBody,
	): Promise<{ user: UserProfile; tokens: AuthTokens }> {
		// Always fetch passwordHash explicitly (select: false on schema)
		const user = await UserModel.findOne({ email: body.email }).select(
			"+passwordHash",
		);
		if (!user) {
			// Perform a dummy compare to resist timing attacks
			await bcrypt.compare(
				body.password,
				"$2b$12$dummyhashfortimingreistance0000000000000000",
			);
			throw authErrors.invalidCredentials();
		}

		const valid = await bcrypt.compare(body.password, user.passwordHash);
		if (!valid) throw authErrors.invalidCredentials();

		const result = await issueTokensForUser(user.id, user.email, user.role);
		return { user: toProfile(user), tokens: result };
	}

	async function refresh(rawRefreshToken: string): Promise<AuthTokens> {
		const payload = tokens.verifyRefreshToken(rawRefreshToken);
		const tokenHash = tokens.hashRefreshToken(rawRefreshToken);

		const user = await UserModel.findOne({
			_id: payload.sub,
			"sessions.jti": payload.jti,
		});
		if (!user) throw authErrors.refreshTokenInvalid();

		const session = user.sessions.find((s) => s.jti === payload.jti);
		if (!session) throw authErrors.refreshTokenInvalid();

		// Validate stored hash to detect token theft
		if (session.tokenHash !== tokenHash) {
			// Detected a reuse — revoke all sessions (refresh token rotation breach)
			user.sessions = [];
			await user.save();
			throw authErrors.refreshTokenReused();
		}

		if (session.expiresAt < new Date()) {
			user.sessions = user.sessions.filter((s) => s.jti !== payload.jti);
			await user.save();
			throw authErrors.refreshTokenInvalid();
		}

		// Rotate: remove old session, issue new
		user.sessions = user.sessions.filter((s) => s.jti !== payload.jti);
		await user.save();

		return issueTokensForUser(user.id, user.email, user.role);
	}

	async function logout(
		userId: string,
		rawRefreshToken?: string,
	): Promise<void> {
		if (rawRefreshToken) {
			try {
				const payload = tokens.verifyRefreshToken(rawRefreshToken);
				await UserModel.updateOne(
					{ _id: userId },
					{ $pull: { sessions: { jti: payload.jti } } },
				);
			} catch {
				// If token is invalid/expired, still proceed — clear all sessions as a fallback
				await UserModel.updateOne({ _id: userId }, { $set: { sessions: [] } });
			}
		} else {
			// No token provided — revoke all sessions
			await UserModel.updateOne({ _id: userId }, { $set: { sessions: [] } });
		}
	}

	async function getProfile(userId: string): Promise<UserProfile> {
		const user = await UserModel.findById(userId);
		if (!user) throw authErrors.unauthorized();
		return toProfile(user);
	}

	async function updateProfile(
		userId: string,
		body: UpdateProfileBody,
	): Promise<UserProfile> {
		const user = await UserModel.findByIdAndUpdate(
			userId,
			{ $set: body },
			{ new: true, runValidators: true },
		);
		if (!user) throw authErrors.unauthorized();
		return toProfile(user);
	}

	/** Internal: create access + refresh tokens, persist session */
	async function issueTokensForUser(
		userId: string,
		email: string,
		role: "user" | "admin",
	): Promise<AuthTokens> {
		const accessToken = tokens.signAccessToken({ sub: userId, email, role });
		const { token: refreshToken, jti } = tokens.signRefreshToken(userId);
		const tokenHash = tokens.hashRefreshToken(refreshToken);

		const refreshExpiresMs = parseExpiry(env.JWT_REFRESH_EXPIRES_IN);
		const expiresAt = new Date(Date.now() + refreshExpiresMs);

		await UserModel.updateOne(
			{ _id: userId },
			{
				$push: {
					sessions: {
						$each: [{ tokenHash, jti, expiresAt, createdAt: new Date() }],
						// Keep at most 5 active sessions per user
						$slice: -5,
					},
				},
			},
		);

		return { accessToken, refreshToken };
	}

	return { register, login, refresh, logout, getProfile, updateProfile };
}

export type AuthService = ReturnType<typeof createAuthService>;

/** Parse "15m", "7d", "1h" → milliseconds */
function parseExpiry(expiry: string): number {
	const units: Record<string, number> = {
		s: 1000,
		m: 60_000,
		h: 3_600_000,
		d: 86_400_000,
	};
	const match = expiry.match(/^(\d+)([smhd])$/);
	if (!match) return 7 * 86_400_000; // default 7 days
	const unit = match[2] ?? "d";
	return Number(match[1]) * (units[unit] ?? 86_400_000);
}
