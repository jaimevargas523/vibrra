import { createServer } from "node:http";
import express from "express";
import cors from "cors";
import helmet from "helmet";

import { env } from "./config/env.js";
import { authMiddleware } from "./middleware/auth.js";
import { errorHandler } from "./middleware/error-handler.js";
import apiRoutes from "./routes/index.js";
import paisRouter from "./routes/pais.js";
import { setupSocket } from "./socket/index.js";

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------
const app = express();

// Security headers
app.use(helmet());

// CORS -- allow dashboard dev server and common local ports
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:4173",
    ],
    credentials: true,
  }),
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------------------
// Health check (public)
// ---------------------------------------------------------------------------
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// Public API routes (no auth)
// ---------------------------------------------------------------------------
app.use("/api/pais", paisRouter);

// ---------------------------------------------------------------------------
// API routes (auth-protected)
// ---------------------------------------------------------------------------
app.use("/api", authMiddleware, apiRoutes);

// ---------------------------------------------------------------------------
// Global error handler (must be last middleware)
// ---------------------------------------------------------------------------
app.use(errorHandler);

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
