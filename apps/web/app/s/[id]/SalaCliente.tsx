"use client";

import { useEffect, useState } from "react";

interface Establecimiento {
  id: string;
  nombre: string;
  tipo: string;
  ciudad: string;
  fotoUrl: string | null;
  precioConexion: number;
}

interface CancionActual {
  titulo?: string;
  artista?: string;
  fuente?: string;
  fuente_id?: string;
  duracion_ms?: number;
}

interface ColaItem {
  id: string;
  titulo: string;
  artista: string;
  fuente: string;
  fuente_id: string;
  duracion_ms: number;
  puja_mayor: number;
  tipo: string;
  timestamp: number;
}

interface Props {
  establecimiento: Establecimiento;
  sesionActiva: boolean;
  cancionActual: CancionActual | null;
  cola: ColaItem[];
}

type Vista = "espera" | "bienvenida" | "alias" | "conexion" | "sala";

export function SalaCliente({
  establecimiento: est,
  sesionActiva,
  cancionActual,
  cola,
}: Props) {
  const [vista, setVista] = useState<Vista>(sesionActiva ? "bienvenida" : "espera");
  const [alias, setAlias] = useState("");

  // Recuperar alias de localStorage si existe
  useEffect(() => {
    const saved = localStorage.getItem("vibrra_alias");
    if (saved) setAlias(saved);
  }, []);

  const inicial = est.nombre.charAt(0).toUpperCase();

  const formatDuracion = (ms: number) => {
    if (!ms) return "";
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  // ─── ESPERA (sin sesion activa) ─────────────────────────────
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

  // ─── BIENVENIDA (paso 1) ────────────────────────────────────
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
            <p style={styles.bonoItem}>{"\uD83D\uDCB0"} <strong style={{ color: "#FFE566" }}>$2.000</strong> de saldo para pujas</p>
            <p style={styles.bonoItem}>{"\uD83D\uDD0C"} <strong style={{ color: "#FFE566" }}>1 conexión gratis</strong> a esta sesión</p>
            <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: 14, marginTop: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#D4A017", marginBottom: 10 }}>Registrate y ademas recibe:</p>
              <p style={{ ...styles.bonoItem, color: "#9A9590", fontSize: 12 }}>{"\uD83C\uDFB5"} 3 nominaciones gratis</p>
              <p style={{ ...styles.bonoItem, color: "#9A9590", fontSize: 12 }}>{"\uD83D\uDD0C"} 1 conexión extra</p>
              <p style={{ ...styles.bonoItem, color: "#9A9590", fontSize: 12 }}>{"\uD83D\uDCB0"} Saldo que no se pierde entre bares</p>
              <p style={{ ...styles.bonoItem, color: "#9A9590", fontSize: 12 }}>{"\uD83D\uDC98"} VIBRRA Match y Dueto</p>
            </div>
          </div>

          <button style={styles.btnPrimario} onClick={() => {/* TODO: navegar a registro */}}>
            Registrarme — más beneficios ✨
          </button>
          <button
            style={styles.btnSecundario}
            onClick={() => setVista("alias")}
          >
            Continuar sin registrarme
          </button>
        </div>
      </div>
    );
  }

  // ─── ALIAS (paso 2) ─────────────────────────────────────────
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
            Entrar a la sala →
          </button>
        </div>
      </div>
    );
  }

  // ─── CONEXION (paso 3) ──────────────────────────────────────
  if (vista === "conexion") {
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

          <button style={styles.btnGold} onClick={() => setVista("sala")}>Conectarme gratis &#9889;</button>
          <button style={{ ...styles.btnGhost, marginTop: 8 }} onClick={() => setVista("sala")}>Solo quiero ver la cola</button>

          <p style={{ fontSize: 11, color: "#5A5A5A", maxWidth: 280, lineHeight: 1.5, marginTop: 12 }}>
            Estas como invitado. Tu saldo se pierde al cerrar el navegador.
          </p>
        </div>
      </div>
    );
  }

  // ─── SALA (sesion activa) ───────────────────────────────────
  return (
    <div style={{ ...styles.container, justifyContent: "flex-start" }}>
      {/* Topbar */}
      <div style={styles.topbar}>
        <img src="/vibrra-logo.svg" alt="VIBRRA" style={{ height: 22 }} />
        <span style={{ fontWeight: 600, fontSize: 15, flex: 1 }}>{est.nombre}</span>
        <span style={styles.badgeLiveSmall}>&#9679; EN VIVO</span>
      </div>

      {/* Now Playing */}
      <div style={styles.nowPlaying}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5, color: "#D4A017", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, background: "#2ECC71", borderRadius: "50%", display: "inline-block" }} />
          SONANDO AHORA
        </div>
        {cancionActual ? (
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            {cancionActual.fuente_id && (
              <img
                src={`https://img.youtube.com/vi/${cancionActual.fuente_id}/mqdefault.jpg`}
                alt=""
                style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover" }}
              />
            )}
            <div>
              <p style={{ fontWeight: 600, fontSize: 15 }}>{cancionActual.titulo || "Cancion"}</p>
              <p style={{ fontSize: 13, color: "#9A9590" }}>{cancionActual.artista || ""}</p>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: "#5A5A5A" }}>Esperando cancion...</p>
        )}
      </div>

      {/* Cola info */}
      <div style={{ padding: "16px 16px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: 14, fontWeight: 600 }}>En cola</h3>
        <span style={{ fontSize: 12, color: "#5A5A5A" }}>{cola.length} canciones</span>
      </div>

      {cola.length === 0 ? (
        <div style={{ padding: "40px 16px", textAlign: "center" }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>{"\uD83C\uDFB5"}</p>
          <p style={{ fontSize: 14, color: "#5A5A5A" }}>La cola está vacía. ¡Sé la primera persona en nominar!</p>
        </div>
      ) : (
        <div style={{ padding: "0 16px", paddingBottom: 140 }}>
          {cola.map((item, idx) => (
            <div key={item.id} style={styles.colaItem}>
              <span style={styles.colaPos}>{idx + 1}</span>
              {item.fuente_id && item.fuente === "youtube" ? (
                <img
                  src={`https://img.youtube.com/vi/${item.fuente_id}/default.jpg`}
                  alt=""
                  style={styles.colaThumb}
                />
              ) : (
                <div style={{ ...styles.colaThumb, background: "#1E1E1E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                  {"\uD83C\uDFB5"}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={styles.colaTitulo}>{item.titulo || "Sin título"}</p>
                <p style={styles.colaArtista}>{item.artista || "Artista desconocido"}</p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                {item.puja_mayor > 0 && (
                  <span style={styles.colaPuja}>${item.puja_mayor.toLocaleString()}</span>
                )}
                <p style={styles.colaDuracion}>{formatDuracion(item.duracion_ms)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action bar */}
      <div style={styles.actionBar}>
        <button style={styles.actionBtnPrimary}>
          <span style={{ fontSize: 20 }}>+</span>
          NOMINAR
        </button>
        <button style={styles.actionBtn}>
          <span style={{ fontSize: 20 }}>&#9993;</span>
          DEDICAR
        </button>
      </div>

      {/* Bottom nav */}
      <div style={styles.bottomNav}>
        <div style={{ ...styles.navItem, color: "#FFE566" }}>
          <span style={{ fontSize: 20 }}>&#9835;</span>
          <span>Sesion</span>
        </div>
        <div style={styles.navItem}>
          <span style={{ fontSize: 20 }}>&#128269;</span>
          <span>Buscar</span>
        </div>
        <div style={styles.navItem}>
          <span style={{ fontSize: 20 }}>&#128176;</span>
          <span>Saldo</span>
        </div>
        <div style={styles.navItem}>
          <span style={{ fontSize: 20 }}>&#9786;</span>
          <span>Perfil</span>
        </div>
      </div>
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
    background: "#0C0C0C",
    borderBottom: "1px solid #1E1E1E",
    position: "sticky",
    top: 0,
    zIndex: 50,
  },
  nowPlaying: {
    background: "linear-gradient(180deg, rgba(212,160,23,.1) 0%, #080808 100%)",
    padding: "20px 16px 16px",
  },
  actionBar: {
    position: "fixed",
    bottom: 60,
    left: "50%",
    transform: "translateX(-50%)",
    width: "calc(100% - 32px)",
    maxWidth: 398,
    display: "flex",
    gap: 8,
    padding: 10,
    background: "#111111",
    border: "1px solid #1E1E1E",
    borderRadius: 14,
    boxShadow: "0 -4px 24px rgba(0,0,0,.5)",
    zIndex: 90,
  },
  actionBtnPrimary: {
    flex: 2,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    padding: "10px 4px",
    borderRadius: 8,
    background: "linear-gradient(135deg, #FFE566, #D4A017)",
    border: "none",
    color: "#080808",
    fontFamily: "var(--font-montserrat), sans-serif",
    fontSize: 10,
    fontWeight: 600,
    cursor: "pointer",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  actionBtn: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    padding: "10px 4px",
    borderRadius: 8,
    background: "#0C0C0C",
    border: "1px solid #1E1E1E",
    color: "#9A9590",
    fontFamily: "var(--font-montserrat), sans-serif",
    fontSize: 10,
    fontWeight: 600,
    cursor: "pointer",
    textTransform: "uppercase",
    letterSpacing: 0.3,
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
    color: "#5A5A5A",
    fontSize: 10,
    fontWeight: 500,
    cursor: "pointer",
    padding: "4px 12px",
  },
  colaItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 0",
    borderBottom: "1px solid #1E1E1E",
  },
  colaPos: {
    width: 20,
    fontSize: 12,
    fontWeight: 600,
    color: "#5A5A5A",
    textAlign: "center" as const,
    flexShrink: 0,
  },
  colaThumb: {
    width: 44,
    height: 44,
    borderRadius: 6,
    objectFit: "cover" as const,
    flexShrink: 0,
  },
  colaTitulo: {
    fontSize: 13,
    fontWeight: 600,
    color: "#F0EDE8",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  colaArtista: {
    fontSize: 11,
    color: "#9A9590",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  colaPuja: {
    fontSize: 11,
    fontWeight: 700,
    color: "#FFE566",
    background: "rgba(255,229,102,.1)",
    padding: "2px 8px",
    borderRadius: 10,
  },
  colaDuracion: {
    fontSize: 10,
    color: "#5A5A5A",
    marginTop: 2,
  },
};
