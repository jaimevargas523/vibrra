import { Router } from "express";
import type { Subscription } from "../types/index.js";

const router = Router();

const mockSubscription: Subscription = {
  id: "sub-001",
  hostUid: "mock-host-uid-001",
  plan: "profesional",
  estado: "activa",
  precioMensual: 89_000,
  fechaInicio: "2025-12-01T00:00:00.000Z",
  fechaRenovacion: "2026-03-01T00:00:00.000Z",
  establecimientosMax: 5,
  sesionesMax: -1, // unlimited
  caracteristicas: [
    "Hasta 5 establecimientos",
    "Sesiones ilimitadas",
    "Analisis avanzado",
    "Soporte prioritario",
    "Personalizacion de QR",
    "Reportes mensuales",
  ],
};

// ---- GET /suscripcion ----
router.get("/", (_req, res) => {
  res.json(mockSubscription);
});

export default router;
