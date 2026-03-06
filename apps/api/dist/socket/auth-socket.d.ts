import type { Socket } from "socket.io";
/**
 * Socket.IO middleware: verify Firebase ID token on handshake.
 * Token should be passed as `socket.handshake.auth.token`.
 */
export declare function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void): Promise<void>;
