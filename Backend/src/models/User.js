const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    avatarUrl: {
      type: String,
      default: "https://www.gravatar.com/avatar/?d=mp",
    },
    githubId: { type: String, default: null },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    refreshTokenHash: { type: String, select: false, default: null },
    refreshTokenExpiresAt: { type: Date, select: false, default: null },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model("User", userSchema);
