import { Router } from "express";
import { adminDb } from "../config/firebase-admin.js";

const router = Router();

// ---- GET /movimientos ----
router.get("/", async (req, res) => {
  try {
    const uid = req.uid!;
    const page = Math.max(1, parseInt(req.query["page"] as string) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query["pageSize"] as string) || 10));

    const snap = await adminDb()
      .collection("Movimientos")
      .where("anfitrion_uid", "==", uid)
      .orderBy("fecha", "desc")
      .get();

    const all = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const total = all.length;
    const start = (page - 1) * pageSize;
    const data = all.slice(start, start + pageSize);

    res.json({
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch {
    // Collection may not exist yet
    res.json({ data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 });
  }
});

// ---- GET /movimientos/resumen ----
router.get("/resumen", async (req, res) => {
  try {
    const uid = req.uid!;
    const userSnap = await adminDb().collection("Anfitriones").doc(uid).get();
    const userData = userSnap.exists ? userSnap.data()! : {};

    const saldoReal = userData.saldoReal ?? 0;
    const saldoBono = userData.saldoBono ?? 0;

    res.json({
      saldoDisponible: saldoReal + saldoBono,
      totalIngresos: saldoReal,
      totalRetiros: 0,
      totalBonificaciones: saldoBono,
      totalComisiones: 0,
      pendientePago: 0,
      ultimoRetiro: null,
    });
  } catch {
    res.json({
      saldoDisponible: 0,
      totalIngresos: 0,
      totalRetiros: 0,
      totalBonificaciones: 0,
      totalComisiones: 0,
      pendientePago: 0,
      ultimoRetiro: null,
    });
  }
});

// ---- GET /movimientos/chart ----
router.get("/chart", (req, res) => {
  // No real session data yet — return empty chart
  res.json({ data: [], period: req.query["period"] ?? "7d" });
});

// ---- GET /movimientos/exportar ----
router.get("/exportar", async (req, res) => {
  try {
    const uid = req.uid!;
    const snap = await adminDb()
      .collection("Movimientos")
      .where("anfitrion_uid", "==", uid)
      .orderBy("fecha", "desc")
      .get();

    const headers = "id,tipo,titulo,subtitulo,fecha,bruto,neto";
    const rows = snap.docs.map((doc) => {
      const d = doc.data();
      return [doc.id, d.tipo, `"${d.titulo}"`, `"${d.subtitulo}"`, d.fecha, d.bruto, d.neto].join(",");
    });

    const csv = [headers, ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=movimientos.csv");
    res.send(csv);
  } catch {
    res.setHeader("Content-Type", "text/csv");
    res.send("id,tipo,titulo,subtitulo,fecha,bruto,neto\n");
  }
});

export default router;
