/**
 * GET /api/movimientos/chart
 * Datos para gráfico de movimientos agrupados por día.
 * Categorías: INGRESO (comisiones + participación), RECAUDO (recargas).
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminDb } from "@/lib/api/firebase-admin";
import { verifyAuth } from "@/lib/api/auth";

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  const period = req.nextUrl.searchParams.get("period") ?? "7d";
  const days = period === "90d" ? 90 : period === "30d" ? 30 : 7;

  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  try {
    const snap = await adminDb()
      .collection("Movimientos")
      .where("anfitrion_id", "==", uid)
      .where("timestamp", ">=", since.toISOString())
      .orderBy("timestamp", "asc")
      .get();

    // Inicializar todos los días en el rango
    const grouped: Record<string, { ingresos: number; recaudo: number; count: number }> = {};
    for (let i = 0; i <= days; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      grouped[key] = { ingresos: 0, recaudo: 0, count: 0 };
    }

    for (const doc of snap.docs) {
      const d = doc.data();
      const ts = d.timestamp?.toDate?.()?.toISOString?.() ?? d.timestamp;
      const dateKey = typeof ts === "string" ? ts.slice(0, 10) : "";
      if (!grouped[dateKey]) continue;

      grouped[dateKey].count++;
      const cat = d.categoria as string;

      if (cat === "INGRESO" || cat === "BONO") {
        grouped[dateKey].ingresos += d.monto ?? 0;
      } else if (cat === "RECAUDO" || cat === "RECAUDO_BONO") {
        grouped[dateKey].recaudo += d.monto ?? 0;
      }
    }

    const data = Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date,
        ingresos: vals.ingresos,
        recaudo: vals.recaudo,
        neto: vals.ingresos - vals.recaudo,
        movimientos: vals.count,
      }));

    return NextResponse.json({ data, period });
  } catch {
    return NextResponse.json({ data: [], period });
  }
}
