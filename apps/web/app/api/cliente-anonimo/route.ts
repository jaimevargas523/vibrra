import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminRtdb } from "@/lib/api/firebase-admin";

const SALDO_INICIAL = 2000;

/**
 * POST /api/cliente-anonimo
 * Registra un cliente anónimo en RTDB (Anonimos/{fingerprint}) si no existe.
 *
 * Body: { visitorId: string, estId: string }
 * Returns: { saldo, bonos, isNew }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { visitorId, estId } = body;

    if (!visitorId || typeof visitorId !== "string") {
      return NextResponse.json({ error: "visitorId requerido" }, { status: 400 });
    }

    const rtdb = adminRtdb();
    const anonRef = rtdb.ref(`Anonimos/${visitorId}`);
    const snap = await anonRef.get();

    if (snap.exists()) {
      const data = snap.val();
      return NextResponse.json({
        saldo: data.saldo ?? 0,
        bonos: data.bonos ?? { conexionesGratis: 0, nominacionesGratis: 0 },
        isNew: false,
      });
    }

    // Nuevo cliente anónimo — solo RTDB
    const bonos = { conexionesGratis: 1, nominacionesGratis: 0 };
    await anonRef.set({
      saldo: SALDO_INICIAL,
      bonos,
      primer_establecimiento: estId || null,
      created_at: Date.now(),
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
