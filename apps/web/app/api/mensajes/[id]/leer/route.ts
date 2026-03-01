import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminDb } from "@/lib/api/firebase-admin";
import { verifyAuth } from "@/lib/api/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyAuth(req);
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  try {
    const { id } = await params;

    await adminDb()
      .collection("Anfitriones")
      .doc(uid)
      .collection("MensajesLeidos")
      .doc(id)
      .set({ leidoEn: new Date().toISOString() });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/mensajes/[id]/leer error:", err);
    return NextResponse.json(
      { error: "Error al marcar mensaje como leido." },
      { status: 500 },
    );
  }
}
