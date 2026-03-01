// ---------------------------------------------------------------------------
// VIBRRA — Country-specific configuration (Paises/{code})
// ---------------------------------------------------------------------------

export interface MonedaConfig {
  code: string;       // "COP", "BRL", "MXN"
  symbol: string;     // "$", "R$"
  locale: string;     // "es-CO", "pt-BR", "es-MX"
}

export interface FiscalConfig {
  iva: number;                  // 0.19
  comisionPlataforma: number;   // 0.15
}

export interface SuscripcionConfig {
  precioMensual: number;
  saldoMinimoPorEstablecimiento: number;
  bonoActivacion: number;
}

export interface MontoRecarga {
  id: string;
  valor: number;
  etiqueta: string;
}

export interface ModoRecarga {
  id: string;
  emoji: string;
  label: string;
}

export interface BonosRecarga {
  canciones: number;
  conexiones: number;
}

export interface RecargaConfig {
  montos: MontoRecarga[];
  modos: ModoRecarga[];
  tablaBonos: Record<string, Record<string, BonosRecarga>>;
  costoExtraGenerosa: number;
  minimoBloqueado: number;
}

export interface PlanRecargaAnfitrion {
  amount: number;
  bonusPercent: number;
  bonus: number;
  total: number;
  recommended?: boolean;
}

export interface PasarelaConfig {
  nombre: string;
  proveedores: string[];
  metodos: string[];
}

export interface RecargaAnfitrionConfig {
  planes: PlanRecargaAnfitrion[];
  pasarela: PasarelaConfig;
}

export interface DocumentoRequerido {
  key: string;
  labelKey: string;
}

export interface LegalDocConfig {
  url: string;
  version: string;
}

export interface LegalConfig {
  terminos: LegalDocConfig;
  politicaDatos: LegalDocConfig;
}

export interface BancoConfig {
  key: string;      // "bancolombia"
  nombre: string;   // "Bancolombia"
}

export interface TipoCuentaConfig {
  key: string;      // "ahorros"
  nombre: string;   // "Cuenta de ahorros"
}

export interface TipoPersonaConfig {
  key: string;      // "natural"
  nombre: string;   // "Persona natural"
}

export interface RegimenTributarioConfig {
  key: string;      // "simple"
  nombre: string;   // "Régimen simple"
}

/** Full country configuration stored in Firestore Paises/{code}. */
export interface PaisConfig {
  code: string;        // "CO"
  nombre: string;      // "Colombia"
  activo: boolean;

  moneda: MonedaConfig;
  fiscal: FiscalConfig;
  suscripcion: SuscripcionConfig;
  recarga: RecargaConfig;
  recargaAnfitrion: RecargaAnfitrionConfig;
  documentosEstablecimiento: DocumentoRequerido[];
  legal: LegalConfig;

  bancos: BancoConfig[];
  tiposCuenta: TipoCuentaConfig[];
  tiposPersona: TipoPersonaConfig[];
  regimenesTributarios: RegimenTributarioConfig[];
}
