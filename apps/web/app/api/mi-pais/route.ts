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
    const anfitrionSnap = await adminDb()
      .collection("Anfitriones")
      .doc(uid)
      .get();
    const pais = anfitrionSnap.exists
      ? (anfitrionSnap.data()!.pais ?? "CO")
      : "CO";

    const config = await getPaisConfig(pais);
    if (!config) {
      return NextResponse.json(
        { error: `Configuracion de pais no encontrada: ${pais}` },
        { status: 404 },
      );
    }

    return NextResponse.json(config);
  } catch (err) {
    console.error("GET /api/mi-pais error:", err);
    return NextResponse.json(
      { error: "Error al obtener configuracion del pais." },
      { status: 500 },
    );
  }
}
