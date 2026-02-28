import type { Session } from "../types/index.js";

const now = new Date();

function isoMinutesAgo(minutes: number): string {
  return new Date(now.getTime() - minutes * 60_000).toISOString();
}

function isoHoursAgo(hours: number): string {
  return new Date(now.getTime() - hours * 3_600_000).toISOString();
}

function isoDaysAgo(days: number): string {
  return new Date(now.getTime() - days * 86_400_000).toISOString();
}

/** Active session (or null if none running). */
let currentSession: Session | null = {
  id: "ses-live-001",
  hostUid: "mock-host-uid-001",
  establecimientoId: "est-001",
  establecimientoNombre: "Bar La Terraza",
  estado: "activa",
  iniciadaEn: isoMinutesAgo(47),
  finalizadaEn: null,
  duracionMinutos: 47,
  cancionesTotales: 12,
  ingresosSesion: 84000,
  asistentes: 38,
};

const pastSessions: Session[] = [
  {
    id: "ses-002",
    hostUid: "mock-host-uid-001",
    establecimientoId: "est-001",
    establecimientoNombre: "Bar La Terraza",
    estado: "finalizada",
    iniciadaEn: isoDaysAgo(1),
    finalizadaEn: isoHoursAgo(20),
    duracionMinutos: 180,
    cancionesTotales: 42,
    ingresosSesion: 315000,
    asistentes: 85,
  },
  {
    id: "ses-003",
    hostUid: "mock-host-uid-001",
    establecimientoId: "est-002",
    establecimientoNombre: "Club Nocturno Vibrra",
    estado: "finalizada",
    iniciadaEn: isoDaysAgo(2),
    finalizadaEn: isoDaysAgo(2),
    duracionMinutos: 240,
    cancionesTotales: 64,
    ingresosSesion: 480000,
    asistentes: 120,
  },
  {
    id: "ses-004",
    hostUid: "mock-host-uid-001",
    establecimientoId: "est-001",
    establecimientoNombre: "Bar La Terraza",
    estado: "finalizada",
    iniciadaEn: isoDaysAgo(3),
    finalizadaEn: isoDaysAgo(3),
    duracionMinutos: 150,
    cancionesTotales: 35,
    ingresosSesion: 262500,
    asistentes: 62,
  },
  {
    id: "ses-005",
    hostUid: "mock-host-uid-001",
    establecimientoId: "est-002",
    establecimientoNombre: "Club Nocturno Vibrra",
    estado: "finalizada",
    iniciadaEn: isoDaysAgo(5),
    finalizadaEn: isoDaysAgo(5),
    duracionMinutos: 200,
    cancionesTotales: 52,
    ingresosSesion: 390000,
    asistentes: 95,
  },
];

export function getActiveSession(): Session | null {
  return currentSession;
}

export function getAllSessions(page: number, pageSize: number) {
  const all = currentSession
    ? [currentSession, ...pastSessions]
    : [...pastSessions];
  const total = all.length;
  const start = (page - 1) * pageSize;
  const data = all.slice(start, start + pageSize);
  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export function getRecentSessions(limit: number): Session[] {
  const all = currentSession
    ? [currentSession, ...pastSessions]
    : [...pastSessions];
  return all.slice(0, limit);
}

export function startSession(establecimientoId: string): Session {
  currentSession = {
    id: `ses-${Date.now()}`,
    hostUid: "mock-host-uid-001",
    establecimientoId,
    establecimientoNombre:
      establecimientoId === "est-001"
        ? "Bar La Terraza"
        : "Club Nocturno Vibrra",
    estado: "activa",
    iniciadaEn: new Date().toISOString(),
    finalizadaEn: null,
    duracionMinutos: 0,
    cancionesTotales: 0,
    ingresosSesion: 0,
    asistentes: 0,
  };
  return currentSession;
}

export function endSession(): Session | null {
  if (!currentSession) return null;
  currentSession.estado = "finalizada";
  currentSession.finalizadaEn = new Date().toISOString();
  const ended = { ...currentSession };
  pastSessions.unshift(ended);
  currentSession = null;
  return ended;
}
