import express from "express";
import cors from "cors";
import helmet from "helmet";

import { authMiddleware } from "./middleware/auth.js";
import { errorHandler } from "./middleware/error-handler.js";
import apiRoutes from "./routes/index.js";
import paisRouter from "./routes/pais.js";

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------
const app = express();

// Security headers
app.use(helmet());

// CORS -- allow dashboard dev server, common local ports, and production
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:4173",
      "https://vibrra.live",
      "https://www.vibrra.live",
      "https://vibrra-6cd01.web.app",
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
  res.json({ status: "ok", v: "4", timestamp: new Date().toISOString() });
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

export { app };
