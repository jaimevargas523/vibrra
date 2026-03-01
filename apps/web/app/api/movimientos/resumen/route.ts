import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminDb } from "@/lib/api/firebase-admin";
import { verifyAuth } from "@/lib/api/auth";

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  try {
    const userSnap = await adminDb().collection("Anfitriones").doc(uid).get();
    const userData = userSnap.exists ? userSnap.data()! : {};

    const saldoReal = userData.saldoReal ?? 0;
    const saldoBono = userData.saldoBono ?? 0;

    return NextResponse.json({
      saldoDisponible: saldoReal + saldoBono,
      totalIngresos: saldoReal,
      totalRetiros: 0,
      totalBonificaciones: saldoBono,
      totalComisiones: 0,
      pendientePago: 0,
      ultimoRetiro: null,
    });
  } catch {
    return NextResponse.json({
      saldoDisponible: 0,
      totalIngresos: 0,
      totalRetiros: 0,
      totalBonificaciones: 0,
      totalComisiones: 0,
      pendientePago: 0,
      ultimoRetiro: null,
    });
  }
}
