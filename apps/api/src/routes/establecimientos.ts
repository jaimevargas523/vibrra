import { Router } from "express";
import type { Establecimiento } from "../types/index.js";

const router = Router();

const mockEstablecimientos: Establecimiento[] = [
  {
    id: "est-001",
    hostUid: "mock-host-uid-001",
    nombre: "Bar La Terraza",
    direccion: "Cra 7 #45-12, Chapinero",
    ciudad: "Bogota",
    departamento: "Cundinamarca",
    tipo: "bar",
    capacidad: 120,
    activo: true,
    qrCodes: ["qr-001", "qr-002"],
    imagenUrl: null,
    creadoEn: "2025-11-01T10:00:00.000Z",
    actualizadoEn: "2026-02-20T14:30:00.000Z",
  },
  {
    id: "est-002",
    hostUid: "mock-host-uid-001",
    nombre: "Club Nocturno Vibrra",
    direccion: "Calle 85 #15-30, Zona Rosa",
    ciudad: "Bogota",
    departamento: "Cundinamarca",
    tipo: "discoteca",
    capacidad: 300,
    activo: true,
    qrCodes: ["qr-003", "qr-004", "qr-005"],
    imagenUrl: null,
    creadoEn: "2025-12-15T08:00:00.000Z",
    actualizadoEn: "2026-02-18T20:00:00.000Z",
  },
  {
    id: "est-003",
    hostUid: "mock-host-uid-001",
    nombre: "Karaoke Estrella",
    direccion: "Av 19 #100-20",
    ciudad: "Bogota",
    departamento: "Cundinamarca",
    tipo: "karaoke",
    capacidad: 60,
    activo: false,
    qrCodes: ["qr-006"],
    imagenUrl: null,
    creadoEn: "2026-01-10T12:00:00.000Z",
    actualizadoEn: "2026-02-10T09:00:00.000Z",
  },
];

// ---- GET /establecimientos ----
router.get("/", (_req, res) => {
  res.json(mockEstablecimientos);
});

// ---- GET /establecimientos/:id ----
router.get("/:id", (req, res) => {
  const est = mockEstablecimientos.find((e) => e.id === req.params["id"]);
  if (!est) {
    res.status(404).json({ error: "Establecimiento no encontrado." });
    return;
  }
  res.json(est);
});

// ---- POST /establecimientos ----
router.post("/", (req, res) => {
  const body = req.body as Partial<Establecimiento>;
  const newEst: Establecimiento = {
    id: `est-${Date.now()}`,
    hostUid: req.uid ?? "mock-host-uid-001",
    nombre: body.nombre ?? "Nuevo Establecimiento",
    direccion: body.direccion ?? "",
    ciudad: body.ciudad ?? "Bogota",
    departamento: body.departamento ?? "Cundinamarca",
    tipo: body.tipo ?? "bar",
    capacidad: body.capacidad ?? 50,
    activo: true,
    qrCodes: [],
    imagenUrl: null,
    creadoEn: new Date().toISOString(),
    actualizadoEn: new Date().toISOString(),
  };
  mockEstablecimientos.push(newEst);
  res.status(201).json(newEst);
});

// ---- PUT /establecimientos/:id ----
router.put("/:id", (req, res) => {
  const idx = mockEstablecimientos.findIndex((e) => e.id === req.params["id"]);
  if (idx === -1) {
    res.status(404).json({ error: "Establecimiento no encontrado." });
    return;
  }
  const body = req.body as Partial<Establecimiento>;
  const updated: Establecimiento = {
    ...mockEstablecimientos[idx]!,
    ...body,
    id: mockEstablecimientos[idx]!.id,
    hostUid: mockEstablecimientos[idx]!.hostUid,
    actualizadoEn: new Date().toISOString(),
  };
  mockEstablecimientos[idx] = updated;
  res.json(updated);
});

export default router;
