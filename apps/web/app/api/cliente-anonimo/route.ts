import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminDb, adminRtdb } from "@/lib/api/firebase-admin";

const SALDO_INICIAL = 2000;

/**
 * POST /api/cliente-anonimo
 * Registra un cliente anónimo en Firestore (Anonimos/{fingerprint})
 * y RTDB (Anonimos/{fingerprint}) si no existe.
 *
 * Body: { visitorId: string, estId: string, alias?: string }
 * Returns: { saldo, bonos, isNew }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { visitorId, estId, alias } = body;

    if (!visitorId || typeof visitorId !== "string") {
      return NextResponse.json({ error: "visitorId requerido" }, { status: 400 });
    }

    const db = adminDb();
    const rtdb = adminRtdb();

    // Verificar si ya existe en Firestore
    const docRef = db.collection("Anonimos").doc(visitorId);
    const doc = await docRef.get();

    if (doc.exists) {
      // Ya existe — leer saldo actual de RTDB
      const snap = await rtdb.ref(`Anonimos/${visitorId}`).get();
      const data = snap.val() ?? {};
      return NextResponse.json({
        saldo: data.saldo ?? 0,
        bonos: data.bonos ?? { conexionesGratis: 0, nominacionesGratis: 0 },
        isNew: false,
      });
    }

    // Nuevo cliente anónimo
    const now = Date.now();
    const bonos = { conexionesGratis: 1, nominacionesGratis: 0 };

    // Crear en Firestore (Anonimos/{fingerprint})
    await docRef.set({
      alias: alias || "",
      saldo: SALDO_INICIAL,
      bonos,
      primer_establecimiento: estId || null,
      fecha_registro: new Date(),
    });

    // Crear en RTDB (Anonimos/{fingerprint})
    await rtdb.ref(`Anonimos/${visitorId}`).set({
      alias: alias || "",
      saldo: SALDO_INICIAL,
      bonos,
      created_at: now,
    });

    return NextResponse.json({
      saldo: SALDO_INICIAL,
      bonos,
      isNew: true,
    });
  } catch {
    return NextResponse.json({ error: "Error registrando cliente" }, { status: 500 });
  }
}
