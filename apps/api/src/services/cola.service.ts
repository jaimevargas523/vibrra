import type { SongInQueue } from "../types/index.js";

function isoMinutesAgo(m: number): string {
  return new Date(Date.now() - m * 60_000).toISOString();
}

const mockQueue: SongInQueue[] = [
  {
    id: "song-001",
    sessionId: "ses-live-001",
    titulo: "Despacito",
    artista: "Luis Fonsi ft. Daddy Yankee",
    solicitadoPor: "Mesa 4",
    estado: "reproduciendo",
    precio: 5000,
    prioridad: 1,
    creadoEn: isoMinutesAgo(12),
    reproducidaEn: isoMinutesAgo(2),
  },
  {
    id: "song-002",
    sessionId: "ses-live-001",
    titulo: "Vivir Mi Vida",
    artista: "Marc Anthony",
    solicitadoPor: "Carlos M.",
    estado: "pendiente",
    precio: 7000,
    prioridad: 2,
    creadoEn: isoMinutesAgo(8),
    reproducidaEn: null,
  },
  {
    id: "song-003",
    sessionId: "ses-live-001",
    titulo: "La Bicicleta",
    artista: "Carlos Vives ft. Shakira",
    solicitadoPor: "Andrea L.",
    estado: "pendiente",
    precio: 5000,
    prioridad: 3,
    creadoEn: isoMinutesAgo(6),
    reproducidaEn: null,
  },
  {
    id: "song-004",
    sessionId: "ses-live-001",
    titulo: "Felices los 4",
    artista: "Maluma",
    solicitadoPor: "Mesa 7",
    estado: "pendiente",
    precio: 10000,
    prioridad: 4,
    creadoEn: isoMinutesAgo(4),
    reproducidaEn: null,
  },
  {
    id: "song-005",
    sessionId: "ses-live-001",
    titulo: "Chantaje",
    artista: "Shakira ft. Maluma",
    solicitadoPor: "Juan P.",
    estado: "pendiente",
    precio: 5000,
    prioridad: 5,
    creadoEn: isoMinutesAgo(2),
    reproducidaEn: null,
  },
  {
    id: "song-006",
    sessionId: "ses-live-001",
    titulo: "Bailando",
    artista: "Enrique Iglesias",
    solicitadoPor: "Mesa 2",
    estado: "reproducida",
    precio: 7000,
    prioridad: 0,
    creadoEn: isoMinutesAgo(30),
    reproducidaEn: isoMinutesAgo(22),
  },
  {
    id: "song-007",
    sessionId: "ses-live-001",
    titulo: "Gasolina",
    artista: "Daddy Yankee",
    solicitadoPor: "Anónimo",
    estado: "reproducida",
    precio: 5000,
    prioridad: 0,
    creadoEn: isoMinutesAgo(40),
    reproducidaEn: isoMinutesAgo(32),
  },
];

export function getQueue(sessionId: string): SongInQueue[] {
  return mockQueue
    .filter((s) => s.sessionId === sessionId)
    .sort((a, b) => a.prioridad - b.prioridad);
}

export function getPendingQueue(sessionId: string): SongInQueue[] {
  return getQueue(sessionId).filter(
    (s) => s.estado === "pendiente" || s.estado === "reproduciendo",
  );
}

export function addSongToQueue(
  sessionId: string,
  titulo: string,
  artista: string,
  solicitadoPor: string,
  precio: number,
): SongInQueue {
  const newSong: SongInQueue = {
    id: `song-${Date.now()}`,
    sessionId,
    titulo,
    artista,
    solicitadoPor,
    estado: "pendiente",
    precio,
    prioridad: mockQueue.length + 1,
    creadoEn: new Date().toISOString(),
    reproducidaEn: null,
  };
  mockQueue.push(newSong);
  return newSong;
}

export function nextSong(sessionId: string): SongInQueue | null {
  // Mark current "reproduciendo" as "reproducida"
  const playing = mockQueue.find(
    (s) => s.sessionId === sessionId && s.estado === "reproduciendo",
  );
  if (playing) {
    playing.estado = "reproducida";
    playing.reproducidaEn = new Date().toISOString();
  }
  // Promote next pending
  const next = mockQueue.find(
    (s) => s.sessionId === sessionId && s.estado === "pendiente",
  );
  if (next) {
    next.estado = "reproduciendo";
    next.reproducidaEn = new Date().toISOString();
    return next;
  }
  return null;
}
