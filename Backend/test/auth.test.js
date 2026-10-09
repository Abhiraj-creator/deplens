const test = require("node:test");
const assert = require("node:assert/strict");
const { makePasswordHash, checkPassword, newRefreshToken, hashRefreshToken, signAccessToken, verifyAccessToken } = require("../src/auth");

test("passwords hash and verify without accepting the original plaintext", async () => {
  const hash = await makePasswordHash("correct horse battery staple");
  assert.notEqual(hash, "correct horse battery staple");
  assert.equal(await checkPassword("correct horse battery staple", hash), true);
  assert.equal(await checkPassword("wrong", hash), false);
});

test("access tokens round trip and refresh tokens are one-way hashes", () => {
  const token = signAccessToken({ _id: "user-1", role: "user" });
  assert.equal(verifyAccessToken(token).sub, "user-1");
  const refresh = newRefreshToken();
  assert.notEqual(hashRefreshToken(refresh), refresh);
});
