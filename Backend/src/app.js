const express = require("express");
const { z } = require("zod");
const User = require("./models/User");
const config = require("./config");
const auth = require("./auth");

const registerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.email(),
  password: z.string().min(8).max(128),
});
const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(128),
});
const profileSchema = z.object({
  name: z.string().trim().min(1).max(80),
  avatarUrl: z.url().optional(),
}).partial().strict();

const publicUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  avatarUrl: user.avatarUrl,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});
const fail = (status, code, message) =>
  Object.assign(new Error(message), { status, code });
const parseCookies = (header = "") =>
  Object.fromEntries(
    header
      .split(";")
      .filter(Boolean)
      .map((part) => {
        const [key, ...value] = part.trim().split("=");
        return [key, decodeURIComponent(value.join("="))];
      }),
  );

function rateLimit() {
  const attempts = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const item = attempts.get(req.ip) || { count: 0, reset: now + 900000 };
    if (now > item.reset) {
      item.count = 0;
      item.reset = now + 900000;
    }
    item.count += 1;
    attempts.set(req.ip, item);
    if (item.count > 20)
      return res
        .status(429)
        .json({
          error: { code: "RATE_LIMITED", message: "Too many requests" },
        });
    next();
  };
}

function createApp({ UserModel = User } = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", config.frontendUrl);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });
  app.use(express.json({ limit: "20kb" }));
  app.use((req, _res, next) => {
    req.cookies = parseCookies(req.headers.cookie);
    next();
  });

  const validate = (schema) => (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
      return next(fail(400, "VALIDATION_ERROR", "Invalid request data"));
    req.body = parsed.data;
    next();
  };
  const requireRole = (...roles) => (req, _res, next) => roles.includes(req.auth?.role)
    ? next()
    : next(fail(403, "FORBIDDEN", "You do not have permission to access this resource"));
  const setRefresh = (res, token, expires) => res.setHeader("Set-Cookie", `refreshToken=${encodeURIComponent(token)}; HttpOnly; Path=/api/v1/auth; SameSite=Lax; Expires=${expires.toUTCString()}${config.cookieSecure ? "; Secure" : ""}`);
  const clearRefresh = (res) => res.setHeader("Set-Cookie", "refreshToken=; HttpOnly; Path=/api/v1/auth; SameSite=Lax; Max-Age=0");

  app.post(
    "/api/v1/auth/register",
    rateLimit(),
    validate(registerSchema),
    async (req, res, next) => {
      try {
        const email = req.body.email.toLowerCase();
        if (await UserModel.exists({ email }))
          throw fail(
            409,
            "EMAIL_EXISTS",
            "An account already exists for this email",
          );
        const user = await UserModel.create({
          name: req.body.name,
          email,
          passwordHash: await auth.makePasswordHash(req.body.password),
        });
        const token = auth.newRefreshToken();
        const expires = auth.refreshExpiry();
        await UserModel.updateOne({ _id: user._id }, {
          refreshTokenHash: auth.hashRefreshToken(token),
          refreshTokenExpiresAt: expires,
        });
        setRefresh(res, token, expires);
        res
          .status(201)
          .json({
            user: publicUser(user),
            accessToken: auth.signAccessToken(user),
          });
      } catch (e) {
        next(e);
      }
    },
  );
  app.post(
    "/api/v1/auth/login",
    rateLimit(),
    validate(loginSchema),
    async (req, res, next) => {
      try {
        const user = await UserModel.findOne({
          email: req.body.email.toLowerCase(),
        }).select("+passwordHash");
        if (
          !user ||
          !(await auth.checkPassword(req.body.password, user.passwordHash))
        )
          throw fail(401, "INVALID_CREDENTIALS", "Invalid email or password");
        const token = auth.newRefreshToken();
        const expires = auth.refreshExpiry();
        await UserModel.updateOne(
          { _id: user._id },
          {
            refreshTokenHash: auth.hashRefreshToken(token),
            refreshTokenExpiresAt: expires,
          },
        );
        setRefresh(res, token, expires);
        res.json({
          user: publicUser(user),
          accessToken: auth.signAccessToken(user),
        });
      } catch (e) {
        next(e);
      }
    },
  );
  app.post("/api/v1/auth/refresh", async (req, res, next) => {
    try {
      const token = req.cookies?.refreshToken;
      if (!token) throw fail(401, "UNAUTHENTICATED", "Authentication required");
      const user = await UserModel.findOne({
        refreshTokenHash: auth.hashRefreshToken(token),
        refreshTokenExpiresAt: { $gt: new Date() },
      }).select("+refreshTokenHash +refreshTokenExpiresAt");
      if (!user) throw fail(401, "UNAUTHENTICATED", "Authentication required");
      const nextToken = auth.newRefreshToken();
      const expires = auth.refreshExpiry();
      await UserModel.updateOne(
        { _id: user._id },
        {
          refreshTokenHash: auth.hashRefreshToken(nextToken),
          refreshTokenExpiresAt: expires,
        },
      );
      setRefresh(res, nextToken, expires);
      res.json({
        user: publicUser(user),
        accessToken: auth.signAccessToken(user),
      });
    } catch (e) {
      next(e);
    }
  });
  app.post("/api/v1/auth/logout", async (req, res, next) => {
    try {
      if (req.cookies?.refreshToken)
        await UserModel.updateOne(
          { refreshTokenHash: auth.hashRefreshToken(req.cookies.refreshToken) },
          { refreshTokenHash: null, refreshTokenExpiresAt: null },
        );
      clearRefresh(res);
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  });
  app.use((req, res, next) => {
    try {
      const header = req.headers.authorization || "";
      if (!header.startsWith("Bearer "))
        throw fail(401, "UNAUTHENTICATED", "Authentication required");
      req.auth = auth.verifyAccessToken(header.slice(7));
      next();
    } catch (e) {
      next(fail(401, "UNAUTHENTICATED", "Authentication required"));
    }
  });
  app.get("/api/v1/auth/me", async (req, res, next) => {
    try {
      const user = await UserModel.findById(req.auth.sub);
      if (!user) throw fail(401, "UNAUTHENTICATED", "Authentication required");
      res.json({ user: publicUser(user) });
    } catch (e) {
      next(e);
    }
  });
  app.patch("/api/v1/auth/me", validate(profileSchema), async (req, res, next) => {
    try {
      const user = await UserModel.findByIdAndUpdate(req.auth.sub, { $set: req.body }, { new: true, runValidators: true });
      if (!user) throw fail(401, "UNAUTHENTICATED", "Authentication required");
      res.json({ user: publicUser(user) });
    } catch (e) { next(e); }
  });
  app.get("/api/v1/admin/health", requireRole("admin"), (_req, res) => res.json({ ok: true }));
  app.use((error, req, res, _next) => {
    const status = error.status || 500;
    if (status >= 500) console.error(error);
    res
      .status(status)
      .json({
        error: {
          code: error.code || "INTERNAL_ERROR",
          message: status >= 500 ? "Internal server error" : error.message,
        },
      });
  });
  return app;
}

module.exports = { createApp };
