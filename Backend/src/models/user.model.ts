import { type Document, model, Schema, type Types } from "mongoose";

/** Stored refresh session for token rotation */
export interface RefreshSession {
	/** SHA-256 hash of the raw refresh token — never store plaintext */
	tokenHash: string;
	jti: string;
	expiresAt: Date;
	createdAt: Date;
}

export interface IUser {
	_id: Types.ObjectId;
	name: string;
	/** Stored in lowercase-normalized form */
	email: string;
	/** bcrypt hash — never exposed in API responses */
	passwordHash: string;
	avatarUrl: string;
	/** Optional GitHub user ID for future OAuth integration */
	githubId?: string;
	role: "user" | "admin";
	/** Active refresh sessions — rotated on each refresh */
	sessions: RefreshSession[];
	createdAt: Date;
	updatedAt: Date;
}

export type UserDocument = IUser & Document<Types.ObjectId>;

const refreshSessionSchema = new Schema<RefreshSession>(
	{
		tokenHash: { type: String, required: true },
		jti: { type: String, required: true },
		expiresAt: { type: Date, required: true },
		createdAt: { type: Date, required: true, default: () => new Date() },
	},
	{ _id: false },
);

const userSchema = new Schema<UserDocument>(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			minlength: 1,
			maxlength: 100,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
			match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
		},
		passwordHash: {
			type: String,
			required: true,
			select: false, // never returned in queries unless explicitly requested
		},
		avatarUrl: {
			type: String,
			default:
				"https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
		},
		githubId: {
			type: String,
			sparse: true,
			index: true,
		},
		role: {
			type: String,
			enum: ["user", "admin"],
			default: "user",
		},
		sessions: {
			type: [refreshSessionSchema],
			default: [],
		},
	},
	{
		timestamps: true,
		toJSON: {
			transform(_doc, ret: Record<string, unknown>) {
				// Never expose passwordHash or sessions in JSON output
				ret.passwordHash = undefined;
				ret.sessions = undefined;
				return ret;
			},
		},
	},
);

// Compound index: keep session list lean by jti lookups
userSchema.index({ "sessions.jti": 1 });

export const UserModel = model<UserDocument>("User", userSchema);
