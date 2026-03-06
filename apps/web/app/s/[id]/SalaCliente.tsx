"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ref, set } from "firebase/database";
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
} from "@phosphor-icons/react";
import { QRCodeSVG } from "qrcode.react";
import { DedicarPage } from "./dedicar/DedicarPage";
import "./sala.css";

interface Establecimiento {
  id: string;
  nombre: string;
  tipo: string;
  ciudad: string;
  fotoUrl: string | null;
  precioConexion: number;
  precioNominacion: number;
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
type Vista = "espera" | "bienvenida" | "alias" | "conexion" | "sala";
type Tab = "sesion" | "buscar" | "saldo" | "perfil";

function SalaClienteInner({
  establecimiento: est,
  sesionActiva: initialSesionActiva,
  cancionActual: initialCancionActual,
  playlist: initialPlaylist,
}: Props) {
  const { visitorId, fpLoading, alias, setAlias, isFirstVisit, saldo, gastarSaldo, bonos } = useCliente();

  // Tiempo real desde RTDB
  const { sesionActiva, cancionActual, playlist, estadoReproductor, bloqueado } = useSessionRTDB(est.id, {
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

  const [vista, setVista] = useState<Vista>(() => {
    if (!initialSesionActiva) return "espera";
    return "bienvenida";
  });

  useEffect(() => {
    if (fpLoading) return;
    if (!sesionActiva) {
      setVista("espera");
      return;
    }
    if (vista === "espera" && sesionActiva) {
      if (!isFirstVisit && alias.trim().length >= 2) {
        setVista("conexion");
      } else if (!isFirstVisit) {
        setVista("alias");
      } else {
        setVista("bienvenida");
      }
    }
  }, [fpLoading, sesionActiva]);

  useEffect(() => {
    if (!sesionActiva && vista === "sala") {
      setVista("espera");
    }
  }, [sesionActiva, vista]);

  // Auto-focus search input cuando se cambia al tab buscar
  useEffect(() => {
    if (activeTab === "buscar") {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [activeTab]);

  const inicial = est.nombre.charAt(0).toUpperCase();

  const formatSaldo = (valor: number) =>
    `$${valor.toLocaleString("es-CO")}`;

  const PRECIO_VETO = 1000;

  const handlePujaConfirm = (monto: number) => {
    // TODO: enviar puja a RTDB
    setPujaTarget(null);
  };

  const handleVetoConfirm = () => {
    // TODO: enviar veto a RTDB
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
    if (saldo < precio) return;

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
          <div style={styles.avatar}>{inicial}</div>
          <h1 style={styles.h1}>{est.nombre}</h1>
          <p style={styles.subtipo}>{est.tipo} &middot; {est.ciudad}</p>
          <p style={styles.msgEspera}>
            No hay sesion activa en este momento.<br />Pronto habra musica.
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
          <div style={{ ...styles.avatar, borderColor: "#D4A017", background: "linear-gradient(135deg, #D4A017, #A97010)", color: "#080808" }}>
            {inicial}
          </div>
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

          <button style={styles.btnPrimario} onClick={() => {/* TODO: navegar a registro */}}>
            Registrarme — más beneficios
          </button>
          <button
            style={styles.btnSecundario}
            onClick={() => setVista(alias.trim().length >= 2 ? "conexion" : "alias")}
          >
            Continuar sin registrarme
          </button>
        </div>
      </div>
    );
  }

  // ─── ALIAS ──────────────────────────────────────────────────
  if (vista === "alias") {
    const puedeEntrar = alias.trim().length >= 2;
    const handleConfirmarAlias = () => {
      if (!puedeEntrar) return;
      localStorage.setItem("vibrra_alias", alias.trim());
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

          <p style={{ fontSize: 11, color: "#5A5A5A", maxWidth: 280, lineHeight: 1.5, marginTop: 12 }}>
            Estas como invitado. Tu saldo se pierde al cerrar el navegador.
          </p>
        </div>
      </div>
    );
  }

  // ─── SALA ───────────────────────────────────────────────────
  return (
    <div style={{ ...styles.container, justifyContent: "flex-start" }}>
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

          {/* Floating action bar */}
          <div style={styles.fab}>
            <button style={styles.fabDedicar} onClick={() => setShowDedicar(true)}>
              <Heart size={16} weight="duotone" />
              <span>Dedicar</span>
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
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <MagnifyingGlass size={40} weight="duotone" color="#333" />
                <p style={{ fontSize: 13, color: "#5A5A5A", marginTop: 10 }}>Escribe para buscar en YouTube Music</p>
                <p style={{ fontSize: 11, color: "#444", marginTop: 8 }}>
                  Nominar cuesta <span style={{ color: "#FFE566", fontWeight: 600 }}>${est.precioNominacion.toLocaleString("es-CO")}</span>
                  {" · "}Tu saldo: <span style={{ color: "#FFE566", fontWeight: 600 }}>{formatSaldo(saldo)}</span>
                </p>
              </div>
            )}

            {searchResults.map((song) => {
              const yaEnCola = playlist.some((p) => p.videoId === song.videoId);
              const isNominando = nominando === song.videoId;
              const sinSaldo = saldo < est.precioNominacion;
              return (
                <div key={song.videoId} style={styles.searchItem}>
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
                  <span style={styles.searchDuration}>{song.duracion}</span>
                  {yaEnCola ? (
                    <span style={styles.yaEnColaBadge}>En cola</span>
                  ) : bloqueado ? (
                    <span style={styles.sinSaldoBadge}>Bloqueada</span>
                  ) : sinSaldo ? (
                    <span style={styles.sinSaldoBadge}>Sin saldo</span>
                  ) : (
                    <button
                      style={{
                        ...styles.nominateBtn,
                        opacity: isNominando ? 0.5 : 1,
                      }}
                      disabled={isNominando}
                      onClick={() => handleNominar(song)}
                    >
                      <Plus size={16} weight="bold" />
                    </button>
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
            {visitorId ? (
              <div style={styles.qrFrame}>
                <div style={styles.qrContainer}>
                  <QRCodeSVG
                    value={visitorId}
                    size={200}
                    bgColor="transparent"
                    fgColor="#D4A017"
                    level="H"
                    imageSettings={{
                      src: "/vibrra-logo.svg",
                      x: undefined,
                      y: undefined,
                      height: 36,
                      width: 36,
                      excavate: true,
                    }}
                  />
                </div>
                <p style={{ fontSize: 9, color: "#555", marginTop: 10, fontFamily: "monospace", wordBreak: "break-all", textAlign: "center", letterSpacing: 0.5 }}>
                  {visitorId}
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

      {/* ── Tab: Perfil (placeholder) ── */}
      {activeTab === "perfil" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingBottom: 70 }}>
          <UserCircle size={48} weight="duotone" color="#333" />
          <p style={{ fontSize: 16, fontWeight: 600, marginTop: 16 }}>@{alias || "anónimo"}</p>
          <p style={{ fontSize: 12, color: "#5A5A5A", marginTop: 6 }}>Próximamente: perfil y estadísticas</p>
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
    padding: 8,
    background: "rgba(16,16,16,.9)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: "1px solid rgba(255,255,255,.06)",
    borderRadius: 16,
    boxShadow: "0 -8px 32px rgba(0,0,0,.6)",
    zIndex: 90,
  },
  fabDedicar: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "12px 4px",
    borderRadius: 12,
    background: "rgba(255,255,255,.04)",
    border: "1px solid rgba(255,255,255,.08)",
    color: "#9A9590",
    fontFamily: "var(--font-montserrat), sans-serif",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
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
    background: "rgba(8,8,8,.9)",
    border: "2px solid rgba(212,160,23,.25)",
    borderRadius: 16,
    boxShadow: "0 0 40px rgba(212,160,23,.1), inset 0 0 30px rgba(212,160,23,.03)",
  },
};
