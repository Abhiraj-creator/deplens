const crypto = require("node:crypto");
const config = require("./config");

const base64url = (value) => Buffer.from(value).toString("base64url");

// Password salts are embedded separately below; this helper keeps the model shape simple.
async function makePasswordHash(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  return `scrypt:${salt}:${(await new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (e, k) => e ? reject(e) : resolve(k.toString("hex")))) )}`;
}

async function checkPassword(password, stored) {
  const [algorithm, salt, hash] = String(stored).split(":");
  if (algorithm !== "scrypt" || !salt || !hash) return false;
  const derived = await new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (e, k) => e ? reject(e) : resolve(k)));
  const expected = Buffer.from(hash, "hex");
  return expected.length === derived.length && crypto.timingSafeEqual(expected, derived);
}

function signAccessToken(user) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({ sub: String(user._id), role: user.role, exp: Math.floor(Date.now() / 1000) + 900 }));
  const signature = crypto.createHmac("sha256", config.jwtSecret).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

function verifyAccessToken(token) {
  const [header, payload, signature] = String(token || "").split(".");
  if (!header || !payload || !signature) throw new Error("Invalid token");
  const expected = crypto.createHmac("sha256", config.jwtSecret).update(`${header}.${payload}`).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error("Invalid token");
  const data = JSON.parse(Buffer.from(payload, "base64url").toString());
  if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) throw new Error("Expired token");
  return data;
}

const newRefreshToken = () => crypto.randomBytes(48).toString("base64url");
const hashRefreshToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const refreshExpiry = () => new Date(Date.now() + config.refreshTokenTtlDays * 86400000);

module.exports = { makePasswordHash, checkPassword, signAccessToken, verifyAccessToken, newRefreshToken, hashRefreshToken, refreshExpiry };
