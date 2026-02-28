import { Router } from "express";
import { adminDb } from "../config/firebase-admin.js";

const router = Router();

// ---- GET /debug ---- (TEMPORARY - remove before production)
router.get("/", async (req, res) => {
  try {
    const uid = req.uid!;

    // 0. List all root collections
    const collections = await adminDb().listCollections();
    const collectionNames = collections.map((c) => c.id);

    // 1. Check user profile
    const userSnap = await adminDb().collection("Anfitriones").doc(uid).get();

    // 2. Check negocios
    const negSnap = await adminDb()
      .collection("Negocios")
      .where("anfitrionId", "==", uid)
      .get();

    // 3. Check sesiones
    const sesSnap = await adminDb()
      .collection("Sesiones")
      .where("hostUid", "==", uid)
      .limit(5)
      .get();

    // 4. Check movimientos
    const movSnap = await adminDb()
      .collection("Movimientos")
      .where("anfitrion_uid", "==", uid)
      .limit(5)
      .get();

    // 5. List ALL docs in Anfitrion collection
    const allAnfitriones = await adminDb().collection("Anfitriones").limit(10).get();
    // Also check Usuarios collection (legacy)
    const allUsuarios = await adminDb().collection("Usuarios").limit(10).get();

    res.json({
      uid,
      firestoreCollections: collectionNames,
      usuario: userSnap.exists
        ? { exists: true, fields: Object.keys(userSnap.data()!), data: userSnap.data() }
        : { exists: false },
      allAnfitrionDocs: allAnfitriones.docs.map((d) => ({ id: d.id, fields: Object.keys(d.data()) })),
      allUsuariosDocs: allUsuarios.docs.map((d) => ({ id: d.id, fields: Object.keys(d.data()) })),
      negocios: negSnap.docs.map((d) => ({ id: d.id, fields: Object.keys(d.data()), data: d.data() })),
      sesiones: sesSnap.docs.map((d) => ({ id: d.id, fields: Object.keys(d.data()), data: d.data() })),
      movimientos: movSnap.docs.map((d) => ({ id: d.id, fields: Object.keys(d.data()), data: d.data() })),
    });
  } catch (err: any) {
    console.error("DEBUG error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
