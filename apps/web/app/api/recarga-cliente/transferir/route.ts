/**
 * POST /api/recarga-cliente/transferir
 *
 * Recarga saldo a un cliente (anónimo o registrado).
 * El QR del cliente incluye un prefijo que indica el tipo:
 *   - "anon:{visitorId}"   → saldo en RTDB  Anonimos/{visitorId}
 *   - "client:{clienteId}" → saldo en Firestore Clientes/{clienteId}
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminDb, adminRtdb } from "@/lib/api/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { verifyAuth } from "@/lib/api/auth";
import { getPaisConfig } from "@/lib/api/pais-config";

/* ── Helpers ─────────────────────────────────────────────── */

type ClienteTipo = "anon" | "client";

function parseClienteId(raw: string): { tipo: ClienteTipo; id: string } | null {
  if (raw.startsWith("anon:")) return { tipo: "anon", id: raw.slice(5) };
  if (raw.startsWith("client:")) return { tipo: "client", id: raw.slice(7) };
  return null;
}

/* ── Route ───────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (auth instanceof NextResponse) return auth;
  const anfitrionId = auth;

  try {
    const { clienteId: rawClienteId, montoId, modoId } = (await req.json()) as {
      clienteId: string;
      montoId: string;
      modoId: string;
    };

    if (!rawClienteId || !montoId || !modoId) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: clienteId, montoId, modoId." },
        { status: 400 },
      );
    }

    const parsed = parseClienteId(rawClienteId);
    if (!parsed) {
      return NextResponse.json(
        { error: "Formato de clienteId inválido. Use anon:{id} o client:{id}." },
        { status: 400 },
      );
    }

    const { tipo: clienteTipo, id: clienteId } = parsed;

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

    const monto = recarga.montos.find((m: { id: string }) => m.id === montoId);
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

    /* ── Acreditar saldo según tipo de cliente ─────────── */

    let clienteNombre = "Cliente";

    if (clienteTipo === "anon") {
      // Anónimo → RTDB Anonimos/{visitorId}
      const rtdb = adminRtdb();
      const anonRef = rtdb.ref(`Anonimos/${clienteId}`);
      const anonSnap = await anonRef.get();

      if (!anonSnap.exists()) {
        return NextResponse.json(
          { error: "Cliente anónimo no encontrado." },
          { status: 404 },
        );
      }

      const anonData = anonSnap.val();
      clienteNombre = anonData.alias ?? "Anónimo";
      const saldoActual = anonData.saldo ?? 0;

      await anonRef.update({
        saldo: saldoActual + monto.valor,
        "bonos/nominacionesGratis": (anonData.bonos?.nominacionesGratis ?? 0) + (bonos.canciones ?? 0),
        "bonos/conexionesGratis": (anonData.bonos?.conexionesGratis ?? 0) + (bonos.conexiones ?? 0),
      });
    } else {
      // Registrado → Firestore Clientes/{clienteId}
      const clienteRef = db.collection("Clientes").doc(clienteId);
      const cliSnap = await clienteRef.get();
      const cliData = cliSnap.exists ? cliSnap.data()! : {};
      clienteNombre = cliData.nombre ?? cliData.displayName ?? "Cliente";

      await clienteRef.set(
        {
          saldo: FieldValue.increment(monto.valor),
          bonos_canciones: FieldValue.increment(bonos.canciones),
          bonos_conexiones: FieldValue.increment(bonos.conexiones),
        },
        { merge: true },
      );
    }

    /* ── Actualizar anfitrión + movimientos (Firestore tx) */

    const resultado = await db.runTransaction(async (tx) => {
      const anfSnap = await tx.get(anfitrionRef);
      if (!anfSnap.exists) throw new Error("Anfitrion no encontrado.");

      const anf = anfSnap.data()!;

      const bonoDisponible = anf.bono_arranque_saldo ?? 0;
      const desdeBono = Math.min(bonoDisponible, montoTotal);

      const tipoRecarga = desdeBono === montoTotal
        ? "RECARGA_CLIENTE_BONO" as const
        : "RECARGA_CLIENTE" as const;
      const categoriaRec = desdeBono === montoTotal
        ? "RECAUDO_BONO" as const
        : "RECAUDO" as const;

      const nuevoRecaudo = (anf.recaudo_mes ?? 0) + montoTotal;
      const nuevasComisiones = (anf.comisiones_mes ?? 0) + comision;
      const participacionActual = anf.participacion_mes ?? 0;

      tx.update(anfitrionRef, {
        recaudo_mes: nuevoRecaudo,
        comisiones_mes: nuevasComisiones,
        bono_arranque_saldo: bonoDisponible - desdeBono,
        bono_arranque_usado: (anf.bono_arranque_usado ?? 0) + desdeBono,
        ultimo_acceso: FieldValue.serverTimestamp(),
      });

      // Movimiento de recarga
      const movRecargaRef = db.collection("Movimientos").doc();
      tx.set(movRecargaRef, {
        anfitrion_id: anfitrionId,
        cliente_id: rawClienteId,
        cliente_tipo: clienteTipo,
        sesion_id: null,
        tipo: tipoRecarga,
        categoria: categoriaRec,
        monto: montoTotal,
        comision: 0,
        participacion: 0,
        recaudo_post: nuevoRecaudo,
        comisiones_post: nuevasComisiones,
        participacion_post: participacionActual,
        descripcion: `Recarga ${clienteTipo === "anon" ? "anón" : "cliente"} ···${clienteId.slice(-4).toUpperCase()} · ${monto.etiqueta} · Modo ${modoId} · 🎵×${bonos.canciones} 🔌×${bonos.conexiones}`,
        timestamp: FieldValue.serverTimestamp(),
        creado_por: "cloud_function",
      });

      // Movimiento de comisión
      const movComisionRef = db.collection("Movimientos").doc();
      tx.set(movComisionRef, {
        anfitrion_id: anfitrionId,
        cliente_id: rawClienteId,
        cliente_tipo: clienteTipo,
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
