/**
 * GET /api/movimientos/exportar
 * Exporta todos los movimientos del anfitrión como CSV.
 */

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
      .where("anfitrion_id", "==", uid)
      .orderBy("timestamp", "desc")
      .get();

    const headers =
      "id,tipo,categoria,descripcion,monto,comision,participacion,recaudo_post,comisiones_post,participacion_post,timestamp";

    const rows = snap.docs.map((doc) => {
      const d = doc.data();
      const desc = String(d.descripcion ?? "").replace(/"/g, '""');
      const ts = d.timestamp?.toDate?.()?.toISOString?.() ?? d.timestamp ?? "";
      return [
        doc.id,
        d.tipo,
        d.categoria,
        `"${desc}"`,
        d.monto ?? 0,
        d.comision ?? 0,
        d.participacion ?? 0,
        d.recaudo_post ?? 0,
        d.comisiones_post ?? 0,
        d.participacion_post ?? 0,
        ts,
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
    return new NextResponse(
      "id,tipo,categoria,descripcion,monto,comision,participacion,recaudo_post,comisiones_post,participacion_post,timestamp\n",
      { headers: { "Content-Type": "text/csv" } },
    );
  }
}
