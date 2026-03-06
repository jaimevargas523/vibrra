import type { Request, Response, NextFunction } from "express";
/**
 * Global Express error handler.
 * Must be registered AFTER all routes.
 */
export declare function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void;
