import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminDb } from "@/lib/api/firebase-admin";
import { verifyAuth } from "@/lib/api/auth";

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  try {
    const snap = await adminDb().collection("Anfitriones").doc(uid).get();

    if (!snap.exists) {
      return NextResponse.json({ saldo: 0, saldoBono: 0 });
    }

    const data = snap.data()!;
    return NextResponse.json({
      saldo: data.saldoReal ?? 0,
      saldoBono: data.saldoBono ?? 0,
    });
  } catch (err) {
    console.error("GET /api/perfil/saldo error:", err);
    return NextResponse.json(
      { error: "Error al obtener saldo." },
      { status: 500 },
    );
  }
}
