import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminRtdb, adminDb } from "@/lib/api/firebase-admin";

const MAX_CHARS = 100;
const MAX_POR_SESION = 3;

/**
 * POST /api/dedicar
 * Valida saldo, debita y crea dedicatoria en RTDB.
 *
 * Body: { visitorId, sesionId, mood, mensaje, destino, cancionId?, aliasDestinatario? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { visitorId, sesionId, mood, mensaje, destino, cancionId, aliasDestinatario } = body;

    if (!visitorId || typeof visitorId !== "string") {
      return NextResponse.json({ error: "visitorId requerido" }, { status: 400 });
    }
    if (!sesionId || typeof sesionId !== "string") {
      return NextResponse.json({ error: "sesionId requerido" }, { status: 400 });
    }

    // Validar mensaje
    if (!mensaje || typeof mensaje !== "string" || mensaje.trim().length === 0 || [...mensaje].length > MAX_CHARS) {
      return NextResponse.json({ error: "Mensaje inválido", code: "mensaje-invalido" }, { status: 400 });
    }

    // Validar destino
    const destinosValidos = ["sala", "cancion", "persona"];
    if (!destinosValidos.includes(destino)) {
      return NextResponse.json({ error: "Destino inválido" }, { status: 400 });
    }

    // Validar alias si destino == persona
    if (destino === "persona" && (!aliasDestinatario || aliasDestinatario.trim().length === 0)) {
      return NextResponse.json({ error: "Alias requerido", code: "alias-requerido" }, { status: 400 });
    }

    const rtdb = adminRtdb();

    // Verificar sesión activa + no MANUAL
    const [activaSnap, estadoSnap] = await Promise.all([
      rtdb.ref(`sesiones/${sesionId}/activa`).get(),
      rtdb.ref(`sesiones/${sesionId}/estado_reproductor`).get(),
    ]);
    if (activaSnap.val() !== true || estadoSnap.val() === "MANUAL") {
      return NextResponse.json({ error: "Sesión inactiva", code: "sesion-inactiva" }, { status: 400 });
    }

    // Leer precio_dedicatoria del establecimiento
    const db = adminDb();
    const estDoc = await db.collection("Negocios").doc(sesionId).get();
    const costo = estDoc.exists ? (estDoc.data()?.precio_dedicatoria ?? 10000) : 10000;

    // Verificar límite de dedicatorias por sesión (en RTDB)
    const dedsSnap = await rtdb.ref(`sesiones/${sesionId}/dedicatorias`).get();
    if (dedsSnap.exists()) {
      const deds = dedsSnap.val();
      const misDedsCount = Object.values(deds).filter(
        (d: any) => d.cliente_id === visitorId
      ).length;
      if (misDedsCount >= MAX_POR_SESION) {
        return NextResponse.json({ error: "Límite alcanzado", code: "limite-alcanzado" }, { status: 400 });
      }
    }

    // Leer saldo y alias del anónimo desde RTDB
    const anonSnap = await rtdb.ref(`Anonimos/${visitorId}`).get();
    const anonData = anonSnap.val() ?? {};
    const saldoActual = anonData.saldo ?? 0;
    const aliasEmisor = anonData.alias || "anónimo";

    if (saldoActual < costo) {
      return NextResponse.json({ error: "Saldo insuficiente", code: "saldo-insuficiente" }, { status: 400 });
    }

    // Debitar saldo
    const nuevoSaldo = saldoActual - costo;
    await rtdb.ref(`Anonimos/${visitorId}/saldo`).set(nuevoSaldo);

    // Crear dedicatoria en RTDB
    const dedRef = rtdb.ref(`sesiones/${sesionId}/dedicatorias`).push();
    await dedRef.set({
      cliente_id: visitorId,
      alias_emisor: aliasEmisor,
      mood,
      mensaje: mensaje.trim(),
      destino,
      cancion_id: cancionId ?? null,
      alias_destinatario: aliasDestinatario?.trim() ?? null,
      costo,
      duracion_segundos: 8,
      estado: "pending",
      creado_en: Date.now(),
    });

    return NextResponse.json({ dedicatoriaId: dedRef.key });
  } catch {
    return NextResponse.json({ error: "Error al enviar dedicatoria" }, { status: 500 });
  }
}
