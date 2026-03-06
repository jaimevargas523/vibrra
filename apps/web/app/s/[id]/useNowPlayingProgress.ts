"use client";

import { useEffect, useState } from "react";

/**
 * Parsea una duración tipo "3:07" o "1:02:30" a segundos.
 */
function parseDuracion(dur: string): number {
  const parts = dur.split(":").map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

/**
 * Formatea segundos a "M:SS" o "H:MM:SS".
 */
function formatTime(secs: number): string {
  const s = Math.max(0, Math.floor(secs));
  if (s >= 3600) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

interface UseNowPlayingProgressParams {
  timestamp?: number;
  duracion?: string;
}

/**
 * Calcula el progreso de la canción actual comparando
 * el timestamp de inicio con la duración total.
 * Se actualiza cada segundo.
 *
 * @returns elapsed (seg), total (seg), progress (0-1), textos formateados
 */
export function useNowPlayingProgress({ timestamp, duracion }: UseNowPlayingProgressParams) {
  const totalSecs = duracion ? parseDuracion(duracion) : 0;

  const calcElapsed = () => {
    if (!timestamp || !totalSecs) return 0;
    const now = Date.now();
    const elapsed = (now - timestamp) / 1000;
    return Math.min(Math.max(0, elapsed), totalSecs);
  };

  const [elapsed, setElapsed] = useState(calcElapsed);

  useEffect(() => {
    if (!timestamp || !totalSecs) {
      setElapsed(0);
      return;
    }

    setElapsed(calcElapsed());

    const interval = setInterval(() => {
      const e = calcElapsed();
      setElapsed(e);
      // Dejar de actualizar si ya terminó
      if (e >= totalSecs) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [timestamp, totalSecs]);

  const progress = totalSecs > 0 ? elapsed / totalSecs : 0;

  return {
    elapsed,
    totalSecs,
    progress: Math.min(progress, 1),
    elapsedText: formatTime(elapsed),
    totalText: duracion || "0:00",
  };
}
