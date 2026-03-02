/**
 * Cloud Function: recargarCliente
 * El anfitrión escanea el QR del cliente y recarga su saldo.
 * El anfitrión opera con crédito ilimitado de VIBRRA — no se valida saldo.
 * Si tiene bono de arranque disponible, se consume primero.
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {
  MONTOS_RECARGA,
  TABLA_BONOS_CLIENTE,
  COSTO_EXTRA_GENEROSA,
} from "../constants/negocio.js";
import type {MovimientoDoc} from "../constants/negocio.js";
import {calcularComision, formatCOP} from "../helpers/negocio.js";

interface RecargarClienteData {
  anfitrionId: string;
  clienteId: string;
  montoId: string;
  modoId: string;
}

export const recargarCliente = onCall(
  {maxInstances: 10, region: "us-central1"},
  async (request) => {
    const {anfitrionId, clienteId, montoId, modoId} = request.data as RecargarClienteData;

    if (!anfitrionId || !clienteId || !montoId || !modoId) {
      throw new HttpsError("invalid-argument", "Faltan campos requeridos.");
    }

    const montoObj = MONTOS_RECARGA[montoId];
    if (!montoObj) {
      throw new HttpsError("invalid-argument", `Monto '${montoId}' no válido.`);
    }

    const bonos = TABLA_BONOS_CLIENTE[montoId]?.[modoId];
    if (!bonos) {
      throw new HttpsError("invalid-argument", `Modo '${modoId}' no válido para monto '${montoId}'.`);
    }

    const extra = modoId === "generosa" ? COSTO_EXTRA_GENEROSA : 0;
    const montoTotal = montoObj.valor + extra;
    const comision = calcularComision(montoTotal);

    const db = getFirestore();
    const anfRef = db.collection("Anfitriones").doc(anfitrionId);
    const cliRef = db.collection("Usuarios").doc(clienteId);

    let comisionAcumulada = 0;

    await db.runTransaction(async (tx) => {
      const [anfSnap, cliSnap] = await Promise.all([
        tx.get(anfRef),
        tx.get(cliRef),
      ]);

      if (!anfSnap.exists) {
        throw new HttpsError("not-found", "Anfitrión no encontrado.");
      }

      const anf = anfSnap.data()!;

      // Prioridad: consumir bono de arranque primero
      const bonoDisponible = anf.bono_arranque_saldo ?? 0;
      const desdeBono = Math.min(bonoDisponible, montoTotal);

      // Determinar tipo de movimiento
      const tipoRecarga = desdeBono === montoTotal
        ? "RECARGA_CLIENTE_BONO" as const
        : "RECARGA_CLIENTE" as const;
      const categoriaRec = desdeBono === montoTotal
        ? "RECAUDO_BONO" as const
        : "RECAUDO" as const;

      // Nuevos acumulados del anfitrión
      const nuevoRecaudo = (anf.recaudo_mes ?? 0) + montoTotal;
      const nuevasComisiones = (anf.comisiones_mes ?? 0) + comision;
      const participacionActual = anf.participacion_mes ?? 0;
      comisionAcumulada = nuevasComisiones;

      // Actualizar anfitrión
      tx.update(anfRef, {
        recaudo_mes: nuevoRecaudo,
        comisiones_mes: nuevasComisiones,
        bono_arranque_saldo: bonoDisponible - desdeBono,
        bono_arranque_usado: (anf.bono_arranque_usado ?? 0) + desdeBono,
        ultimo_acceso: FieldValue.serverTimestamp(),
      });

      // Actualizar o crear cliente
      const cliData = cliSnap.exists ? cliSnap.data()! : {};
      tx.set(cliRef, {
        tipo: "cliente",
        saldo: (cliData.saldo ?? 0) + montoObj.valor,
        bonos_canciones: (cliData.bonos_canciones ?? 0) + bonos.canciones,
        bonos_conexiones: (cliData.bonos_conexiones ?? 0) + bonos.conexiones,
        ultima_sesion_id: cliData.ultima_sesion_id ?? null,
        fecha_registro: cliData.fecha_registro ?? FieldValue.serverTimestamp(),
      }, {merge: true});

      // Movimiento de recarga
      const movRecarga: Omit<MovimientoDoc, "timestamp"> & { timestamp: FieldValue } = {
        anfitrion_id: anfitrionId,
        cliente_id: clienteId,
        sesion_id: null,
        tipo: tipoRecarga,
        categoria: categoriaRec,
        monto: montoTotal,
        comision: 0,
        participacion: 0,
        recaudo_post: nuevoRecaudo,
        comisiones_post: nuevasComisiones,
        participacion_post: participacionActual,
        descripcion: `Recarga ···${clienteId.slice(-4).toUpperCase()} · ${montoObj.etiqueta} · Modo ${modoId} · 🎵×${bonos.canciones} 🔌×${bonos.conexiones}`,
        timestamp: FieldValue.serverTimestamp(),
        creado_por: "cloud_function",
      };
      tx.set(db.collection("Movimientos").doc(), movRecarga);

      // Movimiento de comisión
      const movComision: Omit<MovimientoDoc, "timestamp"> & { timestamp: FieldValue } = {
        anfitrion_id: anfitrionId,
        cliente_id: clienteId,
        sesion_id: null,
        tipo: "COMISION_RECARGA",
        categoria: "INGRESO",
        monto: comision,
        comision,
        participacion: 0,
        recaudo_post: nuevoRecaudo,
        comisiones_post: nuevasComisiones,
        participacion_post: participacionActual,
        descripcion: `Comisión 10% sobre recarga de ${formatCOP(montoTotal)}`,
        timestamp: FieldValue.serverTimestamp(),
        creado_por: "cloud_function",
      };
      tx.set(db.collection("Movimientos").doc(), movComision);
    });

    return {ok: true, comisionAcumulada};
  },
);
