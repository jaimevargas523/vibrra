import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminDb, adminRtdb } from "@/lib/api/firebase-admin";

const COSTOS: Record<string, number> = { sala: 500, cancion: 800, persona: 1000 };
const MAX_CHARS = 100;
const MAX_POR_SESION = 3;

/**
 * POST /api/dedicar
 * Valida saldo, debita y crea dedicatoria en Firestore.
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

    // Validar destino y costo
    const costo = COSTOS[destino];
    if (!costo) {
      return NextResponse.json({ error: "Destino inválido" }, { status: 400 });
    }

    // Validar alias si destino == persona
    if (destino === "persona" && (!aliasDestinatario || aliasDestinatario.trim().length === 0)) {
      return NextResponse.json({ error: "Alias requerido", code: "alias-requerido" }, { status: 400 });
    }

    const db = adminDb();
    const rtdb = adminRtdb();

    // Verificar sesión activa en RTDB
    const sesionSnap = await rtdb.ref(`sesiones/${sesionId}/activa`).get();
    if (sesionSnap.val() !== true) {
      return NextResponse.json({ error: "Sesión inactiva", code: "sesion-inactiva" }, { status: 400 });
    }

    // Verificar límite de dedicatorias por sesión
    const dedSnap = await db
      .collection("Sesiones").doc(sesionId)
      .collection("Dedicatorias")
      .where("cliente_id", "==", visitorId)
      .get();

    if (dedSnap.size >= MAX_POR_SESION) {
      return NextResponse.json({ error: "Límite alcanzado", code: "limite-alcanzado" }, { status: 400 });
    }

    // Leer saldo del anónimo desde RTDB
    const saldoSnap = await rtdb.ref(`Anonimos/${visitorId}/saldo`).get();
    const saldoActual = saldoSnap.val() ?? 0;

    if (saldoActual < costo) {
      return NextResponse.json({ error: "Saldo insuficiente", code: "saldo-insuficiente" }, { status: 400 });
    }

    // Leer alias del anónimo
    const aliasSnap = await rtdb.ref(`Anonimos/${visitorId}/alias`).get();
    const aliasEmisor = aliasSnap.val() || "anónimo";

    // Debitar saldo en RTDB
    const nuevoSaldo = saldoActual - costo;
    await rtdb.ref(`Anonimos/${visitorId}/saldo`).set(nuevoSaldo);

    // También actualizar en Firestore
    const anonDocRef = db.collection("Anonimos").doc(visitorId);
    await anonDocRef.update({ saldo: nuevoSaldo });

    // Crear dedicatoria en Firestore
    const dedRef = db
      .collection("Sesiones").doc(sesionId)
      .collection("Dedicatorias")
      .doc();

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
      creado_en: new Date(),
    });

    // Escribir en RTDB para que la pantalla del bar la detecte
    await rtdb.ref(`sesiones/${sesionId}/dedicatorias/${dedRef.id}`).set({
      alias_emisor: aliasEmisor,
      mood,
      mensaje: mensaje.trim(),
      destino,
      cancion_id: cancionId ?? null,
      alias_destinatario: aliasDestinatario?.trim() ?? null,
      duracion_segundos: 8,
      estado: "pending",
      creado_en: Date.now(),
    });

    return NextResponse.json({ dedicatoriaId: dedRef.id });
  } catch {
    return NextResponse.json({ error: "Error al enviar dedicatoria" }, { status: 500 });
  }
}
