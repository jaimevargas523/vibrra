import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminDb } from "@/lib/api/firebase-admin";
import { verifyAuth } from "@/lib/api/auth";

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const slug = req.nextUrl.searchParams.get("slug");
    if (!slug) {
      return NextResponse.json(
        { error: "Parametro 'slug' es requerido." },
        { status: 400 },
      );
    }

    const snap = await adminDb()
      .collection("Negocios")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    return NextResponse.json({ slug, disponible: snap.empty });
  } catch (err) {
    console.error("GET /api/negocios/check-slug error:", err);
    return NextResponse.json(
      { error: "Error al verificar slug." },
      { status: 500 },
    );
  }
}
