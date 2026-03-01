import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminDb } from "@/lib/api/firebase-admin";
import { verifyAuth } from "@/lib/api/auth";

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  try {
    const db = adminDb();

    // Saldos actuales (fuente canonica)
    const anfitrionSnap = await db.collection("Anfitriones").doc(uid).get();
    const anfitrionData = anfitrionSnap.exists ? anfitrionSnap.data()! : {};
    const saldoReal = anfitrionData.saldoReal ?? 0;
    const saldoBono = anfitrionData.saldoBono ?? 0;

    // Agregar totales desde Movimientos
    const movsSnap = await db
      .collection("Movimientos")
      .where("anfitrion_id", "==", uid)
      .get();

    let totalIngresosReal = 0;
    let totalIngresosBono = 0;
    let totalEgresosReal = 0;
    let totalEgresosBono = 0;
    let totalRetiros = 0;
    let totalComisiones = 0;
    let ultimoRetiro: { amount: number; date: string } | null = null;

    for (const doc of movsSnap.docs) {
      const d = doc.data();
      const cat = d.categoria as string;

      if (cat === "INGRESO_REAL") totalIngresosReal += d.monto_real ?? 0;
      if (cat === "INGRESO_BONO") totalIngresosBono += d.monto_bono ?? 0;

      if (cat === "EGRESO_REAL" || cat === "EGRESO_MIXTO")
        totalEgresosReal += d.monto_real ?? 0;
      if (cat === "EGRESO_BONO" || cat === "EGRESO_MIXTO")
        totalEgresosBono += d.monto_bono ?? 0;

      if (d.tipo === "RETIRO_SOLICITADO") {
        totalRetiros += d.monto_real ?? 0;
        if (!ultimoRetiro || d.timestamp > ultimoRetiro.date) {
          ultimoRetiro = { amount: d.monto_real ?? 0, date: d.timestamp };
        }
      }

      if (
        ["COMISION_PLATAFORMA", "FEE_WOMPI_RETIRO", "RETENCION_FUENTE", "ICA_COBRO"].includes(
          d.tipo,
        )
      ) {
        totalComisiones += d.monto_real ?? 0;
      }
    }

    return NextResponse.json({
      saldoReal,
      saldoBono,
      saldoTotal: saldoReal + saldoBono,
      totalIngresosReal,
      totalIngresosBono,
      totalEgresosReal,
      totalEgresosBono,
      totalRetiros,
      totalComisiones,
      pendientePago: 0,
      ultimoRetiro,
    });
  } catch {
    return NextResponse.json({
      saldoReal: 0,
      saldoBono: 0,
      saldoTotal: 0,
      totalIngresosReal: 0,
      totalIngresosBono: 0,
      totalEgresosReal: 0,
      totalEgresosBono: 0,
      totalRetiros: 0,
      totalComisiones: 0,
      pendientePago: 0,
      ultimoRetiro: null,
    });
  }
}
