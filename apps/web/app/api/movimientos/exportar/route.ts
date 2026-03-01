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
      "id,tipo,categoria,descripcion,monto_real,monto_bono,monto_total,saldo_real_post,saldo_bono_post,timestamp";

    const rows = snap.docs.map((doc) => {
      const d = doc.data();
      const desc = String(d.descripcion ?? "").replace(/"/g, '""');
      return [
        doc.id,
        d.tipo,
        d.categoria,
        `"${desc}"`,
        d.monto_real ?? 0,
        d.monto_bono ?? 0,
        d.monto_total ?? 0,
        d.saldo_real_post ?? 0,
        d.saldo_bono_post ?? 0,
        d.timestamp,
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
      "id,tipo,categoria,descripcion,monto_real,monto_bono,monto_total,saldo_real_post,saldo_bono_post,timestamp\n",
      { headers: { "Content-Type": "text/csv" } },
    );
  }
}
