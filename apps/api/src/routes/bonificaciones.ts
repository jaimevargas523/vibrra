import { Router } from "express";
import type { Bonus } from "../types/index.js";

const router = Router();

const mockBonos: Bonus[] = [
  {
    id: "bono-001",
    hostUid: "mock-host-uid-001",
    tipo: "bienvenida",
    monto: 50_000,
    estado: "usado",
    descripcion: "Bono de bienvenida por registrarte en VIBRRA",
    fechaExpiracion: "2026-05-01T23:59:59.000Z",
    creadoEn: "2025-11-01T10:00:00.000Z",
  },
  {
    id: "bono-002",
    hostUid: "mock-host-uid-001",
    tipo: "referido",
    monto: 25_000,
    estado: "disponible",
    descripcion: "Bono por referir a DJ Martinez",
    fechaExpiracion: "2026-06-15T23:59:59.000Z",
    creadoEn: "2026-01-20T14:00:00.000Z",
  },
  {
    id: "bono-003",
    hostUid: "mock-host-uid-001",
    tipo: "promocion",
    monto: 30_000,
    estado: "disponible",
    descripcion: "Promocion Carnavales 2026 - Usa en tu proxima sesion",
    fechaExpiracion: "2026-03-15T23:59:59.000Z",
    creadoEn: "2026-02-01T08:00:00.000Z",
  },
  {
    id: "bono-004",
    hostUid: "mock-host-uid-001",
    tipo: "fidelidad",
    monto: 75_000,
    estado: "disponible",
    descripcion: "Bono de fidelidad por 3 meses consecutivos activo",
    fechaExpiracion: "2026-04-30T23:59:59.000Z",
    creadoEn: "2026-02-15T10:00:00.000Z",
  },
  {
    id: "bono-005",
    hostUid: "mock-host-uid-001",
    tipo: "promocion",
    monto: 15_000,
    estado: "vencido",
    descripcion: "Promo Fin de Ano 2025",
    fechaExpiracion: "2026-01-15T23:59:59.000Z",
    creadoEn: "2025-12-20T10:00:00.000Z",
  },
];

// ---- GET /bonificaciones ----
router.get("/", (_req, res) => {
  res.json(mockBonos);
});

export default router;
