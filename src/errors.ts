import type { ErrorRequestHandler, RequestHandler } from "express";
import createHttpError from "http-errors";
import { ZodError } from "zod";

export const notFound: RequestHandler = (req, _res, next) => {
  next(createHttpError(404, `Cannot ${req.method} ${req.path}`));
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({ error: "Invalid request", issues: error.issues });
  } else if (createHttpError.isHttpError(error) && error.expose) {
    res.status(error.status).json({ error: error.message });
  } else {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
