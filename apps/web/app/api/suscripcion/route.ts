import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminDb } from "@/lib/api/firebase-admin";
import { verifyAuth } from "@/lib/api/auth";
import { getPaisConfig } from "@/lib/api/pais-config";

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  try {
    const snap = await adminDb()
      .collection("Anfitriones")
      .doc(uid)
      .collection("Suscripcion")
      .doc("actual")
      .get();

    if (!snap.exists) {
      const anfitrionSnap = await adminDb()
        .collection("Anfitriones")
        .doc(uid)
        .get();
      const paisCode = anfitrionSnap.exists
        ? (anfitrionSnap.data()!.pais ?? "CO")
        : "CO";
      const paisCfg = await getPaisConfig(paisCode);

      return NextResponse.json({
        id: null,
        estado: "activa",
        precioMensual: paisCfg?.suscripcion?.precioMensual ?? 0,
        fechaInicio: null,
        fechaRenovacion: null,
        mesesPagados: 0,
      });
    }

    const data = snap.data()!;
    return NextResponse.json({
      id: snap.id,
      estado: data.estado ?? "activa",
      precioMensual: data.precioMensual ?? 0,
      fechaInicio: data.fechaInicio ?? null,
      fechaRenovacion: data.fechaRenovacion ?? null,
      mesesPagados: data.mesesPagados ?? 0,
    });
  } catch (err) {
    console.error("GET /api/suscripcion error:", err);
    return NextResponse.json(
      { error: "Error al obtener suscripcion." },
      { status: 500 },
    );
  }
}
