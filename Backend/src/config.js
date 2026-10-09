require("dotenv").config();

const required = (name, fallback) => {
  const value = process.env[name] || fallback;
  if (!value && process.env.NODE_ENV === "production") throw new Error(`${name} is required`);
  return value;
};

module.exports = {
  port: Number(process.env.PORT || 4000),
  mongoUri: required("MONGODB_URI", "mongodb://127.0.0.1:27017/deplens"),
  jwtSecret: required("JWT_SECRET", "development-only-change-me"),
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || "15m",
  refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  cookieSecure: process.env.COOKIE_SECURE === "true",
};
