/**
 * Cloud Function: registrarAnfitrion
 * Se ejecuta al completar el onboarding de un nuevo anfitrión.
 * Crea el documento del anfitrión con estado financiero inicial
 * y registra el bono de arranque como movimiento.
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {
  BONO_ARRANQUE,
  SUSCRIPCION_MONTO,
} from "../constants/negocio.js";
import type {MovimientoDoc} from "../constants/negocio.js";
import {proximaLiquidacion} from "../helpers/negocio.js";

interface RegistrarAnfitrionData {
  anfitrionId: string;
  nombreBar: string;
  ciudad: string;
}

export const registrarAnfitrion = onCall(
  {maxInstances: 10, region: "us-central1"},
  async (request) => {
    const {anfitrionId, nombreBar, ciudad} = request.data as RegistrarAnfitrionData;

    if (!anfitrionId || !nombreBar || !ciudad) {
      throw new HttpsError("invalid-argument", "Faltan campos requeridos.");
    }

    const db = getFirestore();
    const anfRef = db.collection("Anfitriones").doc(anfitrionId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(anfRef);
      if (snap.exists) {
        throw new HttpsError("already-exists", "El anfitrión ya está registrado.");
      }

      // Crear documento del anfitrión
      tx.set(anfRef, {
        tipo: "anfitrion",
        nombre_bar: nombreBar,
        ciudad,

        // Acumulados del mes en curso
        recaudo_mes: 0,
        comisiones_mes: 0,
        participacion_mes: 0,

        // Bono de arranque
        bono_arranque_saldo: BONO_ARRANQUE,
        bono_arranque_usado: 0,

        // Suscripción
        suscripcion_activa: true,
        suscripcion_monto: SUSCRIPCION_MONTO,

        // Liquidación
        liquidacion_estado: "pendiente",
        liquidacion_fecha: proximaLiquidacion(),
        liquidacion_deuda: 0,

        // Metadatos
        fecha_registro: FieldValue.serverTimestamp(),
        ultimo_acceso: FieldValue.serverTimestamp(),
      });

      // Registrar movimiento del bono de arranque
      const movRef = db.collection("Movimientos").doc();
      const mov: Omit<MovimientoDoc, "timestamp"> & { timestamp: FieldValue } = {
        anfitrion_id: anfitrionId,
        cliente_id: null,
        sesion_id: null,
        tipo: "BONO_ARRANQUE",
        categoria: "BONO",
        monto: BONO_ARRANQUE,
        comision: 0,
        participacion: 0,
        recaudo_post: 0,
        comisiones_post: 0,
        participacion_post: 0,
        descripcion: "Bono de arranque VIBRRA — crédito inicial para operar",
        timestamp: FieldValue.serverTimestamp(),
        creado_por: "sistema",
      };
      tx.set(movRef, mov);
    });

    return {ok: true, bonoAcreditado: BONO_ARRANQUE};
  },
);
