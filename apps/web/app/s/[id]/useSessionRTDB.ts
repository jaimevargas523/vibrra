"use client";

import { useEffect, useMemo, useState } from "react";
import { ref, onValue } from "firebase/database";
import { rtdb } from "@/lib/firebase";

interface CancionActual {
  titulo?: string;
  artista?: string;
  videoId?: string;
  imagen?: string;
  duracion?: string;
  timestamp?: number;
  intrusiones?: number;
}

export interface PlaylistItem {
  videoId: string;
  titulo: string;
  artista: string;
  imagen: string;
  origen: string;
  duracion: string;
  puja: number;
  timestamp: number;
}

interface UseSessionRTDBOptions {
  initialSesionActiva: boolean;
  initialCancionActual: CancionActual | null;
  initialPlaylist: PlaylistItem[];
}

export function useSessionRTDB(estId: string, options: UseSessionRTDBOptions) {
  const [flagActiva, setFlagActiva] = useState(options.initialSesionActiva);
  const [cancionActual, setCancionActual] = useState<CancionActual | null>(options.initialCancionActual);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>(options.initialPlaylist);
  const [estadoReproductor, setEstadoReproductor] = useState<string>("");
  const [bloqueado, setBloqueado] = useState(false);
  const [vetadas, setVetadas] = useState<Set<string>>(new Set());

  // Sesión activa = estado_reproductor no es MANUAL
  const sesionActiva = useMemo(
    () => estadoReproductor !== "MANUAL",
    [estadoReproductor],
  );

  useEffect(() => {
    const activaRef = ref(rtdb, `sesiones/${estId}/activa`);
    const cancionRef = ref(rtdb, `sesiones/${estId}/Cancion_reproduccion`);
    const playlistRef = ref(rtdb, `sesiones/${estId}/playlist`);
    const estadoRef = ref(rtdb, `sesiones/${estId}/estado_reproductor`);
    const bloqueadoRef = ref(rtdb, `sesiones/${estId}/playlist/bloqueado`);

    const unsubActiva = onValue(activaRef, (snap) => {
      setFlagActiva(snap.val() === true);
    });

    const unsubCancion = onValue(cancionRef, (snap) => {
      setCancionActual(snap.val() ?? null);
    });

    const unsubPlaylist = onValue(playlistRef, (snap) => {
      const data = snap.val();
      if (!data?.items || typeof data.items !== "object") {
        setPlaylist([]);
        return;
      }
      const items: PlaylistItem[] = Object.entries(data.items).map(
        ([videoId, val]: [string, any]) => ({
          videoId,
          titulo: val.titulo ?? "",
          artista: val.artista ?? "",
          imagen: val.imagen ?? "",
          origen: val.origen ?? "youtube",
          duracion: val.duracion ?? "",
          puja: val.puja ?? 0,
          timestamp: val.timestamp ?? 0,
        })
      );
      items.sort((a, b) => b.puja - a.puja || a.timestamp - b.timestamp);
      setPlaylist(items);
    });

    const unsubEstado = onValue(estadoRef, (snap) => {
      setEstadoReproductor(snap.val() ?? "");
    });

    const unsubBloqueado = onValue(bloqueadoRef, (snap) => {
      setBloqueado(snap.val() === true);
    });

    const vetadasRef = ref(rtdb, `sesiones/${estId}/vetadas`);
    const unsubVetadas = onValue(vetadasRef, (snap) => {
      const data = snap.val();
      setVetadas(data ? new Set(Object.keys(data)) : new Set());
    });

    return () => {
      unsubActiva();
      unsubCancion();
      unsubPlaylist();
      unsubEstado();
      unsubBloqueado();
      unsubVetadas();
    };
  }, [estId]);

  return { sesionActiva, cancionActual, playlist, estadoReproductor, bloqueado, vetadas };
}
