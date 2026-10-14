import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import { createApp } from "../src/app.js";
import { parseEnvironment } from "../src/config/env.js";

test("GET /api/v1/health returns the typed health payload", async () => {
	const server = createApp(
		parseEnvironment({
			NODE_ENV: "test",
			MONGODB_URI: "mongodb://localhost:27017/deplens",
			FRONTEND_URL: "http://localhost:3000",
			JWT_ACCESS_SECRET: "a-secret-that-is-at-least-32-characters-long",
			JWT_REFRESH_SECRET: "another-secret-that-is-at-least-32-chars-long",
		}),
	).listen(0);
	await once(server, "listening");
	try {
		const address = server.address();
		assert.ok(address && typeof address !== "string");
		const response = await fetch(
			`http://127.0.0.1:${address.port}/api/v1/health`,
		);
		assert.equal(response.status, 200);
		assert.deepEqual(await response.json(), {
			data: { app: "deplens", environment: "test", status: "ok" },
		});
	} finally {
		server.close();
	}
});
