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

  try {
    const { id } = await params;
    const docRef = adminDb().collection("Negocios").doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: "Negocio no encontrado." },
        { status: 404 },
      );
    }

    // Stub: In production this would handle file upload to Cloud Storage
    const fotoUrl = `https://storage.vibrra.co/negocios/${id}/foto.jpg`;
    await docRef.update({ fotoUrl });
    return NextResponse.json({ fotoUrl });
  } catch (err) {
    console.error("POST /api/negocios/[id]/foto error:", err);
    return NextResponse.json(
      { error: "Error al subir foto." },
      { status: 500 },
    );
  }
}
