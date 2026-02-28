import { Router } from "express";
import type { RecargaPlan } from "../types/index.js";

const router = Router();

const planes: RecargaPlan[] = [
  {
    id: "plan-basic",
    nombre: "Basico",
    monto: 50_000,
    bonus: 0,
    popular: false,
  },
  {
    id: "plan-plus",
    nombre: "Plus",
    monto: 100_000,
    bonus: 10_000,
    popular: true,
  },
  {
    id: "plan-pro",
    nombre: "Profesional",
    monto: 200_000,
    bonus: 30_000,
    popular: false,
  },
  {
    id: "plan-elite",
    nombre: "Elite",
    monto: 500_000,
    bonus: 100_000,
    popular: false,
  },
];

// ---- GET /recargar/planes ----
router.get("/planes", (_req, res) => {
  res.json(planes);
});

// ---- POST /recargar/iniciar ----
router.post("/iniciar", (req, res) => {
  const { planId } = req.body as { planId?: string };
  const plan = planes.find((p) => p.id === planId);
  if (!plan) {
    res.status(400).json({ error: "Plan no encontrado." });
    return;
  }
  // In a real implementation this would create a payment session (e.g. Wompi).
  res.status(201).json({
    transaccionId: `txn-rec-${Date.now()}`,
    plan,
    estado: "pendiente",
    urlPago: `https://checkout.wompi.co/mock/${Date.now()}`,
    creadoEn: new Date().toISOString(),
  });
});

export default router;
