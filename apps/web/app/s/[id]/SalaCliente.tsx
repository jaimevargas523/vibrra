"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ref, set, remove } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { ClienteProvider, useCliente } from "./ClienteProvider";
import { useSessionRTDB, type PlaylistItem } from "./useSessionRTDB";
import { BottomSheetPuja } from "./BottomSheetPuja";
import { BottomSheetVeto } from "./BottomSheetVeto";
import { CancionItemSwipeable } from "./CancionItemSwipeable";
import { useNowPlayingProgress } from "./useNowPlayingProgress";
import {
  SpeakerHigh,
  Queue,
  MusicNotes,
  MagnifyingGlass,
  Wallet,
  UserCircle,
  Heart,
  MusicNote,
  SpinnerGap,
  Plus,
  ArrowLeft,
  QrCode,
  SignIn,
} from "@phosphor-icons/react";
import { QRCodeSVG } from "qrcode.react";
import { DedicarPage } from "./dedicar/DedicarPage";
import { RegistroScreen } from "./RegistroScreen";
import "./sala.css";

interface Establecimiento {
  id: string;
  nombre: string;
  tipo: string;
  ciudad: string;
  fotoUrl: string | null;
  precioConexion: number;
  precioNominacion: number;
  precioPujaMin: number;
  precioDedicatoria: number;
}

interface CancionActual {
  titulo?: string;
  artista?: string;
  videoId?: string;
  imagen?: string;
  duracion?: string;
  timestamp?: number;
}

interface Props {
  establecimiento: Establecimiento;
  sesionActiva: boolean;
  cancionActual: CancionActual | null;
  playlist: PlaylistItem[];
}

interface SearchResult {
  videoId: string;
  titulo: string;
  artista: string;
  duracion: string;
  duracionSeg: number;
  imagen: string;
  album: string;
}

export function SalaCliente(props: Props) {
  return (
    <ClienteProvider estId={props.establecimiento.id}>
      <SalaClienteInner {...props} />
    </ClienteProvider>
  );
}

// ─── Vista types ────────────────────────────────────────────
type Vista = "espera" | "bienvenida" | "registro" | "alias" | "conexion" | "sala";
type Tab = "sesion" | "buscar" | "saldo" | "perfil";

function SalaClienteInner({
  establecimiento: est,
  sesionActiva: initialSesionActiva,
  cancionActual: initialCancionActual,
  playlist: initialPlaylist,
}: Props) {
  const { visitorId, uid, isRegistered, fpLoading, authLoading, authUser, alias, setAlias, persistAlias, displayName, photoURL, isFirstVisit, saldo, gastarSaldo, bonos, qrValue, spotifyPrefs, disconnectSpotify } = useCliente();

  // Tiempo real desde RTDB
  const { sesionActiva, cancionActual, playlist, estadoReproductor, bloqueado, vetadas } = useSessionRTDB(est.id, {
    initialSesionActiva,
    initialCancionActual,
    initialPlaylist,
  });

  // Filtrar la canción que está sonando actualmente
  const pendientes = cancionActual?.videoId
    ? playlist.filter((item) => item.videoId !== cancionActual.videoId)
    : playlist;

  // Progreso de la canción actual
  const { progress, elapsedText, totalText } = useNowPlayingProgress({
    timestamp: cancionActual?.timestamp,
    duracion: cancionActual?.duracion,
  });

  // Bottom sheets
  const [pujaTarget, setPujaTarget] = useState<PlaylistItem | null>(null);
  const [vetoTarget, setVetoTarget] = useState<PlaylistItem | null>(null);

  // Swipe handlers
  const handleSwipePujar = useCallback((cancionId: string) => {
    const item = playlist.find((c) => c.videoId === cancionId);
    if (item) setPujaTarget(item);
  }, [playlist]);

  const handleSwipeVetar = useCallback((cancionId: string) => {
    const item = playlist.find((c) => c.videoId === cancionId);
    if (item) setVetoTarget(item);
  }, [playlist]);

  // Tabs y búsqueda
  const [activeTab, setActiveTab] = useState<Tab>("sesion");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [nominando, setNominando] = useState<string | null>(null);
  const [showDedicar, setShowDedicar] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Spotify suggestions
  const [suggestions, setSuggestions] = useState<{ category: string; items: SearchResult[] }[]>([]);
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const [vista, setVista] = useState<Vista>(() => {
    if (!initialSesionActiva) return "espera";
    return "bienvenida";
  });

  useEffect(() => {
    if (fpLoading || authLoading) return;
    if (!sesionActiva) {
      setVista("espera");
      return;
    }
    if (vista === "espera" && sesionActiva) {
      if (isRegistered) {
        // Returning registered user → skip welcome
        setVista("alias");
      } else if (!isFirstVisit) {
        setVista("alias");
      } else {
        setVista("bienvenida");
      }
    }
  }, [fpLoading, authLoading, sesionActiva, isRegistered]);

  useEffect(() => {
    if (!sesionActiva && vista === "sala") {
      setVista("espera");
    }
  }, [sesionActiva, vista]);

  // Toast de éxito al conectar Spotify
  const [spotifyToast, setSpotifyToast] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("spotify") === "connected") {
      setSpotifyToast(true);
      params.delete("spotify");
      const newUrl = window.location.pathname + (params.toString() ? `?${params}` : "");
      history.replaceState(null, "", newUrl);
      setTimeout(() => setSpotifyToast(false), 3000);
    }
  }, []);

  // Auto-focus search input cuando se cambia al tab buscar
  useEffect(() => {
    if (activeTab === "buscar") {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [activeTab]);

  // Fetch Spotify suggestions when opening search tab
  useEffect(() => {
    if (activeTab !== "buscar" || suggestionsLoaded || !spotifyPrefs?.connected || !visitorId) return;
    setSuggestionsLoading(true);
    fetch(`/api/spotify/suggestions?visitorId=${visitorId}`)
      .then((res) => res.json())
      .then((data) => {
        setSuggestions(data.suggestions ?? []);
        setSuggestionsLoaded(true);
      })
      .catch(() => setSuggestionsLoaded(true))
      .finally(() => setSuggestionsLoading(false));
  }, [activeTab, suggestionsLoaded, spotifyPrefs, visitorId]);

  // ── Botón atrás: 2 veces para salir ──
  const backPressedRef = useRef(false);
  const backTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (vista !== "sala") return;

    // Siempre mantener una entrada extra en el historial
    history.pushState({ vibrra: true }, "");

    const handlePopState = () => {
      // Cerrar modales/sheets primero
      if (pujaTarget) { setPujaTarget(null); history.pushState({ vibrra: true }, ""); return; }
      if (vetoTarget) { setVetoTarget(null); history.pushState({ vibrra: true }, ""); return; }
      if (showDedicar) { setShowDedicar(false); history.pushState({ vibrra: true }, ""); return; }
      if (activeTab !== "sesion") {
        setActiveTab("sesion");
        setSearchQuery("");
        setSearchResults([]);
        history.pushState({ vibrra: true }, "");
        return;
      }

      // Ya en principal: doble atrás para salir
      if (backPressedRef.current) {
        // Segundo atrás → salir
        return;
      }
      backPressedRef.current = true;
      history.pushState({ vibrra: true }, "");
      if (backTimerRef.current) clearTimeout(backTimerRef.current);
      backTimerRef.current = setTimeout(() => { backPressedRef.current = false; }, 2000);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (backTimerRef.current) clearTimeout(backTimerRef.current);
    };
  }, [vista, activeTab, showDedicar, pujaTarget, vetoTarget]);

  const inicial = est.nombre.charAt(0).toUpperCase();

  const formatSaldo = (valor: number) =>
    `$${valor.toLocaleString("es-CO")}`;

  const PRECIO_VETO = est.precioPujaMin;

  const handlePujaConfirm = async (monto: number) => {
    if (!pujaTarget || !gastarSaldo(monto)) return;
    const pujaRef = ref(rtdb, `sesiones/${est.id}/playlist/items/${pujaTarget.videoId}/puja`);
    await set(pujaRef, pujaTarget.puja + monto);
    setPujaTarget(null);
  };

  const handleVetoConfirm = async () => {
    if (!vetoTarget || !gastarSaldo(PRECIO_VETO)) return;
    // Eliminar de la cola
    await remove(ref(rtdb, `sesiones/${est.id}/playlist/items/${vetoTarget.videoId}`));
    // Agregar a vetadas para que no se pueda volver a nominar
    await set(ref(rtdb, `sesiones/${est.id}/vetadas/${vetoTarget.videoId}`), true);
    setVetoTarget(null);
  };

  // ── Búsqueda con debounce ──
  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setSearchResults(data.results ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => doSearch(value), 400);
  };

  // ── Nominar canción ──
  const handleNominar = async (song: SearchResult) => {
    const precio = est.precioNominacion;
    if (saldo < precio || vetadas.has(song.videoId)) return;

    setNominando(song.videoId);
    try {
      if (!gastarSaldo(precio)) return;

      const itemRef = ref(rtdb, `sesiones/${est.id}/playlist/items/${song.videoId}`);
      await set(itemRef, {
        titulo: song.titulo,
        artista: song.artista,
        duracion: song.duracion,
        imagen: song.imagen,
        origen: alias || "anónimo",
        puja: precio,
        timestamp: Date.now(),
      });
      setActiveTab("sesion");
      setSearchQuery("");
      setSearchResults([]);
    } catch {
      // silencioso
    } finally {
      setNominando(null);
    }
  };

  // ─── ESPERA ─────────────────────────────────────────────────
  if (vista === "espera") {
    return (
      <div style={styles.container}>
        <div style={styles.centrado}>
          <img src="/vibrra-logo.svg" alt="VIBRRA" style={{ height: 36, marginBottom: 40 }} />
          <h1 style={styles.h1}>{est.nombre}</h1>
          <p style={styles.subtipo}>{est.tipo} &middot; {est.ciudad}</p>
          <p style={styles.msgEspera}>
            No hay sesión activa en este momento.<br />Vuelve a intentarlo más tarde.
          </p>
          <span style={styles.slugPill}>vibrra.live/s/{est.id}</span>
        </div>
      </div>
    );
  }

  // ─── BIENVENIDA ─────────────────────────────────────────────
  if (vista === "bienvenida") {
    return (
      <div style={styles.container}>
        <div style={styles.centrado}>
          <img src="/vibrra-logo.svg" alt="VIBRRA" style={{ height: 36, marginBottom: 28 }} />
          <h1 style={styles.h1}>{est.nombre}</h1>
          <p style={styles.subtipo}>{est.tipo} &middot; {est.ciudad}</p>

          <span style={styles.badgeLive}>&#9679; Sesion activa</span>

          <div style={styles.bonosCard}>
            <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Primera vez en VIBRRA</p>
            <p style={styles.bonoItem}>{"\uD83D\uDCB0"} <strong style={{ color: "#FFE566" }}>{formatSaldo(saldo)}</strong> de saldo para pujas</p>
            <p style={styles.bonoItem}>{"\uD83D\uDD0C"} <strong style={{ color: "#FFE566" }}>{bonos.conexionesGratis} conexión gratis</strong> a esta sesión</p>
            <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: 14, marginTop: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#D4A017", marginBottom: 10 }}>Registrate y ademas recibe:</p>
              <p style={{ ...styles.bonoItem, color: "#9A9590", fontSize: 12 }}>{"\uD83C\uDFB5"} 3 nominaciones gratis</p>
              <p style={{ ...styles.bonoItem, color: "#9A9590", fontSize: 12 }}>{"\uD83D\uDD0C"} 1 conexión extra</p>
              <p style={{ ...styles.bonoItem, color: "#9A9590", fontSize: 12 }}>{"\uD83D\uDCB0"} Saldo que no se pierde entre bares</p>
              <p style={{ ...styles.bonoItem, color: "#9A9590", fontSize: 12 }}>{"\uD83D\uDC98"} VIBRRA Match y Dueto</p>
            </div>
          </div>

          <button style={styles.btnPrimario} onClick={() => setVista("registro")}>
            Registrarme — mas beneficios
          </button>
          <button
            style={{ ...styles.btnGhost, marginTop: 12, fontSize: 13, color: "#5A5A5A", display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}
            onClick={() => setVista("alias")}
          >
            <SignIn size={16} weight="bold" />
            Anónimo
          </button>
        </div>
      </div>
    );
  }

  // ─── REGISTRO ──────────────────────────────────────────────
  if (vista === "registro") {
    return (
      <div style={styles.container}>
        <RegistroScreen
          estId={est.id}
          visitorId={visitorId}
          onRegistered={() => setVista("alias")}
          onSkip={() => setVista("alias")}
        />
      </div>
    );
  }

  // ─── ALIAS ──────────────────────────────────────────────────
  if (vista === "alias") {
    const puedeEntrar = alias.trim().length >= 2;
    const handleConfirmarAlias = () => {
      if (!puedeEntrar) return;
      persistAlias(alias);
      setVista("conexion");
    };
    return (
      <div style={styles.container}>
        <div style={styles.centrado}>
          <h2 style={{ ...styles.h1, fontSize: 22 }}>¿Cómo quieres que te conozcan esta noche?</h2>
          <p style={{ color: "#9A9590", fontSize: 13, marginBottom: 28, maxWidth: 280, lineHeight: 1.5 }}>
            Tu alias aparece en la cola cuando nominas una canción.
          </p>
          <input
            type="text"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConfirmarAlias()}
            placeholder="Ej: El Bacán del Parche"
            maxLength={30}
            autoFocus
            style={styles.aliasInput}
          />
          <span style={{ fontSize: 11, color: "#5A5A5A", marginTop: 6 }}>{alias.trim().length}/30</span>
          {!puedeEntrar && alias.length > 0 && (
            <p style={{ fontSize: 11, color: "#D4A017", marginTop: 6 }}>Mínimo 2 caracteres para continuar</p>
          )}
          <button
            style={{
              ...styles.btnPrimario,
              marginTop: 24,
              opacity: puedeEntrar ? 1 : 0.4,
              pointerEvents: puedeEntrar ? "auto" : "none",
            }}
            onClick={handleConfirmarAlias}
          >
            Entrar a la sala
          </button>
        </div>
      </div>
    );
  }

  // ─── CONEXION ───────────────────────────────────────────────
  if (vista === "conexion") {
    const tieneConexionGratis = bonos.conexionesGratis > 0;
    return (
      <div style={styles.container}>
        <div style={styles.centrado}>
          <h2 style={{ ...styles.h1, fontSize: 20 }}>{est.nombre} te da la bienvenida</h2>

          <div style={styles.conexionCard}>
            <p style={{ fontSize: 11, color: "#9A9590", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Conectarse a la sesion</p>
            <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: 28, fontWeight: 900, color: "#FFE566" }}>
              ${est.precioConexion.toLocaleString()} <span style={{ fontSize: 14, color: "#9A9590", fontFamily: "var(--font-montserrat), sans-serif" }}>COP</span>
            </p>
            <p style={{ fontSize: 11, color: "#9A9590", marginTop: 6 }}>Incluye: nominar &middot; pujar &middot; dedicar &middot; vetar</p>
          </div>

          {tieneConexionGratis ? (
            <button style={styles.btnGold} onClick={() => setVista("sala")}>
              Conectarme gratis
            </button>
          ) : (
            <button style={styles.btnGold} onClick={() => setVista("sala")}>
              Conectarme — ${est.precioConexion.toLocaleString()} COP
            </button>
          )}
          <button style={{ ...styles.btnGhost, marginTop: 8 }} onClick={() => setVista("sala")}>Solo quiero ver la cola</button>

          {!isRegistered && (
            <p style={{ fontSize: 11, color: "#5A5A5A", maxWidth: 280, lineHeight: 1.5, marginTop: 12 }}>
              Estas como invitado. Tu saldo se pierde al cerrar el navegador.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ─── SALA ───────────────────────────────────────────────────
  return (
    <div style={{ ...styles.container, justifyContent: "flex-start" }}>
      {/* Spotify toast */}
      {spotifyToast && (
        <div style={{
          position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
          background: "#1DB954", color: "#fff", padding: "10px 20px", borderRadius: 10,
          fontSize: 13, fontWeight: 700, zIndex: 300, display: "flex", alignItems: "center", gap: 8,
          fontFamily: "var(--font-montserrat), sans-serif",
          boxShadow: "0 4px 20px rgba(30,215,96,.4)",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
          Spotify conectado
        </div>
      )}

      {/* Topbar glassmorphism */}
      <div style={styles.topbar}>
        <img src="/vibrra-logo.svg" alt="VIBRRA" style={{ height: 22 }} />
        <span style={{ fontWeight: 600, fontSize: 15, flex: 1 }}>{est.nombre}</span>
        <span style={styles.saldoBadge}>{formatSaldo(saldo)}</span>
        <span style={styles.badgeLiveSmall}>&#9679; EN VIVO</span>
      </div>

      {/* ── Tab: Sesión ── */}
      {activeTab === "sesion" && (
        <>
          {/* Now Playing — hero card */}
          <div style={styles.nowPlayingCard}>
            <div style={styles.nowPlayingGlow} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: "#D4A017", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                <SpeakerHigh size={14} weight="duotone" color="#D4A017" />
                {estadoReproductor === "pausado" ? "EN PAUSA" : "SONANDO AHORA"}
              </div>
              {cancionActual ? (
                <div>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    {cancionActual.imagen && (
                      <img
                        src={cancionActual.imagen}
                        alt=""
                        style={{ width: 72, height: 72, borderRadius: 12, objectFit: "cover", boxShadow: "0 4px 20px rgba(212,160,23,.3)" }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: "var(--font-playfair), serif", fontWeight: 700, fontSize: 17, marginBottom: 2, lineHeight: 1.2 }}>{cancionActual.titulo || "Cancion"}</p>
                      <p style={{ fontSize: 12, color: "#9A9590" }}>{cancionActual.artista || ""}</p>
                    </div>
                  </div>
                  {cancionActual.duracion && (
                    <div style={{ marginTop: 14 }}>
                      <div style={styles.progressTrack}>
                        <div style={{ ...styles.progressBar, width: `${progress * 100}%` }} />
                      </div>
                      <div style={styles.progressTimes}>
                        <span>{elapsedText}</span>
                        <span>{totalText}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: "#5A5A5A" }}>Esperando cancion...</p>
              )}
            </div>
          </div>

          {/* Playlist header */}
          <div style={{ padding: "20px 16px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#9A9590" }}>Siguiente</h3>
            <span style={styles.queueBadge}>
              <Queue size={12} weight="duotone" color="#9A9590" />
              {pendientes.length} en cola
            </span>
          </div>

          {pendientes.length === 0 ? (
            <div style={{ padding: "50px 16px", textAlign: "center" }}>
              <MusicNotes size={48} weight="duotone" color="#333" style={{ marginBottom: 16 }} />
              <p style={{ fontSize: 14, color: "#5A5A5A", lineHeight: 1.6 }}>La cola está vacía.<br />¡Nomina la primera canción!</p>
            </div>
          ) : (
            <>
              <div className="swipe-hint-row">
                <div className="hint-chip veto">← desliza para vetar</div>
                <div className="hint-chip bid">desliza para pujar →</div>
              </div>

              <div style={{ padding: "0 12px", paddingBottom: 150 }}>
                {pendientes.map((item, idx) => (
                  <CancionItemSwipeable
                    key={item.videoId}
                    cancion={item}
                    posicion={idx + 1}
                    esMia={item.origen === visitorId || item.origen === alias}
                    alias={alias}
                    onPujar={handleSwipePujar}
                    onVetar={handleSwipeVetar}
                  />
                ))}
              </div>
            </>
          )}

          {/* Floating action bar — Gold Ember */}
          <div style={styles.fab} className="fab-scanlines fab-enter">
            <div className="fab-border-glow" />
            <div className="fab-ambient-glow" />
            <div style={styles.fabAlias}>
              <UserCircle size={18} weight="duotone" color="#D4A017" />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>@{alias || "anónimo"}</span>
            </div>
            <button style={styles.fabDedicar} onClick={() => setShowDedicar(true)}>
              <Heart size={16} weight="fill" className="fab-heart-icon" />
              <span className="fab-dedicar-text">Dedicar</span>
            </button>
          </div>
        </>
      )}

      {/* ── Tab: Buscar ── */}
      {activeTab === "buscar" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", paddingBottom: 70 }}>
          {/* Search header */}
          <div style={styles.searchHeader}>
            <button style={styles.searchBack} onClick={() => { setActiveTab("sesion"); setSearchQuery(""); setSearchResults([]); }}>
              <ArrowLeft size={20} weight="bold" />
            </button>
            <div style={styles.searchInputWrap}>
              <MagnifyingGlass size={16} weight="duotone" color="#666" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Buscar canción o artista..."
                style={styles.searchInput}
              />
            </div>
          </div>

          {/* Pricing card */}
          <div style={{
            margin: "8px 12px 4px",
            padding: "12px 16px",
            background: "linear-gradient(135deg, rgba(212,160,23,.12), rgba(255,229,102,.06))",
            border: "1px solid rgba(212,160,23,.25)",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}>
            <MusicNotes size={24} weight="duotone" color="#FFE566" />
            <p style={{ fontSize: 12, color: "#F0EDE8", fontWeight: 600, flex: 1 }}>
              Toca una canción para agregarla
            </p>
            <span style={{ fontSize: 26, fontWeight: 900, color: "#FFE566", fontFamily: "var(--font-playfair), serif" }}>
              ${est.precioNominacion.toLocaleString("es-CO")}
            </span>
          </div>

          {/* Search results */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 12px" }}>
            {searching && (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <SpinnerGap size={28} weight="bold" color="#D4A017" className="spin-icon" />
                <p style={{ fontSize: 12, color: "#5A5A5A", marginTop: 10 }}>Buscando...</p>
              </div>
            )}

            {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <MusicNote size={40} weight="duotone" color="#333" />
                <p style={{ fontSize: 13, color: "#5A5A5A", marginTop: 10 }}>Sin resultados para "{searchQuery}"</p>
              </div>
            )}

            {!searching && searchQuery.length < 2 && (
              <>
                {/* Spotify playlists */}
                {spotifyPrefs?.connected && spotifyPrefs.playlists.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 4px 6px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#1DB954" }}>Tus playlists</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, WebkitOverflowScrolling: "touch" }} className="hide-scrollbar">
                      {spotifyPrefs.playlists.map((pl, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setSearchQuery(pl.name);
                            doSearch(pl.name);
                          }}
                          style={{
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "8px 14px",
                            borderRadius: 10,
                            border: "1px solid rgba(30,215,96,.2)",
                            background: "rgba(30,215,96,.06)",
                            color: "#F0EDE8",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "var(--font-montserrat), sans-serif",
                            whiteSpace: "nowrap" as const,
                          }}
                        >
                          {pl.imageUrl ? (
                            <img src={pl.imageUrl} alt="" style={{ width: 24, height: 24, borderRadius: 4, objectFit: "cover" as const }} />
                          ) : (
                            <Queue size={16} weight="duotone" color="#1DB954" />
                          )}
                          {pl.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Spotify artists */}
                {spotifyPrefs?.connected && spotifyPrefs.topArtists.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 4px 6px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#1DB954" }}>Tus artistas</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, WebkitOverflowScrolling: "touch" }} className="hide-scrollbar">
                      {spotifyPrefs.topArtists.map((artist, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setSearchQuery(artist.name);
                            doSearch(artist.name);
                          }}
                          style={{
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "8px 14px",
                            borderRadius: 10,
                            border: "1px solid rgba(255,255,255,.08)",
                            background: "rgba(255,255,255,.04)",
                            color: "#F0EDE8",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "var(--font-montserrat), sans-serif",
                            whiteSpace: "nowrap" as const,
                          }}
                        >
                          {artist.imageUrl ? (
                            <img src={artist.imageUrl} alt="" style={{ width: 24, height: 24, borderRadius: 12, objectFit: "cover" as const }} />
                          ) : (
                            <MusicNote size={16} weight="duotone" color="#9A9590" />
                          )}
                          {artist.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Spotify song suggestions */}
                {spotifyPrefs?.connected && suggestionsLoading && (
                  <div style={{ padding: "40px 0", textAlign: "center" }}>
                    <SpinnerGap size={28} weight="bold" color="#1DB954" className="spin-icon" />
                    <p style={{ fontSize: 12, color: "#5A5A5A", marginTop: 10 }}>Cargando sugerencias...</p>
                  </div>
                )}

                {spotifyPrefs?.connected && !suggestionsLoading && suggestions.length > 0 && (
                  <div style={{ paddingBottom: 16 }}>
                    {suggestions.map((group) => (
                      <div key={group.category} style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 4px", marginBottom: 4 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#1DB954" }}>{group.category}</span>
                        </div>
                        {group.items.map((song) => {
                          const yaEnCola = playlist.some((p) => p.videoId === song.videoId);
                          const isNominando = nominando === song.videoId;
                          const sinSaldo = saldo < est.precioNominacion;
                          const esVetada = vetadas.has(song.videoId);
                          const canNominate = !esVetada && !yaEnCola && !bloqueado && !sinSaldo && !isNominando;
                          return (
                            <div
                              key={song.videoId}
                              onClick={() => canNominate && handleNominar(song)}
                              style={{
                                ...styles.searchItem,
                                cursor: canNominate ? "pointer" : "default",
                                ...(esVetada ? { opacity: 0.35 } : {}),
                              }}
                            >
                              {song.imagen ? (
                                <img src={song.imagen} alt="" style={styles.searchThumb} />
                              ) : (
                                <div style={{ ...styles.searchThumb, background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <MusicNote size={18} weight="duotone" color="#555" />
                                </div>
                              )}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={styles.searchTitle}>{song.titulo}</p>
                                <p style={styles.searchArtist}>{song.artista}</p>
                              </div>
                              {esVetada ? (
                                <span style={{ ...styles.sinSaldoBadge, color: "#E74C3C" }}>Vetada</span>
                              ) : yaEnCola ? (
                                <span style={styles.yaEnColaBadge}>En cola</span>
                              ) : bloqueado ? (
                                <span style={styles.sinSaldoBadge}>Bloqueada</span>
                              ) : sinSaldo ? (
                                <span style={styles.sinSaldoBadge}>Sin saldo</span>
                              ) : (
                                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                                  {isNominando ? (
                                    <SpinnerGap size={18} weight="bold" color="#D4A017" className="spin-icon" />
                                  ) : (
                                    <span style={styles.precioBadge}>
                                      ${est.precioNominacion.toLocaleString("es-CO")}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}

                {/* Default empty state */}
                {(!spotifyPrefs?.connected || (!suggestionsLoading && suggestions.length === 0)) && (
                  <div style={{ padding: "40px 0", textAlign: "center" }}>
                    <MagnifyingGlass size={40} weight="duotone" color="#333" />
                    <p style={{ fontSize: 13, color: "#5A5A5A", marginTop: 10 }}>Escribe para buscar en YouTube Music</p>
                    <p style={{ fontSize: 11, color: "#444", marginTop: 8 }}>
                      Nominar cuesta <span style={{ color: "#FFE566", fontWeight: 600 }}>${est.precioNominacion.toLocaleString("es-CO")}</span>
                      {" · "}Tu saldo: <span style={{ color: "#FFE566", fontWeight: 600 }}>{formatSaldo(saldo)}</span>
                    </p>
                    {!spotifyPrefs && (
                      <button
                        onClick={() => setActiveTab("perfil")}
                        style={{ marginTop: 14, background: "transparent", border: "1px solid rgba(30,215,96,.3)", borderRadius: 8, padding: "6px 14px", color: "#1DB954", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-montserrat), sans-serif", display: "inline-flex", alignItems: "center", gap: 6 }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                        Conecta Spotify para sugerencias
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {searchResults.map((song) => {
              const yaEnCola = playlist.some((p) => p.videoId === song.videoId);
              const isNominando = nominando === song.videoId;
              const sinSaldo = saldo < est.precioNominacion;
              const esVetada = vetadas.has(song.videoId);
              const canNominate = !esVetada && !yaEnCola && !bloqueado && !sinSaldo && !isNominando;
              return (
                <div
                  key={song.videoId}
                  onClick={() => canNominate && handleNominar(song)}
                  style={{
                    ...styles.searchItem,
                    cursor: canNominate ? "pointer" : "default",
                    ...(esVetada ? { opacity: 0.35 } : {}),
                  }}
                >
                  {song.imagen ? (
                    <img src={song.imagen} alt="" style={styles.searchThumb} />
                  ) : (
                    <div style={{ ...styles.searchThumb, background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <MusicNote size={18} weight="duotone" color="#555" />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={styles.searchTitle}>{song.titulo}</p>
                    <p style={styles.searchArtist}>{song.artista}{song.album ? ` · ${song.album}` : ""}</p>
                  </div>
                  {esVetada ? (
                    <span style={{ ...styles.sinSaldoBadge, color: "#E74C3C" }}>Vetada</span>
                  ) : yaEnCola ? (
                    <span style={styles.yaEnColaBadge}>En cola</span>
                  ) : bloqueado ? (
                    <span style={styles.sinSaldoBadge}>Bloqueada</span>
                  ) : sinSaldo ? (
                    <span style={styles.sinSaldoBadge}>Sin saldo</span>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      {isNominando ? (
                        <SpinnerGap size={18} weight="bold" color="#D4A017" className="spin-icon" />
                      ) : (
                        <span style={styles.precioBadge}>
                          ${est.precioNominacion.toLocaleString("es-CO")}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tab: Saldo ── */}
      {activeTab === "saldo" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: 80, paddingTop: 20 }}>
          {/* Saldo actual */}
          <div style={styles.saldoCard}>
            <p style={{ fontSize: 11, color: "#9A9590", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Tu saldo</p>
            <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: 36, fontWeight: 900, color: "#FFE566" }}>
              {formatSaldo(saldo)}
            </p>
            <p style={{ fontSize: 11, color: "#5A5A5A", marginTop: 4 }}>COP</p>
          </div>

          {/* QR para recargar */}
          <div style={styles.qrCard}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#9A9590", textAlign: "center", marginBottom: 16 }}>
              Muestra este QR para recargar
            </p>
            {qrValue ? (
              <div style={styles.qrFrame}>
                <div style={styles.qrContainer}>
                  <QRCodeSVG
                    value={qrValue}
                    size={200}
                    bgColor="#FFFFFF"
                    fgColor="#000000"
                    level="M"
                  />
                </div>
                <p style={{ fontSize: 9, color: "#555", marginTop: 10, fontFamily: "monospace", wordBreak: "break-all", textAlign: "center", letterSpacing: 0.5 }}>
                  {qrValue}
                </p>
              </div>
            ) : (
              <div style={{ padding: 30, textAlign: "center" }}>
                <SpinnerGap size={24} weight="bold" color="#D4A017" className="spin-icon" />
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ padding: "0 24px", marginTop: 16, textAlign: "center" }}>
            <p style={{ fontSize: 11, color: "#5A5A5A", lineHeight: 1.6 }}>
              Tu saldo se actualiza en tiempo real al recargar.
            </p>
          </div>
        </div>
      )}

      {/* ── Tab: Perfil — VIP Badge ── */}
      {activeTab === "perfil" && (
        <div style={styles.perfilContainer}>
          {/* Identity Card */}
          <div style={styles.perfilIdentityCard} className="perfil-card-scanlines">
            <div className="perfil-card-glow" />
            <div className="perfil-bokeh">
              <div className="bokeh-dot" style={{ width: 40, height: 40, top: "20%", left: "15%", animation: "bokehFloat1 6s ease-in-out infinite" }} />
              <div className="bokeh-dot" style={{ width: 25, height: 25, top: "60%", right: "20%", animation: "bokehFloat2 7s ease-in-out infinite" }} />
              <div className="bokeh-dot" style={{ width: 50, height: 50, bottom: "10%", left: "50%", animation: "bokehFloat3 8s ease-in-out infinite" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>
              <div style={styles.perfilAvatarRing}>
                <div style={styles.perfilAvatarInner}>
                  {photoURL ? (
                    <img src={photoURL} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <UserCircle size={38} weight="duotone" color="#D4A017" />
                  )}
                </div>
              </div>
              <p style={styles.perfilAlias}>{alias || "Anónimo"}</p>
              <p style={styles.perfilAliasAt}>@{(alias || "anónimo").toLowerCase().replace(/\s+/g, "")}</p>
              <div style={styles.perfilVenueTag}>
                <span style={{ fontSize: 6, color: "#2ECC71" }}>&#9679;</span>
                {est.nombre} &middot; {est.ciudad}
              </div>
            </div>
          </div>

          {/* Saldo */}
          <div style={styles.perfilSaldoSection}>
            <p style={styles.perfilSaldoLabel}>Tu Saldo</p>
            <p style={styles.perfilSaldoValue}>{formatSaldo(saldo)}</p>
            <p style={styles.perfilSaldoCurrency}>COP</p>
          </div>

          {/* Stats */}
          <div style={styles.perfilStatsRow}>
            <div style={styles.perfilStatChip} className="stat-chip">
              <Queue size={18} weight="duotone" color="#D4A017" />
              <span style={styles.perfilStatValue}>{pendientes.length}</span>
              <span style={styles.perfilStatLabel}>En cola</span>
            </div>
            <div style={styles.perfilStatChip} className="stat-chip">
              <MusicNotes size={18} weight="duotone" color="#2ECC71" />
              <span style={styles.perfilStatValue}>{bonos.nominacionesGratis}</span>
              <span style={styles.perfilStatLabel}>Nomin. gratis</span>
            </div>
            <div style={styles.perfilStatChip} className="stat-chip">
              <Wallet size={18} weight="duotone" color="#FFE566" />
              <span style={{ ...styles.perfilStatValue, color: "#FFE566" }}>{bonos.conexionesGratis}</span>
              <span style={styles.perfilStatLabel}>Conex. gratis</span>
            </div>
          </div>

          {/* Spotify */}
          <div style={{
            margin: "0 16px 16px",
            padding: 16,
            background: "rgba(30, 215, 96, .06)",
            border: "1px solid rgba(30, 215, 96, .15)",
            borderRadius: 14,
          }}>
            {spotifyPrefs ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1DB954" }}>Conectado</span>
                  <span style={{ fontSize: 11, color: "#777", flex: 1 }}>{spotifyPrefs.displayName}</span>
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#9A9590", marginBottom: 12 }}>
                  <span>{spotifyPrefs.topArtists.length} artistas</span>
                  <span>{spotifyPrefs.topTracks.length} canciones</span>
                  <span>{spotifyPrefs.playlists.length} playlists</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => {
                      window.location.href = `/api/spotify/login?visitorId=${visitorId}&returnUrl=${encodeURIComponent(`/s/${est.id}`)}`;
                    }}
                    style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "1px solid rgba(30,215,96,.3)", background: "transparent", color: "#1DB954", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-montserrat), sans-serif" }}
                  >
                    Reconectar
                  </button>
                  <button
                    onClick={disconnectSpotify}
                    style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "1px solid rgba(239,68,68,.3)", background: "transparent", color: "#EF4444", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-montserrat), sans-serif" }}
                  >
                    Desconectar
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#F0EDE8" }}>Conectar Spotify</span>
                </div>
                <p style={{ fontSize: 11, color: "#777", lineHeight: 1.5, marginBottom: 12 }}>
                  Importa tus artistas y canciones favoritas para sugerencias personalizadas
                </p>
                <button
                  onClick={() => {
                    window.location.href = `/api/spotify/login?visitorId=${visitorId}&returnUrl=${encodeURIComponent(`/s/${est.id}`)}`;
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 0",
                    borderRadius: 10,
                    border: "none",
                    background: "#1DB954",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "var(--font-montserrat), sans-serif",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                  Conectar con Spotify
                </button>
              </div>
            )}
          </div>

          {/* Account section */}
          {isRegistered ? (
            <div style={{ ...styles.perfilGuestNotice, borderStyle: "solid", borderColor: "rgba(212,160,23,.15)" }}>
              <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 11, fontWeight: 700, color: "#D4A017", marginBottom: 6 }}>
                Cuenta VIBRRA
              </p>
              <div style={{ fontSize: 12, color: "#9A9590", lineHeight: 1.8, marginBottom: 14 }}>
                {authUser?.phoneNumber && (
                  <p style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9A9590" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    {authUser.phoneNumber}
                  </p>
                )}
                {authUser?.email && (
                  <p style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9A9590" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    {authUser.email}
                  </p>
                )}
              </div>
              <button
                onClick={async () => {
                  const { signOut } = await import("firebase/auth");
                  const { auth: fireAuth } = await import("@/lib/firebase");
                  await signOut(fireAuth);
                  window.location.reload();
                }}
                style={{ width: "100%", padding: "10px 0", borderRadius: 10, border: "1px solid rgba(239,68,68,.3)", background: "transparent", color: "#EF4444", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-montserrat), sans-serif" }}
              >
                Cerrar sesion
              </button>
            </div>
          ) : (
            <div style={styles.perfilGuestNotice}>
              <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 11, fontWeight: 700, color: "#9A9590", marginBottom: 6 }}>
                Modo Invitado
              </p>
              <p style={{ fontSize: 11, color: "#5A5A5A", lineHeight: 1.6, marginBottom: 14 }}>
                Tu saldo y alias se pierden al cerrar el navegador. Registrate para conservar todo.
              </p>
              <button style={styles.perfilRegisterBtn} onClick={() => setVista("registro")}>
                Crear cuenta VIBRRA
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bottom nav */}
      <div style={styles.bottomNav}>
        <button style={{ ...styles.navItem, color: activeTab === "sesion" ? "#FFE566" : "#5A5A5A" }} onClick={() => setActiveTab("sesion")}>
          <MusicNotes size={20} weight="duotone" />
          <span>Sesion</span>
        </button>
        <button style={{ ...styles.navItem, color: activeTab === "buscar" ? "#FFE566" : "#5A5A5A" }} onClick={() => setActiveTab("buscar")}>
          <MagnifyingGlass size={20} weight="duotone" />
          <span>Buscar</span>
        </button>
        <button style={{ ...styles.navItem, color: activeTab === "saldo" ? "#FFE566" : "#5A5A5A" }} onClick={() => setActiveTab("saldo")}>
          <Wallet size={20} weight="duotone" />
          <span>Saldo</span>
        </button>
        <button style={{ ...styles.navItem, color: activeTab === "perfil" ? "#FFE566" : "#5A5A5A" }} onClick={() => setActiveTab("perfil")}>
          <UserCircle size={20} weight="duotone" />
          <span>Perfil</span>
        </button>
      </div>

      {/* Bottom Sheet: Puja */}
      {pujaTarget && (
        <BottomSheetPuja
          cancion={pujaTarget}
          pujaMinima={est.precioPujaMin}
          saldo={saldo}
          onConfirm={handlePujaConfirm}
          onClose={() => setPujaTarget(null)}
        />
      )}

      {/* Bottom Sheet: Veto */}
      {vetoTarget && (
        <BottomSheetVeto
          cancion={vetoTarget}
          precioVeto={PRECIO_VETO}
          saldo={saldo}
          onConfirm={handleVetoConfirm}
          onClose={() => setVetoTarget(null)}
        />
      )}

      {/* Dedicar Page */}
      {showDedicar && (
        <DedicarPage
          estId={est.id}
          precioDedicatoria={est.precioDedicatoria}
          cancionActual={cancionActual}
          playlist={pendientes}
          onClose={() => setShowDedicar(false)}
        />
      )}
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: "var(--font-montserrat), sans-serif",
    background: "#080808",
    color: "#F0EDE8",
    minHeight: "100dvh",
    maxWidth: 430,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
  },
  centrado: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 24px",
    textAlign: "center",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    border: "2px solid #1E1E1E",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28,
    fontWeight: 700,
    color: "#5A5A5A",
    background: "#111111",
    marginBottom: 12,
  },
  h1: {
    fontFamily: "var(--font-playfair), serif",
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 4,
  },
  subtipo: {
    color: "#9A9590",
    fontSize: 13,
    marginBottom: 16,
  },
  msgEspera: {
    color: "#5A5A5A",
    fontSize: 14,
    lineHeight: 1.6,
    maxWidth: 280,
    marginBottom: 32,
  },
  slugPill: {
    fontSize: 11,
    color: "#5A5A5A",
    background: "#111111",
    border: "1px solid #1E1E1E",
    borderRadius: 20,
    padding: "6px 14px",
  },
  badgeLive: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    background: "rgba(46,204,113,.15)",
    color: "#2ECC71",
    marginBottom: 20,
  },
  badgeLiveSmall: {
    fontSize: 10,
    padding: "3px 10px",
    borderRadius: 20,
    background: "rgba(46,204,113,.15)",
    color: "#2ECC71",
    fontWeight: 600,
  },
  saldoBadge: {
    fontSize: 11,
    fontWeight: 700,
    color: "#FFE566",
    background: "rgba(255,229,102,.1)",
    padding: "3px 10px",
    borderRadius: 20,
    marginRight: 6,
  },
  bonosCard: {
    width: "100%",
    padding: 20,
    textAlign: "left",
    background: "linear-gradient(135deg, rgba(46,204,113,.06), rgba(52,152,219,.06))",
    border: "1px solid rgba(46,204,113,.2)",
    borderRadius: 14,
    marginBottom: 16,
  },
  bonoItem: {
    fontSize: 13,
    color: "#F0EDE8",
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  conexionCard: {
    width: "100%",
    padding: 20,
    background: "#111111",
    border: "1px solid #1E1E1E",
    borderRadius: 14,
    marginBottom: 16,
    textAlign: "left",
  },
  btnPrimario: {
    width: "100%",
    padding: 16,
    borderRadius: 12,
    border: "none",
    background: "#D4A017",
    color: "#000000",
    fontFamily: "var(--font-montserrat), sans-serif",
    fontWeight: 700,
    fontSize: 16,
    cursor: "pointer",
  },
  btnSecundario: {
    width: "100%",
    padding: 14,
    borderRadius: 12,
    background: "transparent",
    border: "1.5px solid #D4A017",
    color: "#D4A017",
    fontFamily: "var(--font-montserrat), sans-serif",
    fontWeight: 600,
    fontSize: 15,
    cursor: "pointer",
    marginTop: 12,
  },
  btnGold: {
    width: "100%",
    padding: "12px 20px",
    borderRadius: 8,
    border: "none",
    background: "linear-gradient(135deg, #FFE566, #D4A017)",
    color: "#080808",
    fontFamily: "var(--font-montserrat), sans-serif",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
  btnGhost: {
    width: "100%",
    padding: "12px 20px",
    borderRadius: 8,
    background: "transparent",
    border: "1px solid #1E1E1E",
    color: "#9A9590",
    fontFamily: "var(--font-montserrat), sans-serif",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
  aliasInput: {
    width: "100%",
    maxWidth: 320,
    background: "#111111",
    border: "2px solid #1E1E1E",
    borderRadius: 14,
    padding: 16,
    fontFamily: "var(--font-montserrat), sans-serif",
    fontSize: 18,
    fontWeight: 600,
    color: "#F0EDE8",
    textAlign: "center",
    outline: "none",
  },
  topbar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "14px 16px",
    background: "rgba(12,12,12,.85)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(255,255,255,.04)",
    position: "sticky",
    top: 0,
    zIndex: 50,
  },
  nowPlayingCard: {
    position: "relative" as const,
    margin: "0 12px",
    marginTop: 12,
    padding: "20px 18px",
    background: "rgba(20,20,20,.7)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: "1px solid rgba(212,160,23,.15)",
    borderRadius: 16,
    overflow: "hidden" as const,
  },
  nowPlayingGlow: {
    position: "absolute" as const,
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(212,160,23,.2) 0%, transparent 70%)",
    pointerEvents: "none" as const,
  },
  progressTrack: {
    width: "100%",
    height: 3,
    borderRadius: 2,
    background: "rgba(255,255,255,.08)",
    overflow: "hidden" as const,
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
    background: "linear-gradient(90deg, #D4A017, #FFE566)",
    transition: "width .9s linear",
  },
  progressTimes: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 6,
    fontSize: 10,
    color: "#666",
    fontVariantNumeric: "tabular-nums",
    fontFamily: "var(--font-montserrat), sans-serif",
  },
  queueBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11,
    color: "#9A9590",
    background: "#111",
    padding: "3px 10px",
    borderRadius: 10,
  },
  // ── Floating action bar ──
  fab: {
    position: "fixed" as const,
    bottom: 64,
    left: "50%",
    transform: "translateX(-50%)",
    width: "calc(100% - 24px)",
    maxWidth: 406,
    display: "flex",
    gap: 8,
    padding: "8px 10px",
    background: "rgba(11,11,11,.88)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    borderRadius: 18,
    boxShadow: "0 -8px 40px rgba(0,0,0,.7), 0 0 0 1px rgba(212,160,23,.12)",
    zIndex: 90,
    overflow: "visible",
  },
  fabAlias: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "11px 14px",
    borderRadius: 14,
    background: "linear-gradient(135deg, rgba(212,160,23,.06), rgba(255,229,102,.02))",
    border: "1px solid rgba(212,160,23,.12)",
    color: "#D4A017",
    fontFamily: "var(--font-syne), sans-serif",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.02em",
    minWidth: 0,
    position: "relative" as const,
    zIndex: 1,
  },
  fabDedicar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    padding: "11px 20px",
    borderRadius: 14,
    background: "linear-gradient(135deg, #FFE566, #D4A017)",
    border: "none",
    color: "#080808",
    fontFamily: "var(--font-syne), sans-serif",
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: "0.04em",
    cursor: "pointer",
    boxShadow: "0 2px 16px rgba(212,160,23,.35), inset 0 1px 0 rgba(255,243,163,.4)",
    position: "relative" as const,
    zIndex: 1,
    textTransform: "uppercase" as const,
    flexShrink: 0,
  },
  bottomNav: {
    position: "fixed",
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "100%",
    maxWidth: 430,
    display: "flex",
    justifyContent: "space-around",
    background: "#0C0C0C",
    borderTop: "1px solid #1E1E1E",
    padding: "8px 0 calc(8px + env(safe-area-inset-bottom))",
    zIndex: 100,
  },
  navItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    background: "none",
    border: "none",
    fontSize: 10,
    fontWeight: 500,
    cursor: "pointer",
    padding: "4px 12px",
    fontFamily: "var(--font-montserrat), sans-serif",
  },
  // ── Search ──
  searchHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 12px",
  },
  searchBack: {
    background: "none",
    border: "none",
    color: "#9A9590",
    cursor: "pointer",
    padding: 6,
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
  },
  searchInputWrap: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#111",
    border: "1px solid #1E1E1E",
    borderRadius: 12,
    padding: "10px 14px",
  },
  searchInput: {
    flex: 1,
    background: "none",
    border: "none",
    outline: "none",
    color: "#F0EDE8",
    fontFamily: "var(--font-montserrat), sans-serif",
    fontSize: 14,
  },
  searchItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 6px",
    borderBottom: "1px solid rgba(255,255,255,.04)",
  },
  searchThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    objectFit: "cover" as const,
    flexShrink: 0,
  },
  searchTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "#F0EDE8",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginBottom: 1,
  },
  searchArtist: {
    fontSize: 11,
    color: "#777",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  searchDuration: {
    fontSize: 10,
    color: "#555",
    fontVariantNumeric: "tabular-nums",
    flexShrink: 0,
  },
  precioBadge: {
    padding: "4px 10px",
    borderRadius: 8,
    background: "linear-gradient(135deg, #FFE566, #D4A017)",
    color: "#080808",
    fontSize: 11,
    fontWeight: 800,
    fontFamily: "var(--font-montserrat), sans-serif",
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,
  nominateBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #FFE566, #D4A017)",
    color: "#080808",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },
  yaEnColaBadge: {
    fontSize: 9,
    fontWeight: 700,
    color: "#2ECC71",
    background: "rgba(46,204,113,.12)",
    padding: "3px 8px",
    borderRadius: 8,
    flexShrink: 0,
  },
  sinSaldoBadge: {
    fontSize: 9,
    fontWeight: 700,
    color: "#E74C3C",
    background: "rgba(231,76,60,.12)",
    padding: "3px 8px",
    borderRadius: 8,
    flexShrink: 0,
  },
  // ── Saldo tab ──
  saldoCard: {
    width: "calc(100% - 32px)",
    maxWidth: 380,
    padding: 24,
    background: "linear-gradient(135deg, rgba(212,160,23,.08), rgba(255,229,102,.04))",
    border: "1px solid rgba(212,160,23,.2)",
    borderRadius: 16,
    textAlign: "center" as const,
    marginBottom: 20,
  },
  qrCard: {
    width: "calc(100% - 32px)",
    maxWidth: 380,
    padding: 24,
    background: "rgba(12,12,12,.6)",
    border: "1px solid rgba(212,160,23,.12)",
    borderRadius: 20,
  },
  qrFrame: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    padding: 20,
    background: "radial-gradient(circle at center, rgba(212,160,23,.06) 0%, transparent 70%)",
    borderRadius: 16,
  },
  qrContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    background: "#FFFFFF",
    borderRadius: 16,
  },
  // ── Perfil Tab ──
  perfilContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    paddingBottom: 80,
    paddingTop: 16,
    position: "relative" as const,
    overflow: "hidden" as const,
  },
  perfilIdentityCard: {
    width: "calc(100% - 32px)",
    maxWidth: 380,
    padding: "28px 24px 24px",
    background: "linear-gradient(135deg, rgba(212,160,23,.1) 0%, rgba(138,96,0,.06) 50%, rgba(169,112,16,.08) 100%)",
    backgroundSize: "200% 200%",
    border: "1px solid rgba(212,160,23,.2)",
    borderRadius: 22,
    position: "relative" as const,
    overflow: "hidden" as const,
    animation: "perfilFloatUp 0.6s cubic-bezier(.34,1.56,.64,1) forwards, perfilCardGradient 8s ease infinite",
  },
  perfilAvatarRing: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #FFE566, #D4A017, #A97010)",
    padding: 3,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    boxShadow: "0 4px 24px rgba(212,160,23,.3)",
  },
  perfilAvatarInner: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    background: "#111111",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  perfilAlias: {
    fontFamily: "var(--font-playfair), serif",
    fontSize: 26,
    fontWeight: 900,
    color: "#F0EDE8",
    marginBottom: 4,
    position: "relative" as const,
    zIndex: 1,
  },
  perfilAliasAt: {
    fontFamily: "var(--font-dm-mono), monospace",
    fontSize: 12,
    fontWeight: 400,
    color: "#D4A017",
    letterSpacing: "0.05em",
  },
  perfilVenueTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "4px 12px",
    borderRadius: 20,
    background: "rgba(46,204,113,.08)",
    border: "1px solid rgba(46,204,113,.15)",
    fontSize: 10,
    fontWeight: 600,
    fontFamily: "var(--font-syne), sans-serif",
    color: "#2ECC71",
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
    marginTop: 10,
    position: "relative" as const,
    zIndex: 1,
  },
  perfilSaldoSection: {
    width: "calc(100% - 32px)",
    maxWidth: 380,
    marginTop: 20,
    padding: "22px 20px",
    background: "rgba(17,17,17,.7)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: "1px solid rgba(212,160,23,.12)",
    borderRadius: 18,
    textAlign: "center" as const,
    animation: "perfilFloatUp 0.6s cubic-bezier(.34,1.56,.64,1) 0.1s both",
  },
  perfilSaldoLabel: {
    fontFamily: "var(--font-syne), sans-serif",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase" as const,
    color: "#9A9590",
    marginBottom: 6,
  },
  perfilSaldoValue: {
    fontFamily: "var(--font-playfair), serif",
    fontSize: 40,
    fontWeight: 900,
    color: "#FFE566",
    lineHeight: 1,
    animation: "saldoGlow 3s ease-in-out infinite",
  },
  perfilSaldoCurrency: {
    fontFamily: "var(--font-dm-mono), monospace",
    fontSize: 12,
    color: "#5A5A5A",
    marginTop: 4,
    letterSpacing: "0.1em",
  },
  perfilStatsRow: {
    width: "calc(100% - 32px)",
    maxWidth: 380,
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 10,
    marginTop: 16,
    animation: "perfilFloatUp 0.6s cubic-bezier(.34,1.56,.64,1) 0.2s both",
  },
  perfilStatChip: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 4,
    padding: "14px 8px",
    background: "rgba(17,17,17,.6)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,.05)",
    borderRadius: 16,
  },
  perfilStatValue: {
    fontFamily: "var(--font-syne), sans-serif",
    fontSize: 18,
    fontWeight: 800,
    color: "#F0EDE8",
  },
  perfilStatLabel: {
    fontFamily: "var(--font-montserrat), sans-serif",
    fontSize: 9,
    fontWeight: 600,
    color: "#5A5A5A",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    textAlign: "center" as const,
  },
  perfilGuestNotice: {
    width: "calc(100% - 32px)",
    maxWidth: 380,
    marginTop: 20,
    padding: "16px 20px",
    background: "rgba(17,17,17,.5)",
    border: "1px dashed rgba(255,255,255,.06)",
    borderRadius: 16,
    textAlign: "center" as const,
    animation: "perfilFloatUp 0.6s cubic-bezier(.34,1.56,.64,1) 0.3s both",
  },
  perfilRegisterBtn: {
    width: "100%",
    padding: "12px 0",
    borderRadius: 12,
    border: "1px solid rgba(212,160,23,.25)",
    background: "linear-gradient(135deg, rgba(212,160,23,.08), rgba(255,229,102,.04))",
    color: "#D4A017",
    fontFamily: "var(--font-syne), sans-serif",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    letterSpacing: "0.03em",
  },
};
