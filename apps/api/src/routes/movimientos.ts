import { Router } from "express";
import type { KpiData, ChartDataPoint } from "../types/index.js";

const router = Router();

function isoDaysAgo(d: number): string {
  return new Date(Date.now() - d * 86_400_000).toISOString();
}

interface Movimiento {
  id: string;
  tipo: string;
  titulo: string;
  subtitulo: string;
  negocio_id: string | null;
  negocio_nombre: string | null;
  fecha: string;
  bruto: number;
  comision_vibrra: number;
  fee_wompi: number;
  neto: number;
  anfitrion_uid: string;
}

const mockMovimientos: Movimiento[] = [
  {
    id: "txn-001",
    tipo: "ingreso",
    titulo: "Sesion Bar La Terraza",
    subtitulo: "24 canciones",
    negocio_id: "neg-001",
    negocio_nombre: "Bar La Terraza",
    fecha: isoDaysAgo(1),
    bruto: 168000,
    comision_vibrra: 25200,
    fee_wompi: 4200,
    neto: 138600,
    anfitrion_uid: "mock-host-uid-001",
  },
  {
    id: "txn-002",
    tipo: "retiro",
    titulo: "Retiro a cuenta Bancolombia *4532",
    subtitulo: "Transferencia bancaria",
    negocio_id: null,
    negocio_nombre: null,
    fecha: isoDaysAgo(2),
    bruto: 500_000,
    comision_vibrra: 0,
    fee_wompi: 0,
    neto: 500_000,
    anfitrion_uid: "mock-host-uid-001",
  },
  {
    id: "txn-003",
    tipo: "ingreso",
    titulo: "Sesion Club Nocturno Vibrra",
    subtitulo: "52 canciones",
    negocio_id: "neg-002",
    negocio_nombre: "Club Nocturno Vibrra",
    fecha: isoDaysAgo(5),
    bruto: 390_000,
    comision_vibrra: 58500,
    fee_wompi: 9750,
    neto: 321750,
    anfitrion_uid: "mock-host-uid-001",
  },
  {
    id: "txn-004",
    tipo: "bono",
    titulo: "Bono de bienvenida VIBRRA",
    subtitulo: "Credito promocional",
    negocio_id: null,
    negocio_nombre: null,
    fecha: isoDaysAgo(7),
    bruto: 50_000,
    comision_vibrra: 0,
    fee_wompi: 0,
    neto: 50_000,
    anfitrion_uid: "mock-host-uid-001",
  },
  {
    id: "txn-005",
    tipo: "suscripcion",
    titulo: "Suscripcion Plan Profesional",
    subtitulo: "Febrero 2026",
    negocio_id: null,
    negocio_nombre: null,
    fecha: isoDaysAgo(10),
    bruto: 89_000,
    comision_vibrra: 0,
    fee_wompi: 0,
    neto: 89_000,
    anfitrion_uid: "mock-host-uid-001",
  },
  {
    id: "txn-006",
    tipo: "ingreso",
    titulo: "Sesion Bar La Terraza",
    subtitulo: "35 canciones",
    negocio_id: "neg-001",
    negocio_nombre: "Bar La Terraza",
    fecha: isoDaysAgo(3),
    bruto: 262_500,
    comision_vibrra: 39375,
    fee_wompi: 6563,
    neto: 216562,
    anfitrion_uid: "mock-host-uid-001",
  },
  {
    id: "txn-007",
    tipo: "recarga",
    titulo: "Recarga saldo - Plan Plus",
    subtitulo: "Pago con tarjeta",
    negocio_id: null,
    negocio_nombre: null,
    fecha: isoDaysAgo(12),
    bruto: 100_000,
    comision_vibrra: 0,
    fee_wompi: 2500,
    neto: 97_500,
    anfitrion_uid: "mock-host-uid-001",
  },
  {
    id: "txn-008",
    tipo: "ingreso",
    titulo: "Sesion Club Nocturno Vibrra",
    subtitulo: "64 canciones",
    negocio_id: "neg-002",
    negocio_nombre: "Club Nocturno Vibrra",
    fecha: isoDaysAgo(2),
    bruto: 480_000,
    comision_vibrra: 72000,
    fee_wompi: 12000,
    neto: 396000,
    anfitrion_uid: "mock-host-uid-001",
  },
];

// ---- GET /movimientos ----
router.get("/", (req, res) => {
  const page = Math.max(1, parseInt(req.query["page"] as string) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(req.query["pageSize"] as string) || 10));
  const tipo = req.query["tipo"] as string | undefined;

  let filtered = mockMovimientos;
  if (tipo) {
    filtered = filtered.filter((t) => t.tipo === tipo);
  }

  // Sort newest first
  filtered.sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
  );

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);

  res.json({
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
});

// ---- GET /movimientos/resumen ----
router.get("/resumen", (_req, res) => {
  const cards: KpiData[] = [
    {
      label: "Total ingresos",
      valor: 1_300_500,
      unidad: "COP",
      cambio: 15,
      tendencia: "up",
    },
    {
      label: "Total retiros",
      valor: 500_000,
      unidad: "COP",
      cambio: 0,
      tendencia: "neutral",
    },
    {
      label: "Bonos recibidos",
      valor: 50_000,
      unidad: "COP",
      cambio: 100,
      tendencia: "up",
    },
    {
      label: "Saldo disponible",
      valor: 1_475_000,
      unidad: "COP",
      cambio: 12,
      tendencia: "up",
    },
  ];
  res.json(cards);
});

// ---- GET /movimientos/chart ----
router.get("/chart", (req, res) => {
  const dias = Math.min(30, Math.max(1, parseInt(req.query["dias"] as string) || 7));
  const today = new Date();
  const points: ChartDataPoint[] = Array.from({ length: dias }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (dias - 1 - i));
    const dayLabel = d.toLocaleDateString("es-CO", { weekday: "short" });
    // Generate mock revenue values
    const baseValues = [85000, 120000, 95000, 145000, 175000, 210000, 155000];
    return {
      fecha: d.toISOString().slice(0, 10),
      valor: baseValues[i % baseValues.length]!,
      label: dayLabel,
    };
  });
  res.json(points);
});

// ---- GET /movimientos/exportar ----
router.get("/exportar", (_req, res) => {
  const headers = "id,tipo,titulo,subtitulo,negocio_id,negocio_nombre,fecha,bruto,comision_vibrra,fee_wompi,neto,anfitrion_uid";
  const rows = mockMovimientos
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .map((m) =>
      [
        m.id,
        m.tipo,
        `"${m.titulo}"`,
        `"${m.subtitulo}"`,
        m.negocio_id ?? "",
        m.negocio_nombre ? `"${m.negocio_nombre}"` : "",
        m.fecha,
        m.bruto,
        m.comision_vibrra,
        m.fee_wompi,
        m.neto,
        m.anfitrion_uid,
      ].join(","),
    );
  const csv = [headers, ...rows].join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=movimientos.csv");
  res.send(csv);
});

export default router;
