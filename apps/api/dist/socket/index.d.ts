import type { Server as HttpServer } from "node:http";
import { Server as SocketServer } from "socket.io";
/**
 * Create and configure the Socket.IO server.
 * Returns the SocketServer instance so it can be referenced elsewhere.
 */
export declare function setupSocket(httpServer: HttpServer): SocketServer;
