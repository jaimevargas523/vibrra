// ── Tipos de movimiento ──────────────────────────────────────

export type CategoriaMovimiento =
  | "INGRESO_REAL"
  | "INGRESO_BONO"
  | "EGRESO_REAL"
  | "EGRESO_BONO"
  | "EGRESO_MIXTO"
  | "INFORMATIVO";

export type TipoMovimiento =
  | "RECARGA_WOMPI" | "COMISION_SESION" | "DEVOLUCION_ADMIN"
  | "BONO_ACTIVACION" | "BONO_RECARGA_5" | "BONO_RECARGA_10"
  | "BONO_RECARGA_15" | "BONO_RECARGA_20" | "BONO_REFERIDO" | "BONO_AJUSTE_ADMIN"
  | "RECARGA_CLIENTE_BONO" | "PUJA_BONO" | "NOMINACION_BONO"
  | "CONEXION_BONO" | "VETO_BONO" | "DEDICATORIA_BONO" | "BONO_EXPIRADO"
  | "RECARGA_CLIENTE_REAL" | "PUJA_REAL" | "NOMINACION_REAL"
  | "CONEXION_REAL" | "VETO_REAL" | "DEDICATORIA_REAL"
  | "SUSCRIPCION_COBRO" | "RETIRO_SOLICITADO" | "FEE_WOMPI_RETIRO"
  | "RETENCION_FUENTE" | "ICA_COBRO"
  | "RECARGA_CLIENTE_MIXTA";

export const TIPO_A_CATEGORIA: Record<TipoMovimiento, CategoriaMovimiento> = {
  RECARGA_WOMPI: "INGRESO_REAL",
  COMISION_SESION: "INGRESO_REAL",
  DEVOLUCION_ADMIN: "INGRESO_REAL",
  BONO_ACTIVACION: "INGRESO_BONO",
  BONO_RECARGA_5: "INGRESO_BONO",
  BONO_RECARGA_10: "INGRESO_BONO",
  BONO_RECARGA_15: "INGRESO_BONO",
  BONO_RECARGA_20: "INGRESO_BONO",
  BONO_REFERIDO: "INGRESO_BONO",
  BONO_AJUSTE_ADMIN: "INGRESO_BONO",
  RECARGA_CLIENTE_BONO: "EGRESO_BONO",
  PUJA_BONO: "EGRESO_BONO",
  NOMINACION_BONO: "EGRESO_BONO",
  CONEXION_BONO: "EGRESO_BONO",
  VETO_BONO: "EGRESO_BONO",
  DEDICATORIA_BONO: "EGRESO_BONO",
  BONO_EXPIRADO: "EGRESO_BONO",
  RECARGA_CLIENTE_REAL: "EGRESO_REAL",
  PUJA_REAL: "EGRESO_REAL",
  NOMINACION_REAL: "EGRESO_REAL",
  CONEXION_REAL: "EGRESO_REAL",
  VETO_REAL: "EGRESO_REAL",
  DEDICATORIA_REAL: "EGRESO_REAL",
  SUSCRIPCION_COBRO: "EGRESO_REAL",
  RETIRO_SOLICITADO: "EGRESO_REAL",
  FEE_WOMPI_RETIRO: "EGRESO_REAL",
  RETENCION_FUENTE: "EGRESO_REAL",
  ICA_COBRO: "EGRESO_REAL",
  RECARGA_CLIENTE_MIXTA: "EGRESO_MIXTO",
};

// ── Interface del documento Movimiento ───────────────────────

export interface MovimientoDoc {
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

// ── Factory helper ───────────────────────────────────────────

export function crearMovimiento(
  anfitrion_id: string,
  tipo: TipoMovimiento,
  opts: {
    monto_real: number;
    monto_bono: number;
    saldo_real_post: number;
    saldo_bono_post: number;
    descripcion: string;
    cliente_id?: string;
    sesion_id?: string;
    referencia_id?: string;
    creado_por?: "system" | "admin" | "user";
  },
): MovimientoDoc {
  return {
    anfitrion_id,
    tipo,
    categoria: TIPO_A_CATEGORIA[tipo],
    monto_real: opts.monto_real,
    monto_bono: opts.monto_bono,
    monto_total: opts.monto_real + opts.monto_bono,
    saldo_real_post: opts.saldo_real_post,
    saldo_bono_post: opts.saldo_bono_post,
    descripcion: opts.descripcion,
    referencia_id: opts.referencia_id ?? null,
    cliente_id: opts.cliente_id ?? null,
    sesion_id: opts.sesion_id ?? null,
    cancion_id: null,
    fee_wompi: 0,
    retencion: 0,
    ica: 0,
    timestamp: new Date().toISOString(),
    creado_por: opts.creado_por ?? "system",
  };
}
