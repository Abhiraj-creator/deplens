import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { logger } from "../lib/logger.js";
import { error } from "../lib/response.js";

export const notFound: RequestHandler = (request, response) => {
  response.status(404).json(error("NOT_FOUND", `No route for ${request.method} ${request.path}`));
};

export const errorHandler: ErrorRequestHandler = (exception, _request, response, _next) => {
  if (exception instanceof ZodError) {
    response.status(400).json(error("VALIDATION_ERROR", "Invalid request data"));
    return;
  }

  logger.error("Unhandled request error", { exception: exception instanceof Error ? exception.message : "unknown" });
  response.status(500).json(error("INTERNAL_ERROR", "Internal server error"));
};
