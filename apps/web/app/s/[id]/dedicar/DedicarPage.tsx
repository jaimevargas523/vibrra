"use client";

import { useState, useRef, useCallback } from "react";
import { PaperPlaneTilt, SpinnerGap } from "@phosphor-icons/react";
import { useCliente } from "../ClienteProvider";
import { MoodSelector } from "./MoodSelector";
import { DedCardPreview } from "./DedCardPreview";
import { EmojiRail } from "./EmojiRail";
import { PlantillasRail } from "./PlantillasRail";
import { DestinoSelector } from "./DestinoSelector";
import { ExitoOverlay } from "./ExitoOverlay";
import {
  MOODS,
  COSTOS_DEDICATORIA,
  MAX_CARACTERES_MENSAJE,
  ERRORES_DEDICAR,
} from "./constants";
import type { PlaylistItem } from "../useSessionRTDB";
import "./dedicar.css";

interface Props {
  estId: string;
  cancionActual: { titulo?: string; artista?: string; imagen?: string } | null;
  playlist: PlaylistItem[];
  onClose: () => void;
}

export function DedicarPage({ estId, cancionActual, playlist, onClose }: Props) {
  const { visitorId, alias, saldo } = useCliente();

  const [mood, setMood] = useState("romantico");
  const [mensaje, setMensaje] = useState("");
  const [destino, setDestino] = useState("sala");
  const [aliasDestinatario, setAliasDestinatario] = useState("");
  const [cancionId, setCancionId] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const m = MOODS.find((x) => x.key === mood) ?? MOODS[0];
  const costo = COSTOS_DEDICATORIA[destino] ?? 500;
  const charCount = [...mensaje].length;

  const puedeEnviar =
    mensaje.trim().length > 0 &&
    (destino !== "persona" || aliasDestinatario.trim().length > 0) &&
    saldo >= costo &&
    !enviando;

  const formatSaldo = (v: number) => `$${v.toLocaleString("es-CO")}`;

  // ── Toast ──
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  // ── Insertar emoji ──
  const handleEmojiInsert = useCallback(
    (emoji: string) => {
      const el = inputRef.current;
      if (!el) return;
      const chars = [...mensaje];
      if (chars.length >= MAX_CARACTERES_MENSAJE) return;

      const start = el.selectionStart ?? mensaje.length;
      const before = mensaje.slice(0, start);
      const after = mensaje.slice(start);
      const nuevo = before + emoji + after;
      if ([...nuevo].length > MAX_CARACTERES_MENSAJE) return;

      setMensaje(nuevo);
      requestAnimationFrame(() => {
        const pos = before.length + emoji.length;
        el.setSelectionRange(pos, pos);
        el.focus();
      });
    },
    [mensaje],
  );

  // ── Plantilla ──
  const handlePlantilla = useCallback((texto: string) => {
    if ([...texto].length <= MAX_CARACTERES_MENSAJE) {
      setMensaje(texto);
    }
    inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    inputRef.current?.focus();
  }, []);

  // ── Mensaje change ──
  const handleMensajeChange = (value: string) => {
    if ([...value].length <= MAX_CARACTERES_MENSAJE) {
      setMensaje(value);
    }
  };

  // ── Destino change ──
  const handleDestinoChange = (d: string) => {
    setDestino(d);
    if (d === "cancion" && playlist.length > 0 && !cancionId) {
      setCancionId(playlist[0].videoId);
    }
  };

  // ── Enviar ──
  const handleEnviar = async () => {
    if (!puedeEnviar || !visitorId) return;
    setEnviando(true);

    try {
      const res = await fetch("/api/dedicar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorId,
          sesionId: estId,
          mood,
          mensaje: mensaje.trim(),
          destino,
          cancionId: destino === "cancion" ? cancionId : null,
          aliasDestinatario: destino === "persona" ? aliasDestinatario.trim() : null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        const code = data.code ?? "error";
        showToast(ERRORES_DEDICAR[code] ?? data.error ?? "Error al enviar");
        return;
      }
      setExito(true);
    } catch {
      showToast("Error de conexión. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  // ── Éxito ──
  if (exito) {
    return (
      <div className="dedicar-root">
        <ExitoOverlay
          mood={mood}
          mensaje={mensaje}
          aliasEmisor={alias}
          destino={destino}
          aliasDestinatario={aliasDestinatario}
          onClose={onClose}
        />
      </div>
    );
  }

  const counterClass = charCount > 90 ? "msg-counter over" : charCount > 75 ? "msg-counter warn" : "msg-counter";

  return (
    <div
      className="dedicar-root dedicar-slide-in"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 150,
        display: "flex",
        flexDirection: "column",
        maxWidth: 420,
        margin: "0 auto",
        background: "var(--bg)",
        overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          flexShrink: 0,
          padding: "14px 18px 13px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(180deg, rgba(7,7,7,.99), rgba(7,7,7,.82))",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid var(--border)",
          position: "relative",
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              color: "var(--soft)",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: 15, color: "var(--text)" }}>
            Crear dedicatoria
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(212,160,23,.11)",
            border: "1px solid rgba(212,160,23,.28)",
            borderRadius: 30,
            padding: "5px 11px",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <circle cx="8.5" cy="12.5" r="5.5" stroke="#D4A017" strokeWidth="1.5" fill="none" />
            <ellipse cx="8.5" cy="10.2" rx="5.5" ry="1.8" fill="#D4A017" opacity=".35" />
            <circle cx="15.5" cy="14.5" r="4.5" fill="#070707" stroke="#D4A017" strokeWidth="1.5" />
            <ellipse cx="15.5" cy="12.4" rx="4.5" ry="1.5" fill="#D4A017" opacity=".5" />
          </svg>
          <span style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: 12, color: "var(--gold-hi)" }}>
            {formatSaldo(saldo)}
          </span>
        </div>
      </header>

      {/* ── Body ── */}
      <div
        ref={scrollRef}
        className="ded-body"
        style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingBottom: 120 }}
      >
        {/* Mood */}
        <div style={{ padding: "18px 0 0" }}>
          <p className="ded-label" style={{ marginBottom: 12 }}>Ambiente</p>
          <MoodSelector selected={mood} onSelect={setMood} />
        </div>

        {/* Card preview */}
        <div style={{ paddingTop: 16 }}>
          <DedCardPreview mood={mood} mensaje={mensaje} aliasEmisor={alias} />
        </div>

        {/* Input */}
        <div style={{ padding: "14px 18px 0" }}>
          <div style={{ position: "relative" }}>
            <textarea
              ref={inputRef}
              className="msg-input"
              rows={2}
              value={mensaje}
              onChange={(e) => handleMensajeChange(e.target.value)}
              placeholder="Escribe tu mensaje..."
              maxLength={150}
            />
            <span className={counterClass}>{charCount}/{MAX_CARACTERES_MENSAJE}</span>
          </div>
        </div>

        {/* Emojis */}
        <div style={{ paddingTop: 12 }}>
          <p className="ded-label" style={{ marginBottom: 10 }}>Emojis rápidos</p>
          <EmojiRail onInsert={handleEmojiInsert} />
        </div>

        {/* Plantillas */}
        <div style={{ paddingTop: 12 }}>
          <p className="ded-label" style={{ marginBottom: 10 }}>Plantillas rápidas</p>
          <PlantillasRail onSelect={handlePlantilla} />
        </div>

        {/* Destino */}
        <div style={{ paddingTop: 14 }}>
          <p className="ded-label" style={{ marginBottom: 12 }}>¿Para quién?</p>
          <DestinoSelector
            selected={destino}
            mood={mood}
            aliasDestinatario={aliasDestinatario}
            onSelect={handleDestinoChange}
            onAliasChange={setAliasDestinatario}
          />
        </div>

        {/* Canción selector (si destino == cancion) */}
        {destino === "cancion" && playlist.length > 0 && (
          <div style={{ padding: "10px 18px 0" }}>
            <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: ".12em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 8 }}>
              Selecciona canción
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {playlist.map((item) => {
                const active = cancionId === item.videoId;
                return (
                  <button
                    key={item.videoId}
                    onClick={() => setCancionId(item.videoId)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: `1.5px solid ${active ? m.colorA : "var(--border)"}`,
                      background: active ? `${m.colorA}14` : "var(--s1)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all .2s ease",
                    }}
                  >
                    {item.imagen && (
                      <img src={item.imagen} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontWeight: 500, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.titulo}
                      </p>
                      <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 10, color: "var(--muted)" }}>
                        {item.artista}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom bar ── */}
      <div className="ded-bottom-bar">
        <div className="cost-chip">{formatSaldo(costo)}</div>
        <button
          className="btn-send"
          onClick={handleEnviar}
          disabled={!puedeEnviar}
          style={
            puedeEnviar
              ? {
                  background: `linear-gradient(120deg, ${m.colorB}, ${m.colorA})`,
                  boxShadow: `0 4px 24px ${m.glowColor}`,
                }
              : undefined
          }
        >
          {enviando ? (
            <SpinnerGap size={16} weight="bold" className="spin-icon" />
          ) : (
            <>
              <PaperPlaneTilt size={14} weight="fill" />
              Enviar dedicatoria
            </>
          )}
        </button>
      </div>

      {/* Toast */}
      <div className={`ded-toast ${toast ? "show" : ""}`}>{toast}</div>
    </div>
  );
}
