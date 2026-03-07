// ─── Moods ───────────────────────────────────────────────────

export interface MoodDef {
  key: string;
  emoji: string;
  nombre: string;
  colorA: string;
  colorB: string;
  glowColor: string;
  cardBg: string;
}

export const MOODS: MoodDef[] = [
  { key: "romantico",  emoji: "💕", nombre: "Romántico", colorA: "#FF6BAE", colorB: "#FF3D6B", glowColor: "rgba(255,107,174,.35)", cardBg: "linear-gradient(135deg, #2a0a18, #1a0812)" },
  { key: "fuego",      emoji: "🔥", nombre: "Fuego",     colorA: "#FF7A2F", colorB: "#FF4500", glowColor: "rgba(255,122,47,.35)",  cardBg: "linear-gradient(135deg, #2a1000, #1a0800)" },
  { key: "amistad",    emoji: "🤝", nombre: "Amistad",   colorA: "#2FC4FF", colorB: "#0090CC", glowColor: "rgba(47,196,255,.35)",  cardBg: "linear-gradient(135deg, #001a2a, #000e1a)" },
  { key: "fiesta",     emoji: "🎉", nombre: "Fiesta",    colorA: "#C87AFF", colorB: "#8B2FFF", glowColor: "rgba(200,122,255,.35)", cardBg: "linear-gradient(135deg, #1a002a, #0f0018)" },
  { key: "misterio",   emoji: "🌙", nombre: "Misterio",  colorA: "#7AFF9E", colorB: "#00CC44", glowColor: "rgba(122,255,158,.35)", cardBg: "linear-gradient(135deg, #001a0a, #000d05)" },
  { key: "nostalgia",  emoji: "🌅", nombre: "Nostalgia", colorA: "#FFB347", colorB: "#E07000", glowColor: "rgba(255,179,71,.35)",  cardBg: "linear-gradient(135deg, #1a1000, #0f0900)" },
  { key: "tropical",   emoji: "🌴", nombre: "Tropical",  colorA: "#00FFB2", colorB: "#00B87A", glowColor: "rgba(0,255,178,.35)",   cardBg: "linear-gradient(135deg, #001a14, #000f0a)" },
  { key: "urbano",     emoji: "🎤", nombre: "Urbano",    colorA: "#C0C0C0", colorB: "#888888", glowColor: "rgba(192,192,192,.35)", cardBg: "linear-gradient(135deg, #0d0d0d, #060606)" },
  { key: "electro",    emoji: "⚡", nombre: "Electro",   colorA: "#BF00FF", colorB: "#7700CC", glowColor: "rgba(191,0,255,.35)",   cardBg: "linear-gradient(135deg, #080018, #04000f)" },
];

// ─── Costos ──────────────────────────────────────────────────
// El precio de dedicatoria viene del establecimiento (precio_dedicatoria).

export const DURACION_DEDICATORIA = 8;
export const MAX_DEDICATORIAS_SESION = 3;
export const MAX_CARACTERES_MENSAJE = 100;

// ─── Plantillas ──────────────────────────────────────────────

export const PLANTILLAS = [
  "Esta va para ti ❤️ porque hoy lo mereces todo",
  "🥂 Por los que están y por los que ya no están",
  "Para la mesa del fondo 🔥 ¡los mejores de la noche!",
  "Mi amor, donde estés esta canción es tuya 💫",
  "Feliz cumpleaños 🎉 esta noche bailamos todos",
  "Sin ti esta noche no sería lo mismo 🫶",
];

// ─── Emojis ──────────────────────────────────────────────────

export const EMOJIS_RAPIDOS = [
  "❤️","🔥","💫","🥂","😍","🎶","💃","🕺","✨","💋",
  "🫀","🌹","🤝","👑","🎯","⚡","🫶","🌙","🍾","🎸",
];

// ─── Destinos ────────────────────────────────────────────────

export const DESTINOS = [
  { key: "sala",    emoji: "🎉", label: "Toda la sala" },
  { key: "cancion", emoji: "🎵", label: "Una canción" },
  { key: "persona", emoji: "💘", label: "A alguien" },
] as const;

// ─── Errores ─────────────────────────────────────────────────

export const ERRORES_DEDICAR: Record<string, string> = {
  "saldo-insuficiente": "No tienes saldo suficiente para enviar esta dedicatoria.",
  "sesion-inactiva":    "La sesión ya no está activa.",
  "mensaje-invalido":   "El mensaje no puede estar vacío ni exceder 100 caracteres.",
  "alias-requerido":    "Debes ingresar el alias de la persona.",
  "limite-alcanzado":   "Ya enviaste el máximo de dedicatorias para esta sesión (3).",
};
