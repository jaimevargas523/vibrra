"use client";

import { useEffect, useState } from "react";
import { MOODS, DURACION_DEDICATORIA } from "./constants";

interface Props {
  mood: string;
  mensaje: string;
  aliasEmisor: string;
  destino: string;
  aliasDestinatario?: string;
  onClose: () => void;
}

export function ExitoOverlay({ mood, mensaje, aliasEmisor, destino, aliasDestinatario, onClose }: Props) {
  const m = MOODS.find((x) => x.key === mood) ?? MOODS[0];
  const [visible, setVisible] = useState(false);
  const glowRad = m.glowColor.replace(".35)", ".5)");

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  let suffix = "";
  if (destino === "persona" && aliasDestinatario) suffix = ` · para @${aliasDestinatario}`;
  if (destino === "cancion") suffix = " · para la canción";

  return (
    <div
      className={visible ? "exito-fade" : ""}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 600,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(4,4,4,.97)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        padding: 28,
      }}
    >
      {/* Emoji pop */}
      <div className="exito-emoji-pop" style={{ fontSize: 64, marginBottom: 12 }}>
        {m.emoji}
      </div>

      <h2
        style={{
          fontFamily: "var(--font-playfair), serif",
          fontWeight: 900,
          fontSize: 24,
          color: "var(--text)",
          textAlign: "center",
          marginBottom: 6,
        }}
      >
        ¡Dedicatoria enviada!
      </h2>

      <p
        style={{
          fontSize: 13,
          color: "var(--soft)",
          textAlign: "center",
          marginBottom: 24,
          lineHeight: 1.5,
        }}
      >
        Aparecerá en la pantalla del bar<br />en unos segundos.
      </p>

      {/* Mini card */}
      <div
        className="ex-card"
        style={{
          width: "100%",
          borderRadius: 18,
          padding: 18,
          marginBottom: 24,
          position: "relative",
          overflow: "hidden",
          background: m.cardBg,
          boxShadow: `0 6px 24px ${m.glowColor}`,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            borderRadius: 20,
            padding: "3px 9px",
            marginBottom: 10,
            fontFamily: "var(--font-syne), sans-serif",
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            border: "1px solid",
            background: `${m.colorA}20`,
            borderColor: `${m.colorA}50`,
            color: m.colorA,
            position: "relative",
            zIndex: 1,
          }}
        >
          <span>{m.emoji}</span> DEDICATORIA
        </div>

        <p
          style={{
            fontFamily: "var(--font-playfair), serif",
            fontWeight: 700,
            fontStyle: "italic",
            fontSize: 16,
            color: "var(--text)",
            lineHeight: 1.45,
            marginBottom: 8,
            position: "relative",
            zIndex: 1,
          }}
        >
          &ldquo;{mensaje}&rdquo;
        </p>

        <span
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontSize: 11,
            fontWeight: 700,
            color: m.colorA,
            position: "relative",
            zIndex: 1,
          }}
        >
          — @{aliasEmisor || "anónimo"}{suffix}
        </span>
      </div>

      {/* Timer */}
      <div
        style={{
          fontSize: 13,
          color: "var(--soft)",
          marginBottom: 22,
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--soft)" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <polyline points="12 7 12 12 15 15" />
        </svg>
        Visible en pantalla por{" "}
        <span
          style={{
            fontFamily: "var(--font-dm-mono), monospace",
            fontWeight: 500,
            fontSize: 15,
            color: m.colorA,
          }}
        >
          {DURACION_DEDICATORIA}
        </span>{" "}
        segundos
      </div>

      {/* Button */}
      <button
        onClick={onClose}
        style={{
          width: "100%",
          padding: 15,
          border: "none",
          borderRadius: 13,
          background: "linear-gradient(120deg, var(--gold-lo), var(--gold-hi))",
          fontFamily: "var(--font-syne), sans-serif",
          fontSize: 14,
          fontWeight: 800,
          color: "#000",
          cursor: "pointer",
          boxShadow: "0 4px 22px var(--gold-glow)",
        }}
      >
        Volver a la sala
      </button>
    </div>
  );
}
