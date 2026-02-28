import { Router } from "express";
import type { Document } from "../types/index.js";

const router = Router();

const mockDocuments: Document[] = [
  {
    id: "doc-001",
    hostUid: "mock-host-uid-001",
    tipo: "cedula_frente",
    nombre: "Cedula_Frente_Santiago.jpg",
    url: "https://storage.googleapis.com/vibrra-docs/mock/cedula_frente.jpg",
    estado: "aprobado",
    creadoEn: "2025-11-02T09:00:00.000Z",
    revisadoEn: "2025-11-03T14:00:00.000Z",
    nota: null,
  },
  {
    id: "doc-002",
    hostUid: "mock-host-uid-001",
    tipo: "cedula_reverso",
    nombre: "Cedula_Reverso_Santiago.jpg",
    url: "https://storage.googleapis.com/vibrra-docs/mock/cedula_reverso.jpg",
    estado: "aprobado",
    creadoEn: "2025-11-02T09:01:00.000Z",
    revisadoEn: "2025-11-03T14:00:00.000Z",
    nota: null,
  },
  {
    id: "doc-003",
    hostUid: "mock-host-uid-001",
    tipo: "rut",
    nombre: "RUT_Santiago_Rodriguez.pdf",
    url: "https://storage.googleapis.com/vibrra-docs/mock/rut.pdf",
    estado: "pendiente",
    creadoEn: "2026-02-20T11:00:00.000Z",
    revisadoEn: null,
    nota: null,
  },
  {
    id: "doc-004",
    hostUid: "mock-host-uid-001",
    tipo: "contrato",
    nombre: "Contrato_Prestacion_Servicios.pdf",
    url: "https://storage.googleapis.com/vibrra-docs/mock/contrato.pdf",
    estado: "rechazado",
    creadoEn: "2026-01-15T16:00:00.000Z",
    revisadoEn: "2026-01-18T10:00:00.000Z",
    nota: "El contrato debe incluir firma digital. Por favor vuelva a subir una version firmada.",
  },
];

// ---- GET /documentos ----
router.get("/", (_req, res) => {
  res.json(mockDocuments);
});

// ---- POST /documentos/upload ----
router.post("/upload", (req, res) => {
  const body = req.body as { tipo?: string; nombre?: string };
  if (!body.tipo || !body.nombre) {
    res.status(400).json({ error: "tipo y nombre son requeridos." });
    return;
  }
  const newDoc: Document = {
    id: `doc-${Date.now()}`,
    hostUid: req.uid ?? "mock-host-uid-001",
    tipo: body.tipo as Document["tipo"],
    nombre: body.nombre,
    url: `https://storage.googleapis.com/vibrra-docs/mock/${Date.now()}.pdf`,
    estado: "pendiente",
    creadoEn: new Date().toISOString(),
    revisadoEn: null,
    nota: null,
  };
  mockDocuments.push(newDoc);
  res.status(201).json(newDoc);
});

export default router;
