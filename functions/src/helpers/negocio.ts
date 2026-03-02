/**
 * Helpers del modelo de negocio VIBRRA.
 * calcularLiquidacion() es la fuente de verdad.
 */

import {
  COMISION_RECARGA,
  PARTICIPACION_SESION,
  SUSCRIPCION_MONTO,
} from "../constants/negocio.js";

/**
 * Calcula la comisión sobre una recarga.
 * @param {number} montoRecarga - Monto total de la recarga.
 * @return {number} Comisión redondeada.
 */
export function calcularComision(
  montoRecarga: number,
): number {
  return Math.round(montoRecarga * COMISION_RECARGA);
}

/**
 * Calcula la participación sobre gasto en sesión.
 * @param {number} montoGasto - Monto del gasto.
 * @return {number} Participación redondeada.
 */
export function calcularParticipacion(
  montoGasto: number,
): number {
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

interface LiquidacionInput {
  recaudo_mes: number;
  comisiones_mes: number;
  participacion_mes: number;
  suscripcion_monto?: number;
  liquidacion_deuda?: number;
}

/**
 * Calcula la liquidación mensual del anfitrión.
 * FUENTE DE VERDAD.
 * @param {LiquidacionInput} anf - Datos del anfitrión.
 * @return {LiquidacionResult} Resultado de la liquidación.
 */
export function calcularLiquidacion(
  anf: LiquidacionInput,
): LiquidacionResult {
  const suscripcion =
    anf.suscripcion_monto ?? SUSCRIPCION_MONTO;
  const deudaAnterior = anf.liquidacion_deuda ?? 0;

  const gananciaDigital =
    anf.comisiones_mes + anf.participacion_mes;
  const deudaBruta =
    anf.recaudo_mes + suscripcion + deudaAnterior;
  const efectivoAEntregar =
    Math.max(0, deudaBruta - gananciaDigital);
  const efectivoAQuedarse =
    anf.recaudo_mes - efectivoAEntregar;
  const gananciaNeta =
    gananciaDigital - suscripcion - deudaAnterior;
  const nuevaDeuda = Math.max(
    0,
    deudaBruta - gananciaDigital - anf.recaudo_mes,
  );

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
 * Timestamp del día 1 del próximo mes (Bogotá).
 * @return {Date} Fecha del próximo corte.
 */
export function proximaLiquidacion(): Date {
  const now = new Date();
  const bogota = new Date(
    now.toLocaleString("en-US", {timeZone: "America/Bogota"}),
  );
  const year = bogota.getMonth() === 11 ?
    bogota.getFullYear() + 1 :
    bogota.getFullYear();
  const month = bogota.getMonth() === 11 ?
    0 :
    bogota.getMonth() + 1;
  return new Date(year, month, 1, 0, 0, 0);
}

/**
 * Formatea un valor en COP.
 * @param {number} valor - Valor numérico.
 * @return {string} Ejemplo: "$120.000"
 */
export function formatCOP(valor: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(valor);
}
