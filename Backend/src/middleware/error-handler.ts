import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { AuthError } from "../lib/auth-errors.js";
import { logger } from "../lib/logger.js";
import { error } from "../lib/response.js";

export const notFound: RequestHandler = (request, response) => {
	response
		.status(404)
		.json(error("NOT_FOUND", `No route for ${request.method} ${request.path}`));
};

export const errorHandler: ErrorRequestHandler = (
	exception,
	_request,
	response,
	_next,
) => {
	if (exception instanceof ZodError) {
		const messages = exception.issues
			.map((issue) => {
				const path = issue.path.length ? issue.path.join(".") : "(root)";
				return `${path}: ${issue.message}`;
			})
			.join("; ");
		response
			.status(400)
			.json(
				error(
					"VALIDATION_ERROR",
					messages
						? `Invalid request data: ${messages}`
						: "Invalid request data",
				),
			);
		return;
	}

	if (exception instanceof AuthError) {
		response
			.status(exception.statusCode)
			.json(error(exception.code, exception.message));
		return;
	}

	logger.error("Unhandled request error", {
		exception: exception instanceof Error ? exception.message : "unknown",
	});
	response.status(500).json(error("INTERNAL_ERROR", "Internal server error"));
};
