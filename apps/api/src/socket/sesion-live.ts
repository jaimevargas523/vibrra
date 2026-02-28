import type { Namespace, Socket } from "socket.io";
import { getPendingQueue, nextSong, addSongToQueue } from "../services/cola.service.js";
import { getActiveSession } from "../services/sesion.service.js";

/* ------------------------------------------------------------------ */
/*  Room helpers – spec rooms:                                         */
/*    anfitrion:{uid}      – per-host updates (negocios:updated)       */
/*    negocio:{negocioId}  – session lifecycle (sesion:started/updated/ended) */
/*    sesion:{sesionId}    – queue & stats (cola:updated, stats:pujas-timeline) */
/* ------------------------------------------------------------------ */

function anfitrionRoom(uid: string): string {
  return `anfitrion:${uid}`;
}

function negocioRoom(negocioId: string): string {
  return `negocio:${negocioId}`;
}

function sesionRoom(sesionId: string): string {
  return `sesion:${sesionId}`;
}

/**
 * Register event handlers for a single socket in the /sesion namespace.
 */
export function registerSessionHandlers(
  nsp: Namespace,
  socket: Socket,
): void {
  const uid: string = socket.data["uid"] ?? "anonymous";

  // ---- Auto-join the anfitrion room for this user ----
  socket.join(anfitrionRoom(uid));
  console.log(`[Socket] ${uid} auto-joined room ${anfitrionRoom(uid)}`);

  // ---- Join a session room (sesion:{sesionId}) ----
  socket.on("join-session", (data: { sessionId: string; negocioId?: string }) => {
    const { sessionId, negocioId } = data;

    // Join the sesion room for queue/stats events
    socket.join(sesionRoom(sessionId));
    console.log(`[Socket] ${uid} joined room ${sesionRoom(sessionId)}`);

    // Also join the negocio room for session lifecycle events
    if (negocioId) {
      socket.join(negocioRoom(negocioId));
      console.log(`[Socket] ${uid} joined room ${negocioRoom(negocioId)}`);
    }

    // Immediately send current queue → cola:updated
    const queue = getPendingQueue(sessionId);
    socket.emit("cola:updated", queue);

    // Send session state → sesion:updated
    const session = getActiveSession();
    if (session && session.id === sessionId) {
      socket.emit("sesion:updated", session);
    }
  });

  // ---- Leave session room ----
  socket.on("leave-session", (data: { sessionId: string; negocioId?: string }) => {
    const { sessionId, negocioId } = data;

    socket.leave(sesionRoom(sessionId));
    console.log(`[Socket] ${uid} left room ${sesionRoom(sessionId)}`);

    if (negocioId) {
      socket.leave(negocioRoom(negocioId));
      console.log(`[Socket] ${uid} left room ${negocioRoom(negocioId)}`);
    }
  });

  // ---- Request next song (host only) ----
  socket.on("next-song", (sessionId: string) => {
    const song = nextSong(sessionId);
    if (song) {
      nsp.to(sesionRoom(sessionId)).emit("sesion:updated", { nowPlaying: song });
    }
    // Broadcast updated queue → cola:updated
    const queue = getPendingQueue(sessionId);
    nsp.to(sesionRoom(sessionId)).emit("cola:updated", queue);
  });

  // ---- Add song to queue (from client app or test) ----
  socket.on(
    "add-song",
    (data: {
      sessionId: string;
      titulo: string;
      artista: string;
      solicitadoPor: string;
      precio: number;
    }) => {
      addSongToQueue(
        data.sessionId,
        data.titulo,
        data.artista,
        data.solicitadoPor,
        data.precio,
      );
      // Broadcast updated queue → cola:updated
      const queue = getPendingQueue(data.sessionId);
      nsp.to(sesionRoom(data.sessionId)).emit("cola:updated", queue);
    },
  );

  // ---- Disconnect ----
  socket.on("disconnect", (reason) => {
    console.log(`[Socket] ${uid} disconnected: ${reason}`);
  });
}

/**
 * Start a periodic mock emitter that pushes a simulated queue change
 * every 30 seconds while there is an active session. Useful for frontend
 * testing without real user interaction.
 */
export function startMockEmitter(nsp: Namespace): void {
  const mockSongs = [
    { titulo: "Que Tire Pa Lante", artista: "Daddy Yankee" },
    { titulo: "Hawai", artista: "Maluma" },
    { titulo: "Dakiti", artista: "Bad Bunny ft. Jhay Cortez" },
    { titulo: "Tusa", artista: "Karol G ft. Nicki Minaj" },
    { titulo: "Pepas", artista: "Farruko" },
    { titulo: "Te Felicito", artista: "Shakira ft. Rauw Alejandro" },
  ];

  let idx = 0;

  setInterval(() => {
    const session = getActiveSession();
    if (!session) return;

    const pick = mockSongs[idx % mockSongs.length]!;
    addSongToQueue(
      session.id,
      pick.titulo,
      pick.artista,
      `Simulado-${idx + 1}`,
      [5000, 7000, 10000][idx % 3]!,
    );

    // Emit cola:updated to the sesion room
    const queue = getPendingQueue(session.id);
    nsp.to(sesionRoom(session.id)).emit("cola:updated", queue);

    // Emit sesion:updated to the negocio room
    nsp.to(negocioRoom(session.establecimientoId)).emit("sesion:updated", session);

    idx++;
  }, 30_000);
}
