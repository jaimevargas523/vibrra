// ── Categorias de movimiento ─────────────────────────────────
export const CATEGORIAS = [
  "INGRESO_REAL",
  "INGRESO_BONO",
  "EGRESO_REAL",
  "EGRESO_BONO",
  "EGRESO_MIXTO",
  "INFORMATIVO",
] as const;

export type CategoriaMovimiento = (typeof CATEGORIAS)[number];

// ── Catalogo completo de tipos (31) ──────────────────────────
export const TIPOS_MOVIMIENTO = {
  // INGRESO_REAL
  RECARGA_WOMPI:         { categoria: "INGRESO_REAL"  as const, icon: "\uD83D\uDCB0", label: "Recarga Wompi",             color: "success" },
  COMISION_SESION:       { categoria: "INGRESO_REAL"  as const, icon: "\uD83C\uDFB6", label: "Comision de sesion",         color: "success" },
  DEVOLUCION_ADMIN:      { categoria: "INGRESO_REAL"  as const, icon: "\u21A9\uFE0F", label: "Devolucion",                color: "success" },

  // INGRESO_BONO
  BONO_ACTIVACION:       { categoria: "INGRESO_BONO"  as const, icon: "\uD83C\uDF81", label: "Bono de bienvenida",        color: "gold" },
  BONO_RECARGA_5:        { categoria: "INGRESO_BONO"  as const, icon: "\uD83C\uDF81", label: "Bono de recarga (+5%)",     color: "gold" },
  BONO_RECARGA_10:       { categoria: "INGRESO_BONO"  as const, icon: "\uD83C\uDF81", label: "Bono de recarga (+10%)",    color: "gold" },
  BONO_RECARGA_15:       { categoria: "INGRESO_BONO"  as const, icon: "\uD83C\uDF81", label: "Bono de recarga (+15%)",    color: "gold" },
  BONO_RECARGA_20:       { categoria: "INGRESO_BONO"  as const, icon: "\uD83C\uDF81", label: "Bono de recarga (+20%)",    color: "gold" },
  BONO_REFERIDO:         { categoria: "INGRESO_BONO"  as const, icon: "\uD83C\uDF81", label: "Bono por referido",         color: "gold" },
  BONO_AJUSTE_ADMIN:     { categoria: "INGRESO_BONO"  as const, icon: "\u21A9\uFE0F", label: "Ajuste de bono",            color: "gold" },

  // EGRESO_BONO
  RECARGA_CLIENTE_BONO:  { categoria: "EGRESO_BONO"   as const, icon: "\uD83D\uDD01", label: "Recarga a cliente",         color: "purple" },
  PUJA_BONO:             { categoria: "EGRESO_BONO"   as const, icon: "\uD83C\uDFB5", label: "Puja (bono)",               color: "purple" },
  NOMINACION_BONO:       { categoria: "EGRESO_BONO"   as const, icon: "\uD83C\uDFB5", label: "Nominacion (bono)",         color: "purple" },
  CONEXION_BONO:         { categoria: "EGRESO_BONO"   as const, icon: "\uD83D\uDD17", label: "Conexion (bono)",           color: "purple" },
  VETO_BONO:             { categoria: "EGRESO_BONO"   as const, icon: "\uD83D\uDEAB", label: "Veto (bono)",               color: "purple" },
  DEDICATORIA_BONO:      { categoria: "EGRESO_BONO"   as const, icon: "\uD83D\uDC8C", label: "Dedicatoria (bono)",        color: "purple" },
  BONO_EXPIRADO:         { categoria: "EGRESO_BONO"   as const, icon: "\u26A0\uFE0F", label: "Bono expirado",             color: "error" },

  // EGRESO_REAL
  RECARGA_CLIENTE_REAL:  { categoria: "EGRESO_REAL"   as const, icon: "\uD83D\uDD01", label: "Recarga a cliente",         color: "error" },
  PUJA_REAL:             { categoria: "EGRESO_REAL"   as const, icon: "\uD83C\uDFB5", label: "Puja (real)",               color: "error" },
  NOMINACION_REAL:       { categoria: "EGRESO_REAL"   as const, icon: "\uD83C\uDFB5", label: "Nominacion (real)",         color: "error" },
  CONEXION_REAL:         { categoria: "EGRESO_REAL"   as const, icon: "\uD83D\uDD17", label: "Conexion (real)",           color: "error" },
  VETO_REAL:             { categoria: "EGRESO_REAL"   as const, icon: "\uD83D\uDEAB", label: "Veto (real)",               color: "error" },
  DEDICATORIA_REAL:      { categoria: "EGRESO_REAL"   as const, icon: "\uD83D\uDC8C", label: "Dedicatoria (real)",        color: "error" },
  SUSCRIPCION_COBRO:     { categoria: "EGRESO_REAL"   as const, icon: "\uD83D\uDCC5", label: "Suscripcion mensual",       color: "warning" },
  RETIRO_SOLICITADO:     { categoria: "EGRESO_REAL"   as const, icon: "\uD83D\uDCB8", label: "Retiro",                    color: "error" },
  FEE_WOMPI_RETIRO:      { categoria: "EGRESO_REAL"   as const, icon: "\uD83C\uDFE6", label: "Fee pasarela (retiro)",     color: "warning" },
  RETENCION_FUENTE:      { categoria: "EGRESO_REAL"   as const, icon: "\uD83C\uDFDB\uFE0F", label: "Retencion en la fuente", color: "warning" },
  ICA_COBRO:             { categoria: "EGRESO_REAL"   as const, icon: "\uD83C\uDFDB\uFE0F", label: "ICA",                    color: "warning" },

  // EGRESO_MIXTO
  RECARGA_CLIENTE_MIXTA: { categoria: "EGRESO_MIXTO"  as const, icon: "\uD83D\uDD01", label: "Recarga a cliente",         color: "info" },
} as const;

export type TipoMovimiento = keyof typeof TIPOS_MOVIMIENTO;

export interface TipoMeta {
  categoria: CategoriaMovimiento;
  icon: string;
  label: string;
  color: string;
}

// ── Interface del documento Firestore ────────────────────────
export interface MovimientoDoc {
  id?: string;
  anfitrion_id: string;
  tipo: TipoMovimiento;
  categoria: CategoriaMovimiento;

  monto_real: number;
  monto_bono: number;
  monto_total: number;

  saldo_real_post: number;
  saldo_bono_post: number;

  descripcion: string;
  referencia_id: string | null;
  cliente_id: string | null;
  sesion_id: string | null;
  cancion_id: string | null;

  fee_wompi: number;
  retencion: number;
  ica: number;

  timestamp: string;
  creado_por: "system" | "admin" | "user";
}

// ── Helpers ──────────────────────────────────────────────────
export function esEgreso(cat: CategoriaMovimiento): boolean {
  return cat.startsWith("EGRESO");
}

export function esIngreso(cat: CategoriaMovimiento): boolean {
  return cat.startsWith("INGRESO");
}
