import type { Socket } from "socket.io";
import { adminAuth } from "../config/firebase-admin.js";

/**
 * Socket.IO middleware: verify Firebase ID token on handshake.
 * Token should be passed as `socket.handshake.auth.token`.
 */
export async function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void,
): Promise<void> {
  const token = socket.handshake.auth?.["token"] as string | undefined;

  if (!token) {
    next(new Error("Token de autenticacion requerido."));
    return;
  }

  // Dev bypass
  if (process.env["NODE_ENV"] !== "production" && token === "dev-mock-token") {
    socket.data["uid"] = "mock-host-uid-001";
    next();
    return;
  }

  try {
    const decoded = await adminAuth().verifyIdToken(token);
    socket.data["uid"] = decoded.uid;
    next();
  } catch {
    next(new Error("Token invalido o expirado."));
  }
}
