import type { Request, Response, NextFunction } from "express";
declare global {
    namespace Express {
        interface Request {
            uid?: string;
        }
    }
}
/**
 * Express middleware: verify Firebase ID token from the Authorization header.
 * Attaches `req.uid` on success; responds with 401 otherwise.
 */
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void>;
