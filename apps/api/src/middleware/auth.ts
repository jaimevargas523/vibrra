import type { Request, Response, NextFunction } from "express";
import { adminAuth } from "../config/firebase-admin.js";

// ---- Express module augmentation ----
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
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token de autenticacion requerido." });
    return;
  }

  const token = header.slice(7);

  // In development / mock mode, accept a special bypass token.
  if (process.env["NODE_ENV"] !== "production" && token === "dev-mock-token") {
    req.uid = "mock-host-uid-001";
    next();
    return;
  }

  try {
    const decoded = await adminAuth().verifyIdToken(token);
    req.uid = decoded.uid;
    next();
  } catch (err) {
    console.error("Auth middleware: token verification failed", err);
    res.status(401).json({ error: "Token invalido o expirado." });
  }
}
