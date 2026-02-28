// ---------------------------------------------------------------------------
// VIBRRA API  --  Domain types
// ---------------------------------------------------------------------------

/** Mirrors the "Usuarios" Firestore collection. */
export interface HostProfile {
  uid: string;
  nombres: string;
  apellidos: string;
  email: string;
  tipoDoc: "CC" | "CE" | "NIT" | "PAS";
  numeroDoc: string;
  celular: string;
  tipoPersona: "natural" | "juridica";
  nit: string | null;
  regimen: "simplificado" | "comun" | null;
  responsableIva: boolean;
  banco: string;
  tipoCuenta: "ahorros" | "corriente";
  numeroCuenta: string;
  titularCuenta: string;
  saldoReal: number;       // COP, integer
  saldoBono: number;       // COP, integer
  estado: "activo" | "inactivo" | "suspendido";
  verificacion: VerificacionStatus;
  legal: LegalAcceptance;
  creadoEn: string;        // ISO date
  actualizadoEn: string;   // ISO date
  fotoUrl: string | null;
}

export interface VerificacionStatus {
  identidad: boolean;
  email: boolean;
  celular: boolean;
  documentos: boolean;
}

export interface LegalAcceptance {
  terminosAceptados: boolean;
  fechaAceptacion: string; // ISO date
  versionTerminos: string;
}

/** A physical or virtual location where sessions run. */
export interface Establecimiento {
  id: string;
  hostUid: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  tipo: "bar" | "restaurante" | "discoteca" | "karaoke" | "otro";
  capacidad: number;
  activo: boolean;
  qrCodes: string[];       // list of QR-code IDs
  imagenUrl: string | null;
  creadoEn: string;
  actualizadoEn: string;
}

/** A DJ / host session. */
export interface Session {
  id: string;
  hostUid: string;
  establecimientoId: string;
  establecimientoNombre: string;
  estado: "activa" | "pausada" | "finalizada";
  iniciadaEn: string;
  finalizadaEn: string | null;
  duracionMinutos: number;
  cancionesTotales: number;
  ingresosSesion: number;   // COP
  asistentes: number;
}

/** A song sitting in the live queue. */
export interface SongInQueue {
  id: string;
  sessionId: string;
  titulo: string;
  artista: string;
  solicitadoPor: string;    // display name or anonymous
  estado: "pendiente" | "reproduciendo" | "reproducida" | "rechazada";
  precio: number;           // COP
  prioridad: number;
  creadoEn: string;
  reproducidaEn: string | null;
}

/** A monetary transaction (payment, payout, bonus, etc.). */
export interface Transaction {
  id: string;
  hostUid: string;
  tipo: "ingreso" | "retiro" | "bono" | "suscripcion" | "recarga";
  concepto: string;
  monto: number;            // COP, always positive
  saldoAnterior: number;
  saldoPosterior: number;
  referencia: string | null;
  estado: "completada" | "pendiente" | "fallida";
  creadoEn: string;
}

/** Host subscription plan. */
export interface Subscription {
  id: string;
  hostUid: string;
  plan: "gratuito" | "basico" | "profesional" | "empresarial";
  estado: "activa" | "cancelada" | "vencida";
  precioMensual: number;    // COP
  fechaInicio: string;
  fechaRenovacion: string;
  establecimientosMax: number;
  sesionesMax: number;
  caracteristicas: string[];
}

/** A promotional bonus or coupon. */
export interface Bonus {
  id: string;
  hostUid: string;
  tipo: "bienvenida" | "referido" | "promocion" | "fidelidad";
  monto: number;            // COP
  estado: "disponible" | "usado" | "vencido";
  descripcion: string;
  fechaExpiracion: string;
  creadoEn: string;
}

/** An uploaded legal / identity document. */
export interface Document {
  id: string;
  hostUid: string;
  tipo: "cedula_frente" | "cedula_reverso" | "rut" | "camara_comercio" | "contrato";
  nombre: string;
  url: string;
  estado: "pendiente" | "aprobado" | "rechazado";
  creadoEn: string;
  revisadoEn: string | null;
  nota: string | null;
}

/** KPI card data for the dashboard summary. */
export interface KpiData {
  label: string;
  valor: number;
  unidad: string;           // "$", "COP", "min", "canciones", etc.
  cambio: number;           // percentage vs previous period  (+12, -3, etc.)
  tendencia: "up" | "down" | "neutral";
}

/** A single data-point in a chart series. */
export interface ChartDataPoint {
  fecha: string;            // ISO date or label
  valor: number;
  label?: string;
}

/** QR code entity. */
export interface QrData {
  id: string;
  establecimientoId: string;
  establecimientoNombre: string;
  url: string;
  activo: boolean;
  escaneos: number;
  creadoEn: string;
}

/** Analytics aggregate payload. */
export interface AnalyticsData {
  kpis: KpiData[];
  heatmap: HeatmapPoint[];
  generos: GeneroCount[];
  perfilCliente: ClientProfile;
}

export interface HeatmapPoint {
  dia: string;              // "lunes" ... "domingo"
  hora: number;             // 0-23
  valor: number;            // intensity
}

export interface GeneroCount {
  genero: string;
  cantidad: number;
  porcentaje: number;
}

export interface ClientProfile {
  edadPromedio: number;
  generoPredominante: string;
  ticketPromedio: number;   // COP
  frecuenciaVisita: number; // visits per month
}

/** Recarga (top-up) plan. */
export interface RecargaPlan {
  id: string;
  nombre: string;
  monto: number;            // COP
  bonus: number;            // COP extra
  popular: boolean;
}

/** Paginated response wrapper. */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
