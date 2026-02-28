import type { Request, Response, NextFunction } from "express";

/**
 * Global Express error handler.
 * Must be registered AFTER all routes.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Determine message and status
  let status = 500;
  let message = "Error interno del servidor.";

  if (err instanceof Error) {
    message = err.message;

    // Map known error names / messages to HTTP status codes
    if (err.message.includes("not found") || err.message.includes("no encontrad")) {
      status = 404;
    } else if (err.message.includes("unauthorized") || err.message.includes("no autorizado")) {
      status = 401;
    } else if (err.message.includes("forbidden") || err.message.includes("sin permisos")) {
      status = 403;
    } else if (err.message.includes("validation") || err.message.includes("validacion")) {
      status = 400;
    }
  }

  console.error(`[ERROR ${status}]`, err);

  res.status(status).json({ error: message });
}
