/**
 * Cloud Function: cerrarLiquidacionMensual
 * Cron: día 1 de cada mes a las 00:00 (Bogotá).
 * Calcula liquidación, resetea acumulados, genera
 * movimientos de liquidación.
 */

import {
  onSchedule,
} from "firebase-functions/v2/scheduler";
import {
  getFirestore,
  FieldValue,
} from "firebase-admin/firestore";
import {SUSCRIPCION_MONTO} from "../constants/negocio.js";
import type {MovimientoDoc} from "../constants/negocio.js";
import {
  calcularLiquidacion,
  proximaLiquidacion,
  formatCOP,
} from "../helpers/negocio.js";
import * as logger from "firebase-functions/logger";

type MovDoc = Omit<MovimientoDoc, "timestamp"> & {
  timestamp: FieldValue;
};

export const cerrarLiquidacionMensual = onSchedule(
  {
    schedule: "0 0 1 * *",
    timeZone: "America/Bogota",
    maxInstances: 1,
    region: "us-central1",
  },
  async () => {
    const db = getFirestore();

    const snapshot = await db
      .collection("Anfitriones")
      .where("tipo", "==", "anfitrion")
      .where("suscripcion_activa", "==", true)
      .get();

    logger.info(
      `Liquidación: ${snapshot.size} anfitriones.`,
    );

    let procesados = 0;
    let errores = 0;

    for (const doc of snapshot.docs) {
      try {
        await procesarLiquidacion(db, doc);
        procesados++;
      } catch (error) {
        errores++;
        logger.error(
          `Error liquidando ${doc.id}:`, error,
        );
      }
    }

    logger.info(
      `Completado: ${procesados} ok, ${errores} err.`,
    );
  },
);

/**
 * Procesa la liquidación de un anfitrión.
 * @param {FirebaseFirestore.Firestore} db Firestore.
 * @param {FirebaseFirestore.QueryDocumentSnapshot} anfDoc
 *   Snapshot del anfitrión.
 * @return {Promise<void>}
 */
async function procesarLiquidacion(
  db: FirebaseFirestore.Firestore,
  anfDoc: FirebaseFirestore.QueryDocumentSnapshot,
): Promise<void> {
  const anfRef = anfDoc.ref;

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(anfRef);
    const anf = snap.data() ?? {};

    const liq = calcularLiquidacion({
      recaudo_mes: anf.recaudo_mes ?? 0,
      comisiones_mes: anf.comisiones_mes ?? 0,
      participacion_mes: anf.participacion_mes ?? 0,
      suscripcion_monto:
        anf.suscripcion_monto ?? SUSCRIPCION_MONTO,
      liquidacion_deuda:
        anf.liquidacion_deuda ?? 0,
    });

    const suspender =
      liq.nuevaDeuda > SUSCRIPCION_MONTO * 2;
    const nuevoEstado =
      liq.nuevaDeuda > 0 ? "mora" : "pagado";

    tx.update(anfRef, {
      recaudo_mes: 0,
      comisiones_mes: 0,
      participacion_mes: 0,
      liquidacion_estado: nuevoEstado,
      liquidacion_deuda: liq.nuevaDeuda,
      liquidacion_fecha: proximaLiquidacion(),
      ...(suspender ? {suscripcion_activa: false} : {}),
    });

    const ahora = FieldValue.serverTimestamp();
    const recMes = anf.recaudo_mes ?? 0;
    const ganDig =
      (anf.comisiones_mes ?? 0) +
      (anf.participacion_mes ?? 0);

    const descCobro =
      `Liquidación · Rec: ${formatCOP(recMes)}` +
      ` · Gan: ${formatCOP(ganDig)}` +
      ` · Entrega: ${formatCOP(liq.efectivoAEntregar)}`;

    const movCobro: MovDoc = {
      anfitrion_id: anfDoc.id,
      cliente_id: null,
      sesion_id: null,
      tipo: "LIQUIDACION_COBRO",
      categoria: "LIQUIDACION",
      monto: liq.efectivoAEntregar,
      comision: 0,
      participacion: 0,
      recaudo_post: 0,
      comisiones_post: 0,
      participacion_post: 0,
      descripcion: descCobro,
      timestamp: ahora,
      creado_por: "sistema",
    };
    tx.set(
      db.collection("Movimientos").doc(),
      movCobro,
    );

    const suscMonto =
      anf.suscripcion_monto ?? SUSCRIPCION_MONTO;
    const movSusc: MovDoc = {
      anfitrion_id: anfDoc.id,
      cliente_id: null,
      sesion_id: null,
      tipo: "LIQUIDACION_SUSCRIPCION",
      categoria: "LIQUIDACION",
      monto: suscMonto,
      comision: 0,
      participacion: 0,
      recaudo_post: 0,
      comisiones_post: 0,
      participacion_post: 0,
      descripcion: "Suscripción mensual VIBRRA",
      timestamp: ahora,
      creado_por: "sistema",
    };
    tx.set(
      db.collection("Movimientos").doc(),
      movSusc,
    );

    if (liq.nuevaDeuda > 0) {
      const descDeuda =
        "Deuda arrastrada: " +
        formatCOP(liq.nuevaDeuda);
      const movDeuda: MovDoc = {
        anfitrion_id: anfDoc.id,
        cliente_id: null,
        sesion_id: null,
        tipo: "LIQUIDACION_DEUDA",
        categoria: "LIQUIDACION",
        monto: liq.nuevaDeuda,
        comision: 0,
        participacion: 0,
        recaudo_post: 0,
        comisiones_post: 0,
        participacion_post: 0,
        descripcion: descDeuda,
        timestamp: ahora,
        creado_por: "sistema",
      };
      tx.set(
        db.collection("Movimientos").doc(),
        movDeuda,
      );
    }
  });
}
