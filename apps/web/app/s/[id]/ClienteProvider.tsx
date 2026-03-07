"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { ref, onValue, remove, set as rtdbSet } from "firebase/database";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { rtdb, db, auth } from "@/lib/firebase";
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
  // Identity
  visitorId: string | null;
  uid: string | null;
  isRegistered: boolean;
  fpLoading: boolean;
  authLoading: boolean;
  authUser: User | null;

  // Profile
  alias: string;
  setAlias: (v: string) => void;
  persistAlias: (v: string) => void;
  displayName: string;
  photoURL: string | null;
  isFirstVisit: boolean;

  // Balance
  saldo: number;
  gastarSaldo: (monto: number) => boolean;
  bonos: Bonos;

  // QR
  qrValue: string;

  // Spotify
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

  // Auth state
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const uid = authUser?.uid ?? null;
  const isRegistered = !!uid;

  // Profile
  const [alias, _setAlias] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  // Balance
  const [saldo, setSaldo] = useState(0);
  const [bonos, setBonos] = useState<Bonos>({ conexionesGratis: 0, nominacionesGratis: 0 });
  const [anonRegistrado, setAnonRegistrado] = useState(false);

  // Spotify
  const [spotifyPrefs, setSpotifyPrefs] = useState<SpotifyPrefs | null>(null);

  // Ref for gastarSaldo closure
  const saldoRef = useRef(saldo);
  useEffect(() => { saldoRef.current = saldo; }, [saldo]);
  const idTokenRef = useRef<string | null>(null);

  // ── Firebase Auth listener ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Keep ID token ref fresh for API calls
  useEffect(() => {
    if (!authUser) { idTokenRef.current = null; return; }
    authUser.getIdToken().then((t) => { idTokenRef.current = t; });
  }, [authUser]);

  const setAlias = useCallback((v: string) => _setAlias(v), []);

  // ── Persist alias ──
  const persistAlias = useCallback((v: string) => {
    const trimmed = v.trim();
    _setAlias(trimmed);
    localStorage.setItem(ALIAS_KEY, trimmed);

    if (uid) {
      // Registered: write to Firestore
      updateDoc(doc(db, "Clientes", uid), { alias: trimmed }).catch(() => {});
    } else if (visitorId && trimmed) {
      // Anonymous: write to RTDB
      rtdbSet(ref(rtdb, `Anonimos/${visitorId}/alias`), trimmed);
    }
  }, [visitorId, uid]);

  // ── Recover alias from localStorage ──
  useEffect(() => {
    const savedAlias = localStorage.getItem(ALIAS_KEY);
    if (savedAlias) {
      _setAlias(savedAlias);
      if (!uid && visitorId) {
        rtdbSet(ref(rtdb, `Anonimos/${visitorId}/alias`), savedAlias);
      }
    }
    const visited = localStorage.getItem(visitedKey(estId));
    if (visited) setIsFirstVisit(false);
  }, [estId, visitorId, uid]);

  // ════════════════════════════════════════════════════════════
  //  REGISTERED MODE — Firestore listeners
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!uid) return;

    const unsub = onSnapshot(doc(db, "Clientes", uid), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setSaldo(data.saldo ?? 0);
      setBonos({
        conexionesGratis: data.bonos_conexiones ?? 0,
        nominacionesGratis: data.bonos_canciones ?? 0,
      });
      if (data.alias) _setAlias(data.alias);
      if (data.displayName) setDisplayName(data.displayName);
      if (data.photoURL) setPhotoURL(data.photoURL);

      // Spotify from Firestore
      if (data.spotify?.connected) {
        setSpotifyPrefs({
          connected: true,
          importedAt: data.spotify.importedAt ?? 0,
          displayName: data.spotify.displayName ?? "Spotify",
          topArtists: data.spotify.topArtists ?? [],
          topTracks: data.spotify.topTracks ?? [],
          playlists: data.spotify.playlists ?? [],
        });
      } else {
        setSpotifyPrefs(null);
      }

      // Mark first visit
      if (!localStorage.getItem(visitedKey(estId))) {
        localStorage.setItem(visitedKey(estId), uid);
      }
      setIsFirstVisit(false);
    });

    return () => unsub();
  }, [uid, estId]);

  // Set display name from auth user
  useEffect(() => {
    if (authUser) {
      if (authUser.displayName) setDisplayName(authUser.displayName);
      if (authUser.photoURL) setPhotoURL(authUser.photoURL);
    }
  }, [authUser]);

  // ════════════════════════════════════════════════════════════
  //  ANONYMOUS MODE — RTDB registration + listeners
  // ════════════════════════════════════════════════════════════

  // Register anonymous client
  useEffect(() => {
    if (authLoading || isRegistered) return; // Skip if auth still loading or user is registered
    if (!visitorId || anonRegistrado) return;
    const id = visitorId;
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
        if (!visited) localStorage.setItem(visitedKey(estId), id);
        setAnonRegistrado(true);
      } catch {
        if (!visited) {
          setIsFirstVisit(true);
          setSaldo(2000);
          setBonos({ conexionesGratis: 1, nominacionesGratis: 0 });
          localStorage.setItem(visitedKey(estId), id);
        }
        setAnonRegistrado(true);
      }
    }
    registrar();
  }, [visitorId, estId, anonRegistrado, authLoading, isRegistered]);

  // RTDB listeners (anonymous only)
  useEffect(() => {
    if (!visitorId || isRegistered) return;

    const saldoRefDb = ref(rtdb, `Anonimos/${visitorId}/saldo`);
    const bonosRefDb = ref(rtdb, `Anonimos/${visitorId}/bonos`);

    const unsubSaldo = onValue(saldoRefDb, (snap) => {
      const val = snap.val();
      if (val !== null) setSaldo(val);
    });

    const unsubBonos = onValue(bonosRefDb, (snap) => {
      const val = snap.val();
      if (val) setBonos(val);
    });

    return () => {
      unsubSaldo();
      unsubBonos();
    };
  }, [visitorId, isRegistered]);

  // Spotify listener (anonymous only)
  useEffect(() => {
    if (!visitorId || isRegistered) return;
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
  }, [visitorId, isRegistered]);

  // ── Disconnect Spotify ──
  const disconnectSpotify = useCallback(() => {
    if (uid) {
      updateDoc(doc(db, "Clientes", uid), { spotify: null }).catch(() => {});
    } else if (visitorId) {
      remove(ref(rtdb, `Anonimos/${visitorId}/spotify`));
    }
    setSpotifyPrefs(null);
  }, [visitorId, uid]);

  // ── Gastar saldo ──
  const gastarSaldo = useCallback((monto: number): boolean => {
    if (saldoRef.current < monto) return false;

    if (uid && idTokenRef.current) {
      // Registered: optimistic update + API call
      const nuevoSaldo = saldoRef.current - monto;
      setSaldo(nuevoSaldo);
      saldoRef.current = nuevoSaldo;

      fetch("/api/cliente/gastar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idTokenRef.current}`,
        },
        body: JSON.stringify({ monto, tipo: "gasto", estId }),
      }).catch(() => {
        // If API fails, Firestore onSnapshot will correct the value
      });
      return true;
    }

    if (visitorId) {
      // Anonymous: direct RTDB write
      const nuevoSaldo = saldoRef.current - monto;
      setSaldo(nuevoSaldo);
      saldoRef.current = nuevoSaldo;
      rtdbSet(ref(rtdb, `Anonimos/${visitorId}/saldo`), nuevoSaldo);
      return true;
    }

    return false;
  }, [uid, visitorId, estId]);

  // ── QR value ──
  const qrValue = uid
    ? `client:${uid}`
    : visitorId
      ? `anon:${visitorId}`
      : "";

  return (
    <ClienteContext.Provider
      value={{
        visitorId, uid, isRegistered, fpLoading, authLoading, authUser,
        alias, setAlias, persistAlias, displayName, photoURL, isFirstVisit,
        saldo, gastarSaldo, bonos, qrValue,
        spotifyPrefs, disconnectSpotify,
      }}
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
