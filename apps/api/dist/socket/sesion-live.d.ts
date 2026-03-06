import type { Namespace, Socket } from "socket.io";
/**
 * Register event handlers for a single socket in the /sesion namespace.
 */
export declare function registerSessionHandlers(nsp: Namespace, socket: Socket): void;
/**
 * Start a periodic mock emitter that pushes a simulated queue change
 * every 30 seconds while there is an active session. Useful for frontend
 * testing without real user interaction.
 */
export declare function startMockEmitter(nsp: Namespace): void;
