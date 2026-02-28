import { Router } from "express";
import type {
  AnalyticsData,
  KpiData,
  HeatmapPoint,
  GeneroCount,
  ClientProfile,
} from "../types/index.js";

const router = Router();

const dias = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

function buildHeatmap(): HeatmapPoint[] {
  const points: HeatmapPoint[] = [];
  for (const dia of dias) {
    for (let hora = 16; hora <= 23; hora++) {
      let base: number;
      // Weekends peak higher
      if (dia === "viernes" || dia === "sabado") {
        base = hora >= 20 ? 90 : hora >= 18 ? 60 : 25;
      } else if (dia === "jueves" || dia === "domingo") {
        base = hora >= 20 ? 55 : hora >= 18 ? 35 : 15;
      } else {
        base = hora >= 20 ? 30 : hora >= 18 ? 20 : 10;
      }
      // Add some deterministic jitter based on position
      const jitter = ((dias.indexOf(dia) * 7 + hora) % 17) - 8;
      points.push({
        dia,
        hora,
        valor: Math.max(0, Math.min(100, base + jitter)),
      });
    }
  }
  return points;
}

const generos: GeneroCount[] = [
  { genero: "Reggaeton", cantidad: 145, porcentaje: 32 },
  { genero: "Salsa", cantidad: 98, porcentaje: 22 },
  { genero: "Vallenato", cantidad: 67, porcentaje: 15 },
  { genero: "Pop Latino", cantidad: 54, porcentaje: 12 },
  { genero: "Merengue", cantidad: 36, porcentaje: 8 },
  { genero: "Electronica", cantidad: 27, porcentaje: 6 },
  { genero: "Rock en Espanol", cantidad: 15, porcentaje: 3 },
  { genero: "Otros", cantidad: 8, porcentaje: 2 },
];

const perfilCliente: ClientProfile = {
  edadPromedio: 28,
  generoPredominante: "Mixto (55% M / 45% F)",
  ticketPromedio: 15_000,
  frecuenciaVisita: 2.4,
};

const kpis: KpiData[] = [
  {
    label: "Solicitudes totales",
    valor: 450,
    unidad: "canciones",
    cambio: 18,
    tendencia: "up",
  },
  {
    label: "Tasa de aceptacion",
    valor: 92,
    unidad: "%",
    cambio: 3,
    tendencia: "up",
  },
  {
    label: "Ingreso promedio por sesion",
    valor: 185_000,
    unidad: "COP",
    cambio: 7,
    tendencia: "up",
  },
  {
    label: "Hora pico",
    valor: 22,
    unidad: "h",
    cambio: 0,
    tendencia: "neutral",
  },
];

// ---- GET /analytics ----
router.get("/", (_req, res) => {
  const data: AnalyticsData = {
    kpis,
    heatmap: buildHeatmap(),
    generos,
    perfilCliente,
  };
  res.json(data);
});

export default router;
