import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminDb } from "@/lib/api/firebase-admin";
import { verifyAuth } from "@/lib/api/auth";

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  try {
    const snap = await adminDb().collection("Anfitriones").doc(uid).get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: "Perfil no encontrado." },
        { status: 404 },
      );
    }

    const data = snap.data()!;

    const registroCompleto = !!(
      data.nombres &&
      data.apellidos &&
      data.celular &&
      data.banco &&
      data.numero_cuenta
    );

    const saldoBono = data.saldoBono ?? 0;
    const bonoReclamado = data.bonoReclamado === true;

    if (bonoReclamado) {
      return NextResponse.json(
        { error: "El bono ya fue reclamado." },
        { status: 400 },
      );
    }

    if (!registroCompleto) {
      return NextResponse.json(
        { error: "Completa tu registro para reclamar el bono." },
        { status: 400 },
      );
    }

    if (saldoBono <= 0) {
      return NextResponse.json(
        { error: "No tienes bono disponible." },
        { status: 400 },
      );
    }

    await adminDb().collection("Anfitriones").doc(uid).update({
      bonoReclamado: true,
      bonoReclamadoEn: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, saldoBono });
  } catch (err) {
    console.error("POST /api/perfil/reclamar-bono error:", err);
    return NextResponse.json(
      { error: "Error al reclamar bono." },
      { status: 500 },
    );
  }
}
