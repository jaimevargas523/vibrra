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
      .collection("Movimientos")
      .where("anfitrion_uid", "==", uid)
      .orderBy("fecha", "desc")
      .get();

    const headers = "id,tipo,titulo,subtitulo,fecha,bruto,neto";
    const rows = snap.docs.map((doc) => {
      const d = doc.data();
      return [
        doc.id,
        d.tipo,
        `"${d.titulo}"`,
        `"${d.subtitulo}"`,
        d.fecha,
        d.bruto,
        d.neto,
      ].join(",");
    });

    const csv = [headers, ...rows].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=movimientos.csv",
      },
    });
  } catch {
    return new NextResponse("id,tipo,titulo,subtitulo,fecha,bruto,neto\n", {
      headers: { "Content-Type": "text/csv" },
    });
  }
}
