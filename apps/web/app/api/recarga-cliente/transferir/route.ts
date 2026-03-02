/**
 * POST /api/recarga-cliente/transferir
 * Proxy que invoca la Cloud Function recargarCliente.
 * El dashboard sigue llamando a este endpoint (patrón /api/).
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminDb } from "@/lib/api/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { verifyAuth } from "@/lib/api/auth";
import { getPaisConfig } from "@/lib/api/pais-config";

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (auth instanceof NextResponse) return auth;
  const anfitrionId = auth;

  try {
    const { clienteId, montoId, modoId } = (await req.json()) as {
      clienteId: string;
      montoId: string;
      modoId: string;
    };

    if (!clienteId || !montoId || !modoId) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: clienteId, montoId, modoId." },
        { status: 400 },
      );
    }

    const db = adminDb();
    const anfitrionRef = db.collection("Anfitriones").doc(anfitrionId);
    const anfitrionSnap = await anfitrionRef.get();
    if (!anfitrionSnap.exists) {
      return NextResponse.json(
        { error: "Anfitrion no encontrado." },
        { status: 404 },
      );
    }

    const paisCode = anfitrionSnap.data()!.pais ?? "CO";
    const paisConfig = await getPaisConfig(paisCode);
    if (!paisConfig) {
      return NextResponse.json(
        { error: `Configuracion de pais no encontrada: ${paisCode}` },
        { status: 500 },
      );
    }

    const { recarga } = paisConfig;

    const monto = recarga.montos.find((m) => m.id === montoId);
    if (!monto) {
      return NextResponse.json(
        { error: `Monto invalido: ${montoId}` },
        { status: 400 },
      );
    }

    const bonos = recarga.tablaBonos[montoId]?.[modoId];
    if (!bonos) {
      return NextResponse.json(
        { error: `Modo invalido: ${modoId}` },
        { status: 400 },
      );
    }

    const extra = modoId === "generosa" ? recarga.costoExtraGenerosa : 0;
    const montoTotal = monto.valor + extra;
    const comision = Math.round(montoTotal * 0.10);

    const clienteRef = db.collection("Usuarios").doc(clienteId);

    const resultado = await db.runTransaction(async (tx) => {
      const [anfSnap, cliSnap] = await Promise.all([
        tx.get(anfitrionRef),
        tx.get(clienteRef),
      ]);

      if (!anfSnap.exists) {
        throw new Error("Anfitrion no encontrado.");
      }

      const anf = anfSnap.data()!;
      const cliData = cliSnap.exists ? cliSnap.data()! : {};
      const clienteNombre =
        cliData.nombre ?? cliData.displayName ?? "Cliente";

      // Prioridad: consumir bono de arranque primero
      const bonoDisponible = anf.bono_arranque_saldo ?? 0;
      const desdeBono = Math.min(bonoDisponible, montoTotal);

      // Tipo de movimiento
      const tipoRecarga = desdeBono === montoTotal
        ? "RECARGA_CLIENTE_BONO" as const
        : "RECARGA_CLIENTE" as const;
      const categoriaRec = desdeBono === montoTotal
        ? "RECAUDO_BONO" as const
        : "RECAUDO" as const;

      // Nuevos acumulados
      const nuevoRecaudo = (anf.recaudo_mes ?? 0) + montoTotal;
      const nuevasComisiones = (anf.comisiones_mes ?? 0) + comision;
      const participacionActual = anf.participacion_mes ?? 0;

      // Actualizar anfitrión
      tx.update(anfitrionRef, {
        recaudo_mes: nuevoRecaudo,
        comisiones_mes: nuevasComisiones,
        bono_arranque_saldo: bonoDisponible - desdeBono,
        bono_arranque_usado: (anf.bono_arranque_usado ?? 0) + desdeBono,
        ultimo_acceso: FieldValue.serverTimestamp(),
      });

      // Actualizar o crear cliente
      tx.set(
        clienteRef,
        {
          tipo: "cliente",
          saldo: FieldValue.increment(monto.valor),
          bonos_canciones: FieldValue.increment(bonos.canciones),
          bonos_conexiones: FieldValue.increment(bonos.conexiones),
        },
        { merge: true },
      );

      // Movimiento de recarga
      const movRecargaRef = db.collection("Movimientos").doc();
      tx.set(movRecargaRef, {
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
        descripcion: `Recarga ···${clienteId.slice(-4).toUpperCase()} · ${monto.etiqueta} · Modo ${modoId} · 🎵×${bonos.canciones} 🔌×${bonos.conexiones}`,
        timestamp: FieldValue.serverTimestamp(),
        creado_por: "cloud_function",
      });

      // Movimiento de comisión
      const movComisionRef = db.collection("Movimientos").doc();
      tx.set(movComisionRef, {
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
        descripcion: `Comisión 10% sobre recarga de $${montoTotal.toLocaleString("es-CO")}`,
        timestamp: FieldValue.serverTimestamp(),
        creado_por: "cloud_function",
      });

      return {
        comisionAcumulada: nuevasComisiones,
        recaudoMes: nuevoRecaudo,
        clienteNombre,
        montoAcreditado: monto.valor,
        bonos,
        comisionEsta: comision,
      };
    });

    return NextResponse.json(resultado);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al transferir.";
    console.error("POST /api/recarga-cliente/transferir error:", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
