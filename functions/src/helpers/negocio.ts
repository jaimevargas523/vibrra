/**
 * Helpers del modelo de negocio VIBRRA.
 * calcularLiquidacion() es la fuente de verdad — usada por la Cloud Function
 * de cierre mensual y duplicada en el frontend para el preview.
 */

import {
  COMISION_RECARGA,
  PARTICIPACION_SESION,
  SUSCRIPCION_MONTO,
} from "../constants/negocio.js";

/** Calcula la comisión del anfitrión sobre una recarga */
export function calcularComision(montoRecarga: number): number {
  return Math.round(montoRecarga * COMISION_RECARGA);
}

/** Calcula la participación del anfitrión sobre gasto en sesión */
export function calcularParticipacion(montoGasto: number): number {
  return Math.round(montoGasto * PARTICIPACION_SESION);
}

/** Resultado del cálculo de liquidación mensual */
export interface LiquidacionResult {
  deudaBruta: number;
  gananciaDigital: number;
  efectivoAEntregar: number;
  efectivoAQuedarse: number;
  gananciaNeta: number;
  nuevaDeuda: number;
}

/**
 * Calcula la liquidación mensual del anfitrión.
 * FUENTE DE VERDAD — esta función se duplica en el frontend.
 *
 * @param anf - Datos del anfitrión desde Firestore
 */
export function calcularLiquidacion(anf: {
  recaudo_mes: number;
  comisiones_mes: number;
  participacion_mes: number;
  suscripcion_monto?: number;
  liquidacion_deuda?: number;
}): LiquidacionResult {
  const suscripcion = anf.suscripcion_monto ?? SUSCRIPCION_MONTO;
  const deudaAnterior = anf.liquidacion_deuda ?? 0;

  const gananciaDigital = anf.comisiones_mes + anf.participacion_mes;
  const deudaBruta = anf.recaudo_mes + suscripcion + deudaAnterior;
  const efectivoAEntregar = Math.max(0, deudaBruta - gananciaDigital);
  const efectivoAQuedarse = anf.recaudo_mes - efectivoAEntregar;
  const gananciaNeta = gananciaDigital - suscripcion - deudaAnterior;
  const nuevaDeuda = Math.max(0, deudaBruta - gananciaDigital - anf.recaudo_mes);

  return {
    deudaBruta,
    gananciaDigital,
    efectivoAEntregar,
    efectivoAQuedarse,
    gananciaNeta,
    nuevaDeuda,
  };
}

/**
 * Calcula el Timestamp del día 1 del próximo mes a las 00:00 (Bogotá).
 * Usado para establecer la próxima fecha de liquidación.
 */
export function proximaLiquidacion(): Date {
  const now = new Date();
  // Bogotá is UTC-5
  const bogota = new Date(now.toLocaleString("en-US", {timeZone: "America/Bogota"}));
  const year = bogota.getMonth() === 11 ? bogota.getFullYear() + 1 : bogota.getFullYear();
  const month = bogota.getMonth() === 11 ? 0 : bogota.getMonth() + 1;
  return new Date(year, month, 1, 0, 0, 0);
}

/**
 * Formatea un valor en COP.
 * Ejemplo: 120000 → "$120.000"
 */
export function formatCOP(valor: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(valor);
}
