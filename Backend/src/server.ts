import "dotenv/config";
import { createApp } from "./app.js";
import { parseEnvironment } from "./config/env.js";
import { connectDatabase } from "./lib/database.js";
import { logger } from "./lib/logger.js";

const env = parseEnvironment(process.env);
const app = createApp(env);

connectDatabase(env.MONGODB_URI)
	.then(() => {
		app.listen(env.PORT, () =>
			logger.info("API listening", { port: env.PORT }),
		);
	})
	.catch((err: unknown) => {
		logger.error("Failed to connect to database", {
			error: err instanceof Error ? err.message : "unknown",
		});
		process.exit(1);
	});
