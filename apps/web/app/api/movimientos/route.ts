import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminDb } from "@/lib/api/firebase-admin";
import { verifyAuth } from "@/lib/api/auth";

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  try {
    const page = Math.max(
      1,
      parseInt(req.nextUrl.searchParams.get("page") ?? "1"),
    );
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(req.nextUrl.searchParams.get("pageSize") ?? "10")),
    );

    const snap = await adminDb()
      .collection("Movimientos")
      .where("anfitrion_uid", "==", uid)
      .orderBy("fecha", "desc")
      .get();

    const all = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const total = all.length;
    const start = (page - 1) * pageSize;
    const data = all.slice(start, start + pageSize);

    return NextResponse.json({
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch {
    return NextResponse.json({
      data: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
    });
  }
}
