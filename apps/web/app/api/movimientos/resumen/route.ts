/**
 * GET /api/movimientos/resumen
 * Retorna el estado financiero del mes en curso del anfitrión.
 * Lee de Anfitriones/{uid} (fuente canónica) y calcula valores derivados.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminDb } from "@/lib/api/firebase-admin";
import { verifyAuth } from "@/lib/api/auth";

const SUSCRIPCION_MONTO = 15_000;

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  try {
    const db = adminDb();
    const snap = await db.collection("Anfitriones").doc(uid).get();
    const data = snap.exists ? snap.data()! : {};

    const recaudoMes = data.recaudo_mes ?? 0;
    const comisionesMes = data.comisiones_mes ?? 0;
    const participacionMes = data.participacion_mes ?? 0;
    const suscripcionMonto = data.suscripcion_monto ?? SUSCRIPCION_MONTO;
    const liquidacionDeuda = data.liquidacion_deuda ?? 0;
    const bonoArranqueSaldo = data.bono_arranque_saldo ?? 0;
    const bonoArranqueUsado = data.bono_arranque_usado ?? 0;

    // Valores derivados (calcular en tiempo real, nunca guardar)
    const gananciaDigital = comisionesMes + participacionMes;
    const gananciaNeta = gananciaDigital - suscripcionMonto - liquidacionDeuda;
    const deudaBruta = recaudoMes + suscripcionMonto + liquidacionDeuda;
    const efectivoAEntregar = Math.max(0, deudaBruta - gananciaDigital);
    const efectivoAQuedarse = recaudoMes - efectivoAEntregar;

    // Fecha de liquidación
    const liquidacionFecha = data.liquidacion_fecha?.toDate?.()?.toISOString?.() ?? null;

    return NextResponse.json({
      recaudoMes,
      comisionesMes,
      participacionMes,
      gananciaDigital,
      gananciaNeta,
      suscripcionMonto,
      deudaBruta,
      efectivoAEntregar,
      efectivoAQuedarse,
      bonoArranqueSaldo,
      bonoArranqueUsado,
      liquidacionEstado: data.liquidacion_estado ?? "pendiente",
      liquidacionDeuda,
      liquidacionFecha,
    });
  } catch (err) {
    console.error("GET /api/movimientos/resumen error:", err);
    return NextResponse.json({
      recaudoMes: 0,
      comisionesMes: 0,
      participacionMes: 0,
      gananciaDigital: 0,
      gananciaNeta: 0,
      suscripcionMonto: SUSCRIPCION_MONTO,
      deudaBruta: 0,
      efectivoAEntregar: 0,
      efectivoAQuedarse: 0,
      bonoArranqueSaldo: 0,
      bonoArranqueUsado: 0,
      liquidacionEstado: "pendiente",
      liquidacionDeuda: 0,
      liquidacionFecha: null,
    });
  }
}
