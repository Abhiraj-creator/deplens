import { APP_NAME } from "../config/app.js";

export const logger = {
	info(message: string, meta: Record<string, unknown> = {}) {
		console.info(
			JSON.stringify({ app: APP_NAME, level: "info", message, ...meta }),
		);
	},
	error(message: string, meta: Record<string, unknown> = {}) {
		console.error(
			JSON.stringify({ app: APP_NAME, level: "error", message, ...meta }),
		);
	},
};
