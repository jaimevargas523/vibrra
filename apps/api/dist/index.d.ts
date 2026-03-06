import { app } from "./app.js";
declare const httpServer: import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>;
export { app, httpServer };
