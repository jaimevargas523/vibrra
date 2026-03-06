"use client";

import { useEffect, useRef, useState } from "react";
import { MOODS, DURACION_DEDICATORIA } from "./constants";

interface Props {
  mood: string;
  mensaje: string;
  aliasEmisor: string;
}

export function DedCardPreview({ mood, mensaje, aliasEmisor }: Props) {
  const m = MOODS.find((x) => x.key === mood) ?? MOODS[0];
  const [bounce, setBounce] = useState(false);
  const prevLen = useRef(mensaje.length);
  const barRef = useRef<HTMLDivElement>(null);

  // Progress bar loop (CSS transition based, like prototype)
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    function resetBar() {
      bar!.style.transition = "none";
      bar!.style.width = "0%";
      setTimeout(() => {
        bar!.style.transition = "width 8s linear";
        bar!.style.width = "100%";
      }, 60);
    }

    resetBar();
    const interval = setInterval(resetBar, 8500);
    return () => clearInterval(interval);
  }, []);

  // Micro-bounce on emoji/char insert
  useEffect(() => {
    if (mensaje.length > prevLen.current) {
      setBounce(true);
      const t = setTimeout(() => setBounce(false), 150);
      prevLen.current = mensaje.length;
      return () => clearTimeout(t);
    }
    prevLen.current = mensaje.length;
  }, [mensaje]);

  const glowRad = m.glowColor.replace(".35)", ".5)");
  const hasMsg = mensaje.trim().length > 0;

  return (
    <div style={{ padding: "0 18px" }}>
      <div
        className="ded-card"
        style={{
          background: m.cardBg,
          boxShadow: `0 8px 32px ${m.glowColor}`,
          transform: bounce ? "scale(1.015)" : undefined,
        }}
      >
        {/* Glow blob */}
        <div
          className="card-glow"
          style={{ background: `radial-gradient(circle, ${glowRad}, transparent 70%)` }}
        />

        <div>
          {/* Badge */}
          <div
            className="card-badge"
            style={{
              background: `${m.colorA}20`,
              borderColor: `${m.colorA}50`,
              color: m.colorA,
            }}
          >
            <span>{m.emoji}</span> DEDICATORIA
          </div>

          {/* Message */}
          <div className={`card-text ${hasMsg ? "" : "placeholder"}`}>
            {hasMsg ? `"${mensaje}"` : "Escribe algo especial..."}
          </div>
        </div>

        {/* Footer */}
        <div className="card-footer">
          <span className="card-alias" style={{ color: m.colorA }}>
            — @{aliasEmisor || "anónimo"}
          </span>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 9, color: "rgba(255,255,255,.35)" }}>
              {DURACION_DEDICATORIA} seg en pantalla
            </span>
            <div style={{ width: 60, height: 2, background: "rgba(255,255,255,.1)", borderRadius: 1, overflow: "hidden" }}>
              <div
                ref={barRef}
                style={{ height: "100%", borderRadius: 1, background: m.colorA, width: "0%" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
