/**
 * Cloud Function: registrarGastoSesion
 * Se ejecuta cuando un cliente gasta en sesión (puja, nominación, conexión, etc.).
 * El anfitrión recibe el 70% del gasto como participación.
 * Performance critical — se llama en cada acción de sesión.
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import type {MovimientoDoc} from "../constants/negocio.js";
import {calcularParticipacion} from "../helpers/negocio.js";

interface RegistrarGastoData {
  anfitrionId: string;
  clienteId: string;
  sesionId: string;
  monto: number;
  concepto: string;
}

export const registrarGastoSesion = onCall(
  {maxInstances: 10, region: "us-central1"},
  async (request) => {
    const {anfitrionId, clienteId, sesionId, monto, concepto} = request.data as RegistrarGastoData;

    if (!anfitrionId || !clienteId || !sesionId || !monto || !concepto) {
      throw new HttpsError("invalid-argument", "Faltan campos requeridos.");
    }

    if (monto <= 0) {
      throw new HttpsError("invalid-argument", "El monto debe ser positivo.");
    }

    const participacion = calcularParticipacion(monto);
    const db = getFirestore();
    const anfRef = db.collection("Anfitriones").doc(anfitrionId);
    const cliRef = db.collection("Usuarios").doc(clienteId);

    let participacionAcumulada = 0;

    await db.runTransaction(async (tx) => {
      const [anfSnap, cliSnap] = await Promise.all([
        tx.get(anfRef),
        tx.get(cliRef),
      ]);

      if (!anfSnap.exists) {
        throw new HttpsError("not-found", "Anfitrión no encontrado.");
      }
      if (!cliSnap.exists) {
        throw new HttpsError("not-found", "Cliente no encontrado.");
      }

      const cli = cliSnap.data()!;
      if ((cli.saldo ?? 0) < monto) {
        throw new HttpsError("failed-precondition", "Saldo insuficiente.");
      }

      const anf = anfSnap.data()!;
      const nuevaParticipacion = (anf.participacion_mes ?? 0) + participacion;
      participacionAcumulada = nuevaParticipacion;

      // Descontar saldo del cliente
      tx.update(cliRef, {
        saldo: (cli.saldo ?? 0) - monto,
        ultima_sesion_id: sesionId,
      });

      // Acumular participación del anfitrión
      tx.update(anfRef, {
        participacion_mes: nuevaParticipacion,
      });

      // Registrar movimiento
      const mov: Omit<MovimientoDoc, "timestamp"> & { timestamp: FieldValue } = {
        anfitrion_id: anfitrionId,
        cliente_id: clienteId,
        sesion_id: sesionId,
        tipo: "PARTICIPACION_SESION",
        categoria: "INGRESO",
        monto,
        comision: 0,
        participacion,
        recaudo_post: anf.recaudo_mes ?? 0,
        comisiones_post: anf.comisiones_mes ?? 0,
        participacion_post: nuevaParticipacion,
        descripcion: `${concepto} · ···${clienteId.slice(-4).toUpperCase()} · sesión ${sesionId}`,
        timestamp: FieldValue.serverTimestamp(),
        creado_por: "cloud_function",
      };
      tx.set(db.collection("Movimientos").doc(), mov);
    });

    return {ok: true, participacionAcumulada};
  },
);
