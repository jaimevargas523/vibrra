import { Router } from "express";
import type { HostProfile } from "../types/index.js";

const router = Router();

const mockProfile: HostProfile = {
  uid: "mock-host-uid-001",
  nombres: "Santiago",
  apellidos: "Rodriguez Mejia",
  email: "santiago.rodriguez@gmail.com",
  pais: "CO",
  tipoDoc: "CC",
  numeroDoc: "1020456789",
  celular: "+573001234567",
  tipoPersona: "natural",
  nit: null,
  regimen: "simplificado",
  responsableIva: false,
  banco: "Bancolombia",
  tipoCuenta: "ahorros",
  numeroCuenta: "****4532",
  titularCuenta: "Santiago Rodriguez Mejia",
  saldoReal: 1_475_000,
  saldoBono: 130_000,
  estado: "activo",
  verificacion: {
    identidad: true,
    email: true,
    celular: true,
    documentos: false,
  },
  legal: {
    terminosAceptados: true,
    fechaAceptacion: "2025-11-01T10:30:00.000Z",
    versionTerminos: "2.1",
  },
  creadoEn: "2025-11-01T10:00:00.000Z",
  actualizadoEn: "2026-02-25T14:30:00.000Z",
  fotoUrl: null,
};

// ---- GET /cuenta/profile ----
router.get("/profile", (_req, res) => {
  res.json(mockProfile);
});

// ---- PUT /cuenta/profile ----
router.put("/profile", (req, res) => {
  const allowed: (keyof HostProfile)[] = [
    "nombres",
    "apellidos",
    "celular",
    "banco",
    "tipoCuenta",
    "numeroCuenta",
    "titularCuenta",
    "tipoPersona",
    "nit",
    "regimen",
    "responsableIva",
  ];
  const body = req.body as Record<string, unknown>;

  for (const key of allowed) {
    if (key in body) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockProfile as any)[key] = body[key];
    }
  }
  mockProfile.actualizadoEn = new Date().toISOString();

  res.json(mockProfile);
});

export default router;
