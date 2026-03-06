"use client";

import { ArrowFatUp, Prohibit, MusicNotes } from "@phosphor-icons/react";
import { useSwipeCola } from "./useSwipeCola";
import type { PlaylistItem } from "./useSessionRTDB";
import "./sala.css";

interface Props {
  cancion: PlaylistItem;
  posicion: number;
  esMia: boolean;
  alias: string;
  onPujar: (cancionId: string) => void;
  onVetar: (cancionId: string) => void;
}

/**
 * Ítem de la cola con soporte de swipe gestural.
 * - Swipe derecho  → dispara onPujar(videoId)
 * - Swipe izquierdo → dispara onVetar(videoId)
 * - Fondo de reveal aparece proporcionalmente al desplazamiento
 * - Sin botones de Pujar/Vetar visibles — la UI queda limpia
 */
export function CancionItemSwipeable({ cancion, posicion, esMia, alias, onPujar, onVetar }: Props) {
  const { itemRef, wrapperRef } = useSwipeCola({
    cancionId: cancion.videoId,
    onPujar,
    onVetar,
  });

  return (
    <div className="song-wrapper" ref={wrapperRef}>
      {/* Fondos de reveal — visibles solo durante el swipe */}
      <div className="swipe-reveal swipe-reveal-left">
        <div className="reveal-label">
          <ArrowFatUp size={16} weight="fill" />
          <span>PUJAR</span>
        </div>
      </div>
      <div className="swipe-reveal swipe-reveal-right">
        <div className="reveal-label">
          <Prohibit size={16} weight="fill" />
          <span>VETAR</span>
        </div>
      </div>

      {/* Card principal */}
      <div
        className="song-swipeable"
        ref={itemRef}
        style={{
          padding: "12px 14px",
          background: esMia ? "rgba(212,160,23,.04)" : "rgba(255,255,255,.03)",
          border: esMia ? "1px solid rgba(212,160,23,.35)" : "1px solid rgba(255,255,255,.05)",
          borderRadius: 14,
          boxShadow: esMia ? "0 0 12px rgba(212,160,23,.08)" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={songStyles.pos}>{posicion}</span>
          <div style={{ position: "relative", flexShrink: 0 }}>
            {cancion.imagen ? (
              <img src={cancion.imagen} alt="" style={songStyles.thumb} />
            ) : (
              <div style={{ ...songStyles.thumb, background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MusicNotes size={18} weight="duotone" color="#555" />
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <p style={songStyles.title}>{cancion.titulo || "Sin título"}</p>
              {esMia && <span style={songStyles.tuyaBadge}>Tuya</span>}
            </div>
            <p style={songStyles.artist}>{cancion.artista || ""}</p>
            {cancion.origen && cancion.origen !== "youtube" && (
              <p style={songStyles.nominador}>por @{cancion.origen}</p>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
            {cancion.duracion && (
              <span style={songStyles.duration}>{cancion.duracion}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const songStyles: Record<string, React.CSSProperties> = {
  pos: {
    width: 22,
    fontSize: 11,
    fontWeight: 700,
    color: "#444",
    textAlign: "center",
    flexShrink: 0,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    objectFit: "cover",
    flexShrink: 0,
  },
  title: {
    fontSize: 13,
    fontWeight: 600,
    color: "#F0EDE8",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginBottom: 1,
  },
  artist: {
    fontSize: 11,
    color: "#777",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  nominador: {
    fontSize: 10,
    color: "#D4A017",
    marginTop: 2,
    fontWeight: 500,
    fontStyle: "italic",
  },
  duration: {
    fontSize: 10,
    color: "#555",
    fontVariantNumeric: "tabular-nums",
  },
  tuyaBadge: {
    fontSize: 8,
    fontWeight: 700,
    color: "#080808",
    background: "linear-gradient(135deg, #FFE566, #D4A017)",
    padding: "1px 6px",
    borderRadius: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    flexShrink: 0,
  },
};
