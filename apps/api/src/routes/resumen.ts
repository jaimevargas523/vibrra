import { Router } from "express";
import { adminDb } from "../config/firebase-admin.js";

const router = Router();

// ---- GET /resumen/kpis ----
router.get("/kpis", async (req, res) => {
  try {
    const uid = req.uid!;

    // Get user's balance data
    const userSnap = await adminDb().collection("Anfitriones").doc(uid).get();
    const userData = userSnap.exists ? userSnap.data()! : {};

    // Count establishments
    const negociosSnap = await adminDb()
      .collection("Negocios")
      .where("anfitrionId", "==", uid)
      .get();

    const totalRecaudado = userData.saldoReal ?? 0;
    const totalSesiones = negociosSnap.docs.reduce(
      (sum, d) => sum + (d.data().totalSesiones ?? 0), 0
    );
    const totalCanciones = negociosSnap.docs.reduce(
      (sum, d) => sum + (d.data().totalCanciones ?? 0), 0
    );
    const promedioSesion = totalSesiones > 0 ? Math.round(totalRecaudado / totalSesiones) : 0;

    res.json({
      totalRecaudado,
      totalSesiones,
      totalCanciones,
      promedioSesion,
      comparacionMesAnterior: {
        recaudado: 0,
        sesiones: 0,
        canciones: 0,
      },
    });
  } catch (err) {
    console.error("GET /resumen/kpis error:", err);
    res.status(500).json({ error: "Error al obtener KPIs." });
  }
});

// ---- GET /resumen/sesiones-recientes ----
router.get("/sesiones-recientes", async (req, res) => {
  try {
    const uid = req.uid!;
    // Query real sessions from Firestore (if collection exists)
    const snap = await adminDb()
      .collection("Sesiones")
      .where("hostUid", "==", uid)
      .orderBy("iniciadaEn", "desc")
      .limit(3)
      .get();

    if (snap.empty) {
      res.json([]);
      return;
    }

    const sesiones = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        establishmentName: d.establecimientoNombre ?? "",
        startedAt: d.iniciadaEn ?? "",
        endedAt: d.finalizadaEn ?? null,
        totalRecaudado: d.ingresosSesion ?? 0,
        totalCanciones: d.cancionesTotales ?? 0,
        duracionMinutos: d.duracionMinutos ?? 0,
        status: d.estado === "activa" ? "active" : "ended",
      };
    });

    res.json(sesiones);
  } catch {
    // If collection doesn't exist yet, return empty
    res.json([]);
  }
});

export default router;
