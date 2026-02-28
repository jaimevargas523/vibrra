export interface CalcInputs {
  sesiones: number;
  clientes: number;
  conexion: number;
  transacciones: number;
  puja: number;
  establecimientos: number;
}

export interface CalcResults {
  ingConexion: number;
  ingTrans: number;
  total: number;
  retiro: number;
  anual: number;
  suscripcion: number;
}

const WEEKS_PER_MONTH = 4.33;
const HOST_SHARE = 0.70;
const RETENTION_TAX = 0.035;
const SUBSCRIPTION_PER_LOCATION = 15000;

export function calcUpdate(inputs: CalcInputs): CalcResults {
  const { sesiones, clientes, conexion, transacciones, puja, establecimientos } = inputs;

  const ingConexion =
    clientes * conexion * sesiones * WEEKS_PER_MONTH * HOST_SHARE * establecimientos;
  const ingTrans =
    transacciones * puja * sesiones * WEEKS_PER_MONTH * HOST_SHARE * establecimientos;
  const suscripcion = SUBSCRIPTION_PER_LOCATION * establecimientos;
  const total = ingConexion + ingTrans;
  const retiro = total * (1 - RETENTION_TAX);
  const anual = total * 12;

  return { ingConexion, ingTrans, total, retiro, anual, suscripcion };
}

export function fmtCOP(n: number): string {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return "$" + Math.round(n / 1_000) + "K";
  return "$" + n.toLocaleString("es-CO");
}
