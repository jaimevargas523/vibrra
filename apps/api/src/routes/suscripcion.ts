import { Router } from "express";
import { adminDb } from "../config/firebase-admin.js";
import { getPaisConfig } from "./mi-pais.js";

const router = Router();

// ---- GET /suscripcion ----
router.get("/", async (req, res) => {
  try {
    const uid = req.uid!;

    // Try to get subscription from Firestore
    const snap = await adminDb()
      .collection("Anfitriones")
      .doc(uid)
      .collection("Suscripcion")
      .doc("actual")
      .get();

    if (!snap.exists) {
      // No subscription yet — return defaults from Paises config
      const anfitrionSnap = await adminDb().collection("Anfitriones").doc(uid).get();
      const paisCode = anfitrionSnap.exists ? (anfitrionSnap.data()!.pais ?? "CO") : "CO";
      const paisConfig = await getPaisConfig(paisCode);

      res.json({
        id: null,
        estado: "activa",
        precioMensual: paisConfig?.suscripcion?.precioMensual ?? 0,
        fechaInicio: null,
        fechaRenovacion: null,
        mesesPagados: 0,
      });
      return;
    }

    const data = snap.data()!;
    res.json({
      id: snap.id,
      estado: data.estado ?? "activa",
      precioMensual: data.precioMensual ?? 0,
      fechaInicio: data.fechaInicio ?? null,
      fechaRenovacion: data.fechaRenovacion ?? null,
      mesesPagados: data.mesesPagados ?? 0,
    });
  } catch (err) {
    console.error("GET /suscripcion error:", err);
    res.status(500).json({ error: "Error al obtener suscripcion." });
  }
});

export default router;
