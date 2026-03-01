import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminDb } from "@/lib/api/firebase-admin";
import { verifyAuth } from "@/lib/api/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyAuth(req);
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  try {
    const { id } = await params;

    const ref = adminDb()
      .collection("Anfitriones")
      .doc(uid)
      .collection("Mensajes")
      .doc(id);

    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json(
        { error: "Mensaje no encontrado." },
        { status: 404 },
      );
    }

    await ref.delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/mensajes/[id] error:", err);
    return NextResponse.json(
      { error: "Error al eliminar mensaje." },
      { status: 500 },
    );
  }
}
