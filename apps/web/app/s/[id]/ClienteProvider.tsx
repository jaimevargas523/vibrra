"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { ref, onValue, remove, set as rtdbSet } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { useFingerprint } from "./useFingerprint";

interface Bonos {
  conexionesGratis: number;
  nominacionesGratis: number;
}

export interface SpotifyPrefs {
  connected: boolean;
  importedAt: number;
  displayName: string;
  topArtists: Array<{ name: string; genres: string[]; imageUrl: string }>;
  topTracks: Array<{ name: string; artist: string; album: string; imageUrl: string }>;
  playlists: Array<{ name: string; trackCount: number; imageUrl: string }>;
}

interface ClienteState {
  visitorId: string | null;
  fpLoading: boolean;
  alias: string;
  setAlias: (v: string) => void;
  persistAlias: (v: string) => void;
  isFirstVisit: boolean;
  saldo: number;
  gastarSaldo: (monto: number) => boolean;
  bonos: Bonos;
  spotifyPrefs: SpotifyPrefs | null;
  disconnectSpotify: () => void;
}

const ClienteContext = createContext<ClienteState | null>(null);

const ALIAS_KEY = "vibrra_alias";

function visitedKey(estId: string) {
  return `vibrra_visited_${estId}`;
}

export function ClienteProvider({ estId, children }: { estId: string; children: ReactNode }) {
  const { visitorId, loading: fpLoading } = useFingerprint();
  const [alias, _setAlias] = useState("");
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [saldo, setSaldo] = useState(0);
  const [bonos, setBonos] = useState<Bonos>({ conexionesGratis: 0, nominacionesGratis: 0 });
  const [registrado, setRegistrado] = useState(false);
  const [spotifyPrefs, setSpotifyPrefs] = useState<SpotifyPrefs | null>(null);

  const setAlias = useCallback((v: string) => _setAlias(v), []);

  /** Persiste alias en localStorage y RTDB (llamar solo al confirmar) */
  const persistAlias = useCallback((v: string) => {
    const trimmed = v.trim();
    _setAlias(trimmed);
    localStorage.setItem(ALIAS_KEY, trimmed);
    if (visitorId && trimmed) {
      rtdbSet(ref(rtdb, `Anonimos/${visitorId}/alias`), trimmed);
    }
  }, [visitorId]);

  // Recuperar alias desde localStorage y sincronizar a RTDB
  useEffect(() => {
    const savedAlias = localStorage.getItem(ALIAS_KEY);
    if (savedAlias) {
      _setAlias(savedAlias);
      if (visitorId) {
        rtdbSet(ref(rtdb, `Anonimos/${visitorId}/alias`), savedAlias);
      }
    }

    const visited = localStorage.getItem(visitedKey(estId));
    if (visited) setIsFirstVisit(false);
  }, [estId, visitorId]);

  // Registrar cliente anónimo en Firebase cuando tenemos fingerprint
  useEffect(() => {
    if (!visitorId || registrado) return;
    const id = visitorId; // narrow para evitar null en closures

    const visited = localStorage.getItem(visitedKey(estId));

    async function registrar() {
      try {
        const res = await fetch("/api/cliente-anonimo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitorId: id, estId }),
        });
        const data = await res.json();

        if (data.isNew) {
          setIsFirstVisit(true);
        } else if (visited) {
          setIsFirstVisit(false);
        }

        if (!visited) {
          localStorage.setItem(visitedKey(estId), id);
        }

        setRegistrado(true);
      } catch {
        if (!visited) {
          setIsFirstVisit(true);
          setSaldo(2000);
          setBonos({ conexionesGratis: 1, nominacionesGratis: 0 });
          localStorage.setItem(visitedKey(estId), id);
        }
        setRegistrado(true);
      }
    }

    registrar();
  }, [visitorId, estId, registrado]);

  // Escuchar saldo y bonos en tiempo real desde RTDB
  useEffect(() => {
    if (!visitorId) return;

    const saldoRef = ref(rtdb, `Anonimos/${visitorId}/saldo`);
    const bonosRef = ref(rtdb, `Anonimos/${visitorId}/bonos`);

    const unsubSaldo = onValue(saldoRef, (snap) => {
      const val = snap.val();
      if (val !== null) setSaldo(val);
    });

    const unsubBonos = onValue(bonosRef, (snap) => {
      const val = snap.val();
      if (val) setBonos(val);
    });

    return () => {
      unsubSaldo();
      unsubBonos();
    };
  }, [visitorId]);

  // Escuchar preferencias de Spotify en tiempo real
  useEffect(() => {
    if (!visitorId) return;
    const spotifyRef = ref(rtdb, `Anonimos/${visitorId}/spotify`);
    const unsub = onValue(spotifyRef, (snap) => {
      const val = snap.val();
      if (val?.connected) {
        setSpotifyPrefs({
          connected: true,
          importedAt: val.importedAt ?? 0,
          displayName: val.displayName ?? "Spotify",
          topArtists: val.topArtists ?? [],
          topTracks: val.topTracks ?? [],
          playlists: val.playlists ?? [],
        });
      } else {
        setSpotifyPrefs(null);
      }
    });
    return () => unsub();
  }, [visitorId]);

  const disconnectSpotify = useCallback(() => {
    if (!visitorId) return;
    remove(ref(rtdb, `Anonimos/${visitorId}/spotify`));
    setSpotifyPrefs(null);
  }, [visitorId]);

  /** Descuenta del saldo si hay suficiente. Escribe a RTDB. */
  const gastarSaldo = useCallback((monto: number): boolean => {
    if (saldo < monto || !visitorId) return false;
    const nuevoSaldo = saldo - monto;
    setSaldo(nuevoSaldo);
    // Escribir a RTDB para persistencia
    rtdbSet(ref(rtdb, `Anonimos/${visitorId}/saldo`), nuevoSaldo);
    return true;
  }, [saldo, visitorId]);

  return (
    <ClienteContext.Provider
      value={{ visitorId, fpLoading, alias, setAlias, persistAlias, isFirstVisit, saldo, gastarSaldo, bonos, spotifyPrefs, disconnectSpotify }}
    >
      {children}
    </ClienteContext.Provider>
  );
}

export function useCliente() {
  const ctx = useContext(ClienteContext);
  if (!ctx) throw new Error("useCliente debe usarse dentro de ClienteProvider");
  return ctx;
}
