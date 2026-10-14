/**
 * Typed, centralized authentication error codes used across all auth routes,
 * middleware, and services. Never expose internal details in error messages.
 */

export type AuthErrorCode =
	| "INVALID_CREDENTIALS"
	| "EMAIL_ALREADY_EXISTS"
	| "USER_NOT_FOUND"
	| "TOKEN_EXPIRED"
	| "TOKEN_INVALID"
	| "REFRESH_TOKEN_INVALID"
	| "REFRESH_TOKEN_REUSED"
	| "UNAUTHORIZED"
	| "FORBIDDEN"
	| "VALIDATION_ERROR"
	| "RATE_LIMITED"
	| "INTERNAL_ERROR";

export class AuthError extends Error {
	constructor(
		public readonly code: AuthErrorCode,
		message: string,
		public readonly statusCode: number = 401,
	) {
		super(message);
		this.name = "AuthError";
	}
}

/** Generic message for login failures — never hint at which field is wrong */
export const GENERIC_LOGIN_FAILURE = "Invalid email or password";

export const authErrors = {
	invalidCredentials: () =>
		new AuthError("INVALID_CREDENTIALS", GENERIC_LOGIN_FAILURE, 401),

	emailExists: () =>
		new AuthError(
			"EMAIL_ALREADY_EXISTS",
			"An account with that email already exists",
			409,
		),

	tokenExpired: () => new AuthError("TOKEN_EXPIRED", "Token has expired", 401),

	tokenInvalid: () => new AuthError("TOKEN_INVALID", "Token is invalid", 401),

	refreshTokenInvalid: () =>
		new AuthError(
			"REFRESH_TOKEN_INVALID",
			"Refresh token is invalid or has been revoked",
			401,
		),

	refreshTokenReused: () =>
		new AuthError(
			"REFRESH_TOKEN_REUSED",
			"Refresh token has already been used — possible replay attack",
			401,
		),

	unauthorized: () =>
		new AuthError("UNAUTHORIZED", "Authentication required", 401),

	forbidden: (resource = "resource") =>
		new AuthError(
			"FORBIDDEN",
			`You do not have permission to access this ${resource}`,
			403,
		),
} as const;
