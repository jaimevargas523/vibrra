import { Router } from "express";
import type { KpiData, Session } from "../types/index.js";
import { getRecentSessions } from "../services/sesion.service.js";

const router = Router();

// ---- GET /resumen/kpis ----
router.get("/kpis", (_req, res) => {
  const kpis: KpiData[] = [
    {
      label: "Ingresos del mes",
      valor: 1_475_000,
      unidad: "COP",
      cambio: 12,
      tendencia: "up",
    },
    {
      label: "Sesiones activas",
      valor: 24,
      unidad: "sesiones",
      cambio: 8,
      tendencia: "up",
    },
    {
      label: "Canciones solicitadas",
      valor: 342,
      unidad: "canciones",
      cambio: -3,
      tendencia: "down",
    },
    {
      label: "Promedio por sesion",
      valor: 61_458,
      unidad: "COP",
      cambio: 5,
      tendencia: "up",
    },
  ];
  res.json(kpis);
});

// ---- GET /resumen/sesiones-recientes ----
router.get("/sesiones-recientes", (_req, res) => {
  const recent: Session[] = getRecentSessions(3);
  res.json(recent);
});

export default router;
