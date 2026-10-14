import mongoose from "mongoose";
import { logger } from "./logger.js";

let isConnected = false;

export async function connectDatabase(uri: string): Promise<void> {
	if (isConnected) return;

	await mongoose.connect(uri, {
		serverSelectionTimeoutMS: 5000,
		socketTimeoutMS: 45000,
	});

	isConnected = true;
	logger.info("MongoDB connected", {
		uri: uri.replace(/\/\/.*@/, "//<redacted>@"),
	});
}

export async function disconnectDatabase(): Promise<void> {
	if (!isConnected) return;
	await mongoose.disconnect();
	isConnected = false;
	logger.info("MongoDB disconnected");
}
