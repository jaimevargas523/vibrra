import { useEffect, useRef } from "react";
import { getSocket, connectSocket, disconnectSocket } from "@/lib/socket";
import { useSessionStore, type QueueItem } from "@/stores/session.store";

/* ------------------------------------------------------------------ */
/*  Spec event payloads (server → client)                              */
/*                                                                     */
/*  Event                   Room                                       */
/*  negocios:updated        anfitrion:{uid}                            */
/*  sesion:started          negocio:{negocioId}                        */
/*  sesion:updated          negocio:{negocioId}                        */
/*  sesion:ended            negocio:{negocioId}                        */
/*  cola:updated            sesion:{sesionId}                          */
/*  stats:pujas-timeline    sesion:{sesionId}                          */
/* ------------------------------------------------------------------ */

interface SesionPayload {
  id: string;
  estado: string;
  [key: string]: unknown;
}

interface ColaUpdatedPayload extends Array<QueueItem> {}

interface PujasTimelinePayload {
  timeline: Array<{ ts: string; total: number }>;
  [key: string]: unknown;
}

export function useSessionSocket(
  sessionId: string | null,
  negocioId?: string | null,
) {
  const joined = useRef(false);

  const {
    setQueue,
    setCurrentSong,
    setConnectedUsers,
    setTotalRecaudado,
    endSession,
    setLive,
    setStartedAt,
  } = useSessionStore();

  useEffect(() => {
    if (!sessionId) return;

    connectSocket();
    const socket = getSocket();

    /* ---------- Join rooms ---------- */
    const joinRoom = () => {
      if (!joined.current) {
        socket.emit("join-session", { sessionId, negocioId });
        joined.current = true;
      }
    };

    if (socket.connected) {
      joinRoom();
    }
    socket.on("connect", joinRoom);

    /* ---------- cola:updated → full queue replacement ---------- */
    const onColaUpdated = (queue: ColaUpdatedPayload) => {
      // Map backend SongInQueue fields to frontend QueueItem fields
      const mapped: QueueItem[] = (queue as unknown as Array<Record<string, unknown>>).map((item) => ({
        id: item["id"] as string,
        songTitle: (item["titulo"] as string) ?? "",
        artistName: (item["artista"] as string) ?? "",
        requestedBy: (item["solicitadoPor"] as string) ?? "",
        amount: (item["precio"] as number) ?? 0,
        status: mapEstado(item["estado"] as string),
        createdAt: (item["creadoEn"] as string) ?? new Date().toISOString(),
      }));
      setQueue(mapped);
    };

    /* ---------- sesion:started → session goes live ---------- */
    const onSesionStarted = (data: SesionPayload) => {
      setLive(true, data.id);
      if (data["iniciadaEn"]) {
        setStartedAt(data["iniciadaEn"] as string);
      }
    };

    /* ---------- sesion:updated → session state refresh ---------- */
    const onSesionUpdated = (data: SesionPayload) => {
      if (data["ingresosSesion"] !== undefined) {
        setTotalRecaudado(data["ingresosSesion"] as number);
      }
      if (data["asistentes"] !== undefined) {
        setConnectedUsers(data["asistentes"] as number);
      }
      if (data["nowPlaying"]) {
        const np = data["nowPlaying"] as Record<string, unknown>;
        setCurrentSong({
          id: np["id"] as string,
          title: (np["titulo"] as string) ?? "",
          artist: (np["artista"] as string) ?? "",
          requestedBy: (np["solicitadoPor"] as string) ?? "",
          amount: (np["precio"] as number) ?? 0,
          startedAt: (np["reproducidaEn"] as string) ?? new Date().toISOString(),
        });
      }
    };

    /* ---------- sesion:ended → session finished ---------- */
    const onSesionEnded = () => {
      endSession();
    };

    /* ---------- stats:pujas-timeline → analytics ---------- */
    const onPujasTimeline = (_data: PujasTimelinePayload) => {
      // TODO: pipe into an analytics store when ready
    };

    /* ---------- Register listeners ---------- */
    socket.on("cola:updated", onColaUpdated);
    socket.on("sesion:started", onSesionStarted);
    socket.on("sesion:updated", onSesionUpdated);
    socket.on("sesion:ended", onSesionEnded);
    socket.on("stats:pujas-timeline", onPujasTimeline);

    /* ---------- Cleanup ---------- */
    return () => {
      if (joined.current) {
        socket.emit("leave-session", { sessionId, negocioId });
        joined.current = false;
      }

      socket.off("connect", joinRoom);
      socket.off("cola:updated", onColaUpdated);
      socket.off("sesion:started", onSesionStarted);
      socket.off("sesion:updated", onSesionUpdated);
      socket.off("sesion:ended", onSesionEnded);
      socket.off("stats:pujas-timeline", onPujasTimeline);

      disconnectSocket();
    };
  }, [
    sessionId,
    negocioId,
    setQueue,
    setCurrentSong,
    setConnectedUsers,
    setTotalRecaudado,
    endSession,
    setLive,
    setStartedAt,
  ]);
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Map backend "estado" strings to the frontend QueueItem status union. */
function mapEstado(estado: string): QueueItem["status"] {
  switch (estado) {
    case "reproduciendo":
      return "playing";
    case "reproducida":
      return "done";
    case "omitida":
      return "skipped";
    case "pendiente":
    default:
      return "pending";
  }
}
