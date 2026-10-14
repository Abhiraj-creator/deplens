import { z } from "zod";

export const registerSchema = z.object({
	name: z
		.string()
		.min(1, "Name is required")
		.max(100, "Name must be at most 100 characters")
		.trim(),
	email: z
		.string()
		.email("Invalid email address")
		.max(254, "Email is too long")
		.transform((v) => v.toLowerCase().trim()),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.max(128, "Password must be at most 128 characters")
		.regex(
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
			"Password must contain at least one uppercase letter, one lowercase letter, and one number",
		),
});

export const loginSchema = z.object({
	email: z
		.string()
		.email("Invalid email address")
		.transform((v) => v.toLowerCase().trim()),
	password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
	name: z
		.string()
		.min(1, "Name is required")
		.max(100, "Name must be at most 100 characters")
		.trim()
		.optional(),
	avatarUrl: z.string().url("Invalid avatar URL").optional(),
});

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
export type UpdateProfileBody = z.infer<typeof updateProfileSchema>;
