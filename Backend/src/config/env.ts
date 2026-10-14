import { z } from "zod";

const environmentSchema = z.object({
	NODE_ENV: z
		.enum(["development", "test", "production"])
		.default("development"),
	PORT: z.coerce.number().int().positive().default(8080),
	MONGODB_URI: z.string().url(),
	FRONTEND_URL: z.string().url(),
	JWT_ACCESS_SECRET: z.string().min(32),
	JWT_REFRESH_SECRET: z.string().min(32),
	JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
	JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
	BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
	RATE_LIMIT_WINDOW_MS: z.coerce
		.number()
		.int()
		.positive()
		.default(15 * 60 * 1000),
	RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
	COOKIE_SECURE: z
		.string()
		.transform((v) => v === "true")
		.default(false),
	COOKIE_SAME_SITE: z.enum(["strict", "lax", "none"]).default("lax"),
});

export type Environment = z.infer<typeof environmentSchema>;

export function parseEnvironment(values: NodeJS.ProcessEnv): Environment {
	return environmentSchema.parse(values);
}
