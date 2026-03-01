import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminDb } from "@/lib/api/firebase-admin";
import { verifyAuth } from "@/lib/api/auth";

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  try {
    const snap = await adminDb()
      .collection("Sesiones")
      .where("hostUid", "==", uid)
      .orderBy("iniciadaEn", "desc")
      .limit(3)
      .get();

    if (snap.empty) {
      return NextResponse.json([]);
    }

    const sesiones = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        establishmentName: d.establecimientoNombre ?? "",
        startedAt: d.iniciadaEn ?? "",
        endedAt: d.finalizadaEn ?? null,
        totalRecaudado: d.ingresosSesion ?? 0,
        totalCanciones: d.cancionesTotales ?? 0,
        duracionMinutos: d.duracionMinutos ?? 0,
        status: d.estado === "activa" ? "active" : "ended",
      };
    });

    return NextResponse.json(sesiones);
  } catch {
    return NextResponse.json([]);
  }
}
