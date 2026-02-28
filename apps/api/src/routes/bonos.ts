import { Router } from "express";

const router = Router();

interface Bono {
  id: string;
  anfitrion_uid: string;
  tipo: "bienvenida" | "referido" | "promocion" | "fidelidad";
  monto_total: number;
  monto_disponible: number;
  monto_usado: number;
  fecha_creacion: string;
  fecha_vencimiento: string;
  activo: boolean;
}

const mockBonos: Bono[] = [
  {
    id: "bono-001",
    anfitrion_uid: "mock-host-uid-001",
    tipo: "bienvenida",
    monto_total: 50_000,
    monto_disponible: 0,
    monto_usado: 50_000,
    fecha_creacion: "2025-11-01T10:00:00.000Z",
    fecha_vencimiento: "2026-05-01T23:59:59.000Z",
    activo: false,
  },
  {
    id: "bono-002",
    anfitrion_uid: "mock-host-uid-001",
    tipo: "referido",
    monto_total: 25_000,
    monto_disponible: 25_000,
    monto_usado: 0,
    fecha_creacion: "2026-01-20T14:00:00.000Z",
    fecha_vencimiento: "2026-06-15T23:59:59.000Z",
    activo: true,
  },
  {
    id: "bono-003",
    anfitrion_uid: "mock-host-uid-001",
    tipo: "promocion",
    monto_total: 30_000,
    monto_disponible: 30_000,
    monto_usado: 0,
    fecha_creacion: "2026-02-01T08:00:00.000Z",
    fecha_vencimiento: "2026-03-15T23:59:59.000Z",
    activo: true,
  },
  {
    id: "bono-004",
    anfitrion_uid: "mock-host-uid-001",
    tipo: "fidelidad",
    monto_total: 75_000,
    monto_disponible: 75_000,
    monto_usado: 0,
    fecha_creacion: "2026-02-15T10:00:00.000Z",
    fecha_vencimiento: "2026-04-30T23:59:59.000Z",
    activo: true,
  },
  {
    id: "bono-005",
    anfitrion_uid: "mock-host-uid-001",
    tipo: "promocion",
    monto_total: 15_000,
    monto_disponible: 0,
    monto_usado: 0,
    fecha_creacion: "2025-12-20T10:00:00.000Z",
    fecha_vencimiento: "2026-01-15T23:59:59.000Z",
    activo: false,
  },
];

// ---- GET /bonos ----
router.get("/", (_req, res) => {
  res.json(mockBonos);
});

// ---- POST /bonos/bienvenida ----
router.post("/bienvenida", (_req, res) => {
  const newBono: Bono = {
    id: `bono-${Date.now()}`,
    anfitrion_uid: "mock-host-uid-001",
    tipo: "bienvenida",
    monto_total: 50_000,
    monto_disponible: 50_000,
    monto_usado: 0,
    fecha_creacion: new Date().toISOString(),
    fecha_vencimiento: new Date(Date.now() + 90 * 86_400_000).toISOString(),
    activo: true,
  };
  mockBonos.push(newBono);
  res.status(201).json(newBono);
});

export default router;
