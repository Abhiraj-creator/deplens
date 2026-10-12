import "dotenv/config";
import { createApp } from "./app.js";
import { parseEnvironment } from "./config/env.js";
import { logger } from "./lib/logger.js";

const env = parseEnvironment(process.env);
const app = createApp(env);

app.listen(
    env.PORT, () => logger.info("API listening",
        { port: env.PORT }));
