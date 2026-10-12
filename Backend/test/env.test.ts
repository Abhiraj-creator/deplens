import assert from "node:assert/strict";
import test from "node:test";
import { parseEnvironment } from "../src/config/env.js";

test("environment validation accepts the required values", () => {
  const env = parseEnvironment({ MONGODB_URI: "mongodb://localhost:27017/deplens", FRONTEND_URL: "http://localhost:3000" });
  assert.equal(env.PORT, 4000);
});

test("environment validation rejects an invalid MongoDB URL", () => {
  assert.throws(() => parseEnvironment({ MONGODB_URI: "not-a-url", FRONTEND_URL: "http://localhost:3000" }));
});
