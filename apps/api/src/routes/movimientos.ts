import { Router } from "express";
import { adminDb } from "../config/firebase-admin.js";

const router = Router();

const SUSCRIPCION_MONTO = 15_000;

/**
 * Map a Firestore movement doc (old or new format) to the
 * Movimiento shape the dashboard expects.
 */
function mapMovimiento(id: string, d: Record<string, any>) {
  // New format fields (written by Cloud Functions v2)
  if (d.categoria) {
    return {
      id,
      anfitrion_id: d.anfitrion_id ?? d.anfitrion_uid ?? "",
      cliente_id: d.cliente_id ?? null,
      sesion_id: d.sesion_id ?? null,
      tipo: d.tipo,
      categoria: d.categoria,
      monto: d.monto ?? 0,
      comision: d.comision ?? 0,
      participacion: d.participacion ?? 0,
      recaudo_post: d.recaudo_post ?? 0,
      comisiones_post: d.comisiones_post ?? 0,
      participacion_post: d.participacion_post ?? 0,
      descripcion: d.descripcion ?? "",
      timestamp: d.timestamp ?? d.fecha ?? new Date().toISOString(),
      creado_por: d.creado_por ?? "sistema",
    };
  }

  // Old format: map legacy fields to new shape
  return {
    id,
    anfitrion_id: d.anfitrion_uid ?? "",
    cliente_id: null,
    sesion_id: null,
    tipo: d.tipo ?? "AJUSTE_ADMIN",
    categoria: "BONO" as const,
    monto: d.bruto ?? d.neto ?? d.monto ?? 0,
    comision: 0,
    participacion: 0,
    recaudo_post: 0,
    comisiones_post: 0,
    participacion_post: 0,
    descripcion: d.subtitulo ?? d.titulo ?? d.descripcion ?? "",
    timestamp: d.fecha ?? d.timestamp ?? new Date().toISOString(),
    creado_por: "sistema",
  };
}

// ---- GET /movimientos ----
router.get("/", async (req, res) => {
  try {
    const uid = req.uid!;
    const page = Math.max(1, parseInt(req.query["page"] as string) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query["pageSize"] as string) || 20));
    const categoriaFilter = req.query["categoria"] as string | undefined;

    // Try new field name first, fall back to old
    let snap;
    try {
      snap = await adminDb()
        .collection("Movimientos")
        .where("anfitrion_id", "==", uid)
        .orderBy("timestamp", "desc")
        .get();
    } catch {
      snap = await adminDb()
        .collection("Movimientos")
        .where("anfitrion_uid", "==", uid)
        .orderBy("fecha", "desc")
        .get();
    }

    let all = snap.docs.map((doc) => mapMovimiento(doc.id, doc.data()));

    // Filter by categoria if provided
    if (categoriaFilter) {
      all = all.filter((m) => m.categoria === categoriaFilter);
    }

    const total = all.length;
    const start = (page - 1) * pageSize;
    const items = all.slice(start, start + pageSize);

    res.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    });
  } catch {
    res.json({ items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 });
  }
});

// ---- GET /movimientos/resumen ----
router.get("/resumen", async (req, res) => {
  try {
    const uid = req.uid!;
    const userSnap = await adminDb().collection("Anfitriones").doc(uid).get();
    const d = userSnap.exists ? userSnap.data()! : {};

    // Read new credit model fields, fall back to old fields
    const recaudoMes = d.recaudo_mes ?? 0;
    const comisionesMes = d.comisiones_mes ?? 0;
    const participacionMes = d.participacion_mes ?? 0;
    const suscripcionMonto = SUSCRIPCION_MONTO;

    // Bono de arranque: new fields → old fallback
    const bonoArranqueSaldo = d.bono_arranque_saldo ?? d.saldoBono ?? 0;
    const bonoArranqueUsado = d.bono_arranque_usado ?? 0;

    // Derived values (same formulas as Cloud Functions)
    const gananciaDigital = comisionesMes + participacionMes;
    const gananciaNeta = gananciaDigital - suscripcionMonto;
    const deudaBruta = recaudoMes + suscripcionMonto + (d.liquidacion_deuda ?? 0);
    const efectivoAEntregar = Math.max(0, deudaBruta - gananciaDigital);
    const efectivoAQuedarse = Math.max(0, gananciaDigital - suscripcionMonto);

    const liquidacionEstado = d.liquidacion_estado ?? "pendiente";
    const liquidacionDeuda = d.liquidacion_deuda ?? 0;
    const liquidacionFecha = d.liquidacion_fecha ?? null;

    res.json({
      recaudoMes,
      comisionesMes,
      participacionMes,
      gananciaDigital,
      gananciaNeta,
      suscripcionMonto,
      deudaBruta,
      efectivoAEntregar,
      efectivoAQuedarse,
      bonoArranqueSaldo,
      bonoArranqueUsado,
      liquidacionEstado,
      liquidacionDeuda,
      liquidacionFecha,
    });
  } catch {
    res.json({
      recaudoMes: 0,
      comisionesMes: 0,
      participacionMes: 0,
      gananciaDigital: 0,
      gananciaNeta: -SUSCRIPCION_MONTO,
      suscripcionMonto: SUSCRIPCION_MONTO,
      deudaBruta: 0,
      efectivoAEntregar: 0,
      efectivoAQuedarse: 0,
      bonoArranqueSaldo: 0,
      bonoArranqueUsado: 0,
      liquidacionEstado: "pendiente",
      liquidacionDeuda: 0,
      liquidacionFecha: null,
    });
  }
});

// ---- GET /movimientos/chart ----
router.get("/chart", (_req, res) => {
  res.json({ data: [], period: _req.query["period"] ?? "7d" });
});

// ---- GET /movimientos/exportar ----
router.get("/exportar", async (req, res) => {
  try {
    const uid = req.uid!;
    let snap;
    try {
      snap = await adminDb()
        .collection("Movimientos")
        .where("anfitrion_id", "==", uid)
        .orderBy("timestamp", "desc")
        .get();
    } catch {
      snap = await adminDb()
        .collection("Movimientos")
        .where("anfitrion_uid", "==", uid)
        .orderBy("fecha", "desc")
        .get();
    }

    const headers = "id,tipo,categoria,descripcion,fecha,monto,comision";
    const rows = snap.docs.map((doc) => {
      const m = mapMovimiento(doc.id, doc.data());
      return [m.id, m.tipo, m.categoria, `"${m.descripcion}"`, m.timestamp, m.monto, m.comision].join(",");
    });

    const csv = [headers, ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=movimientos.csv");
    res.send(csv);
  } catch {
    res.setHeader("Content-Type", "text/csv");
    res.send("id,tipo,categoria,descripcion,fecha,monto,comision\n");
  }
});

export default router;
