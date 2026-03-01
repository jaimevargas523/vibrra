import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminDb } from "@/lib/api/firebase-admin";
import { verifyAuth } from "@/lib/api/auth";

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  try {
    const params = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(params.get("page") ?? "1"));
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(params.get("pageSize") ?? "20")),
    );
    const tipo = params.get("tipo");
    const categoria = params.get("categoria");

    let query: FirebaseFirestore.Query = adminDb()
      .collection("Movimientos")
      .where("anfitrion_id", "==", uid);

    if (tipo) query = query.where("tipo", "==", tipo);
    if (categoria) query = query.where("categoria", "==", categoria);

    query = query.orderBy("timestamp", "desc");

    const snap = await query.get();
    const all = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const total = all.length;
    const start = (page - 1) * pageSize;
    const items = all.slice(start, start + pageSize);

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch {
    return NextResponse.json({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    });
  }
}
