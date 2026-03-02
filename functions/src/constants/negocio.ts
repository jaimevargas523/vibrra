/**
 * Constantes del modelo de negocio VIBRRA.
 * Fuente de verdad: prompt_modelo_negocio_vibrra.md
 */

/** Comisión del anfitrión por cada recarga a cliente (10%) */
export const COMISION_RECARGA = 0.10;

/** Participación del anfitrión en gasto de sesión de sus clientes (70%) */
export const PARTICIPACION_SESION = 0.70;

/** Suscripción mensual fija en COP */
export const SUSCRIPCION_MONTO = 15_000;

/** Crédito inicial para nuevos anfitriones en COP */
export const BONO_ARRANQUE = 30_000;

/** Costo extra del modo "generosa" en COP */
export const COSTO_EXTRA_GENEROSA = 332;

/** Montos de recarga disponibles */
export const MONTOS_RECARGA: Record<string, { valor: number; etiqueta: string }> = {
  minimo:   { valor: 2_000,  etiqueta: "Mínimo" },
  basico:   { valor: 5_000,  etiqueta: "Básico" },
  estandar: { valor: 10_000, etiqueta: "Estándar" },
  noche:    { valor: 20_000, etiqueta: "Noche" },
  vip:      { valor: 50_000, etiqueta: "VIP" },
};

/** Modos de generosidad */
export const MODOS_RECARGA: Record<string, { emoji: string; label: string }> = {
  pesimista: { emoji: "😐", label: "Pesimista" },
  moderada:  { emoji: "😊", label: "Moderada" },
  generosa:  { emoji: "🤩", label: "Generosa" },
};

/** Tabla de bonos para el cliente: monto × modo → { canciones, conexiones } */
export const TABLA_BONOS_CLIENTE: Record<string, Record<string, { canciones: number; conexiones: number }>> = {
  minimo: {
    pesimista: { canciones: 1, conexiones: 0 },
    moderada:  { canciones: 1, conexiones: 1 },
    generosa:  { canciones: 2, conexiones: 1 },
  },
  basico: {
    pesimista: { canciones: 2, conexiones: 0 },
    moderada:  { canciones: 2, conexiones: 1 },
    generosa:  { canciones: 4, conexiones: 1 },
  },
  estandar: {
    pesimista: { canciones: 2, conexiones: 0 },
    moderada:  { canciones: 3, conexiones: 1 },
    generosa:  { canciones: 5, conexiones: 1 },
  },
  noche: {
    pesimista: { canciones: 3, conexiones: 0 },
    moderada:  { canciones: 4, conexiones: 1 },
    generosa:  { canciones: 6, conexiones: 2 },
  },
  vip: {
    pesimista: { canciones: 5, conexiones: 1 },
    moderada:  { canciones: 8, conexiones: 2 },
    generosa:  { canciones: 10, conexiones: 3 },
  },
};

// ── Tipos de movimiento ──────────────────────────────────────

export type TipoMovimiento =
  | "RECARGA_CLIENTE"
  | "RECARGA_CLIENTE_BONO"
  | "COMISION_RECARGA"
  | "PARTICIPACION_SESION"
  | "LIQUIDACION_COBRO"
  | "LIQUIDACION_SUSCRIPCION"
  | "LIQUIDACION_DEUDA"
  | "LIQUIDACION_MORA"
  | "BONO_ARRANQUE"
  | "AJUSTE_ADMIN";

export type CategoriaMovimiento =
  | "RECAUDO"
  | "RECAUDO_BONO"
  | "INGRESO"
  | "LIQUIDACION"
  | "BONO"
  | "AJUSTE"
  | "INFORMATIVO";

/** Mapeo tipo → categoría */
export const TIPO_A_CATEGORIA: Record<TipoMovimiento, CategoriaMovimiento> = {
  RECARGA_CLIENTE:          "RECAUDO",
  RECARGA_CLIENTE_BONO:     "RECAUDO_BONO",
  COMISION_RECARGA:         "INGRESO",
  PARTICIPACION_SESION:     "INGRESO",
  LIQUIDACION_COBRO:        "LIQUIDACION",
  LIQUIDACION_SUSCRIPCION:  "LIQUIDACION",
  LIQUIDACION_DEUDA:        "LIQUIDACION",
  LIQUIDACION_MORA:         "INFORMATIVO",
  BONO_ARRANQUE:            "BONO",
  AJUSTE_ADMIN:             "AJUSTE",
};

/** Documento de movimiento en Firestore */
export interface MovimientoDoc {
  anfitrion_id: string;
  cliente_id: string | null;
  sesion_id: string | null;
  tipo: TipoMovimiento;
  categoria: CategoriaMovimiento;
  monto: number;
  comision: number;
  participacion: number;
  recaudo_post: number;
  comisiones_post: number;
  participacion_post: number;
  descripcion: string;
  timestamp: FirebaseFirestore.FieldValue | string;
  creado_por: "cloud_function" | "sistema" | "admin";
}

/** Documento del anfitrión en Firestore */
export interface AnfitrionDoc {
  tipo: "anfitrion";
  recaudo_mes: number;
  comisiones_mes: number;
  participacion_mes: number;
  credito_bono_usado: number;
  bono_arranque_saldo: number;
  bono_arranque_usado: number;
  suscripcion_activa: boolean;
  suscripcion_monto: number;
  liquidacion_estado: "pendiente" | "pagado" | "mora";
  liquidacion_fecha: FirebaseFirestore.Timestamp;
  liquidacion_deuda: number;
  nombre_bar: string;
  ciudad: string;
  fecha_registro: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp;
  ultimo_acceso: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp;
}

/** Documento del cliente en Firestore */
export interface ClienteDoc {
  tipo: "cliente";
  saldo: number;
  bonos_canciones: number;
  bonos_conexiones: number;
  ultima_sesion_id: string | null;
  fecha_registro: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp;
}
