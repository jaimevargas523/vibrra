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

    const negociosSnap = await adminDb()
      .collection("Negocios")
      .where("anfitrionId", "==", uid)
      .get();

    const totalRecaudado = userData.saldoReal ?? 0;
    const totalSesiones = negociosSnap.docs.reduce(
      (sum, d) => sum + (d.data().totalSesiones ?? 0),
      0,
    );
    const totalCanciones = negociosSnap.docs.reduce(
      (sum, d) => sum + (d.data().totalCanciones ?? 0),
      0,
    );
    const promedioSesion =
      totalSesiones > 0 ? Math.round(totalRecaudado / totalSesiones) : 0;

    return NextResponse.json({
      totalRecaudado,
      totalSesiones,
      totalCanciones,
      promedioSesion,
      comparacionMesAnterior: {
        recaudado: 0,
        sesiones: 0,
        canciones: 0,
      },
    });
  } catch (err) {
    console.error("GET /api/resumen/kpis error:", err);
    return NextResponse.json(
      { error: "Error al obtener KPIs." },
      { status: 500 },
    );
  }
}
