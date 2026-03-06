import { Server as SocketServer } from "socket.io";
import { socketAuthMiddleware } from "./auth-socket.js";
import { registerSessionHandlers, startMockEmitter } from "./sesion-live.js";
/**
 * Create and configure the Socket.IO server.
 * Returns the SocketServer instance so it can be referenced elsewhere.
 */
export function setupSocket(httpServer) {
    const io = new SocketServer(httpServer, {
        cors: {
            origin: [
                "http://localhost:5173",
                "http://localhost:3000",
                "http://localhost:4173",
                "https://vibrra.live",
                "https://www.vibrra.live",
                "https://vibrra-6cd01.web.app",
            ],
            credentials: true,
        },
    });
    // ---------- /sesion namespace ----------
    const sesionNsp = io.of("/sesion");
    // Auth middleware for this namespace
    sesionNsp.use(socketAuthMiddleware);
    // Connection handler
    sesionNsp.on("connection", (socket) => {
        console.log(`[Socket /sesion] connected: ${socket.id}  uid=${socket.data["uid"]}`);
        registerSessionHandlers(sesionNsp, socket);
    });
    // In non-production, start mock emitter for testing
    if (process.env["NODE_ENV"] !== "production") {
        startMockEmitter(sesionNsp);
        console.log("[Socket] Mock emitter started (dev mode).");
    }
    return io;
}
