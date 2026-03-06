import { createServer } from "node:http";
import { env } from "./config/env.js";
import { app } from "./app.js";
import { setupSocket } from "./socket/index.js";
// ---------------------------------------------------------------------------
// HTTP + Socket.IO server
// ---------------------------------------------------------------------------
const httpServer = createServer(app);
setupSocket(httpServer);
httpServer.listen(env.PORT, () => {
    console.log(`
  ╔══════════════════════════════════════════════╗
  ║   VIBRRA API  --  http://localhost:${env.PORT}      ║
  ║   Health:      /health                       ║
  ║   API:         /api/*  (Bearer token)        ║
  ║   Socket.IO:   /sesion                       ║
  ╚══════════════════════════════════════════════╝
  `);
});
export { app, httpServer };
