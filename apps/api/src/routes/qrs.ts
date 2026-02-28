import { Router } from "express";
import type { QrData } from "../types/index.js";

const router = Router();

const mockQrs: QrData[] = [
  {
    id: "qr-001",
    establecimientoId: "est-001",
    establecimientoNombre: "Bar La Terraza",
    url: "https://app.vibrra.co/q/qr-001",
    activo: true,
    escaneos: 487,
    creadoEn: "2025-11-01T10:00:00.000Z",
  },
  {
    id: "qr-002",
    establecimientoId: "est-001",
    establecimientoNombre: "Bar La Terraza",
    url: "https://app.vibrra.co/q/qr-002",
    activo: true,
    escaneos: 312,
    creadoEn: "2025-12-01T10:00:00.000Z",
  },
  {
    id: "qr-003",
    establecimientoId: "est-002",
    establecimientoNombre: "Club Nocturno Vibrra",
    url: "https://app.vibrra.co/q/qr-003",
    activo: true,
    escaneos: 1_243,
    creadoEn: "2025-12-15T08:00:00.000Z",
  },
  {
    id: "qr-004",
    establecimientoId: "est-002",
    establecimientoNombre: "Club Nocturno Vibrra",
    url: "https://app.vibrra.co/q/qr-004",
    activo: true,
    escaneos: 890,
    creadoEn: "2026-01-05T12:00:00.000Z",
  },
  {
    id: "qr-005",
    establecimientoId: "est-002",
    establecimientoNombre: "Club Nocturno Vibrra",
    url: "https://app.vibrra.co/q/qr-005",
    activo: false,
    escaneos: 56,
    creadoEn: "2026-01-20T15:00:00.000Z",
  },
  {
    id: "qr-006",
    establecimientoId: "est-003",
    establecimientoNombre: "Karaoke Estrella",
    url: "https://app.vibrra.co/q/qr-006",
    activo: true,
    escaneos: 124,
    creadoEn: "2026-01-10T12:00:00.000Z",
  },
];

// ---- GET /qrs ----
router.get("/", (req, res) => {
  const establecimientoId = req.query["establecimientoId"] as string | undefined;
  let result = mockQrs;
  if (establecimientoId) {
    result = result.filter((q) => q.establecimientoId === establecimientoId);
  }
  res.json(result);
});

export default router;
