/**
 * player_detector.js
 * 
 * Detecta automáticamente qué reproductor de música tiene abierto
 * el anfitrión en su navegador, escaneando las pestañas activas.
 * 
 * No requiere configuración — el anfitrión simplemente abre su
 * reproductor favorito y VIBRRA lo detecta y controla.
 * 
 * Reproductores soportados:
 *   - YouTube  (youtube.com/watch)
 *   - Spotify  (open.spotify.com)
 *   - SoundCloud (soundcloud.com)
 */

/** Tipos de reproductor soportados */
export const PLAYER_TYPE = {
  YOUTUBE:    'youtube',
  SPOTIFY:    'spotify',
  SOUNDCLOUD: 'soundcloud',
  NONE:       null
};

/**
 * Patrones de URL para identificar cada reproductor.
 * Se evalúan en orden — el primero en coincidir gana.
 */
const PLAYER_PATTERNS = [
  {
    tipo:    PLAYER_TYPE.YOUTUBE,
    // Detecta tanto youtube.com/watch como music.youtube.com
    regex:   /youtube\.com\/(watch|music)/,
    label:   'YouTube'
  },
  {
    tipo:    PLAYER_TYPE.SPOTIFY,
    regex:   /open\.spotify\.com/,
    label:   'Spotify'
  },
  {
    tipo:    PLAYER_TYPE.SOUNDCLOUD,
    regex:   /soundcloud\.com/,
    label:   'SoundCloud'
  }
];

/**
 * Escanea todas las pestañas abiertas y retorna la primera que
 * coincida con un reproductor soportado.
 * 
 * @returns {Promise<{tipo: string, tabId: number, label: string}|null>}
 *   El reproductor detectado, o null si no hay ninguno abierto.
 */
export async function detectarReproductor() {
  const tabs = await chrome.tabs.query({});

  for (const tab of tabs) {
    const url = tab.url ?? '';

    for (const pattern of PLAYER_PATTERNS) {
      if (pattern.regex.test(url)) {
        return {
          tipo:  pattern.tipo,
          tabId: tab.id,
          label: pattern.label,
          url:   tab.url
        };
      }
    }
  }

  return null;
}

/**
 * Verifica si una pestaña específica sigue abierta y tiene
 * el mismo reproductor que se detectó al iniciar la sesión.
 * 
 * Útil para detectar si el anfitrión cerró el reproductor
 * durante una sesión activa.
 * 
 * @param {number} tabId — ID de la pestaña a verificar
 * @param {string} tipoEsperado — PLAYER_TYPE esperado
 * @returns {Promise<boolean>}
 */
export async function verificarReproductorActivo(tabId, tipoEsperado) {
  try {
    const tab = await chrome.tabs.get(tabId);
    const url = tab.url ?? '';
    const pattern = PLAYER_PATTERNS.find(p => p.tipo === tipoEsperado);

    return pattern ? pattern.regex.test(url) : false;
  } catch {
    // La pestaña fue cerrada
    return false;
  }
}

/**
 * Retorna el nombre legible del tipo de reproductor.
 * 
 * @param {string} tipo — PLAYER_TYPE
 * @returns {string}
 */
export function labelReproductor(tipo) {
  return PLAYER_PATTERNS.find(p => p.tipo === tipo)?.label ?? 'Desconocido';
}
