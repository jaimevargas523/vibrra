/**
 * firebase_config.js
 * 
 * Configuración del SDK de Firebase para la extensión Chrome.
 * Usa el proyecto DEV de VIBRRA.
 * 
 * IMPORTANTE: Reemplazar los valores con los del proyecto Firebase DEV.
 * Los keys de la extensión van aquí (no en .env — Manifest V3 no los soporta).
 * En producción usar el proyecto vibrra-prod con sus propias keys.
 */

export const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDedB7F61T7z0WEqwymdTsVoCBZqmoTX_A",
    authDomain: "vibrra-6cd01.firebaseapp.com",
    projectId: "vibrra-6cd01",
    storageBucket: "vibrra-6cd01.firebasestorage.app",
    messagingSenderId: "514562729767",
    appId: "1:514562729767:web:e8d5ee6d2da68d2611eb02",
    measurementId: "G-3KNQ2C87DK"
};

/**
 * Nodos raíz del Realtime Database.
 * Centralizados aquí para evitar strings dispersos en el código.
 */
export const RTDB_PATHS = {
  /** Sesión activa de un establecimiento: sesiones/{estId} */
  sesion: (estId) => `sesiones/${estId}`,

  /** Cola de reproducción */
  cola: (estId) => `sesiones/${estId}/cola`,

  /** Canción actualmente en reproducción */
  cancionActual: (estId) => `sesiones/${estId}/cancion_actual`,

  /** Timestamp de última actividad */
  ultimaActividad: (estId) => `sesiones/${estId}/ultima_actividad`,

  /** Estado de la sesión (activa: boolean) */
  estadoSesion: (estId) => `sesiones/${estId}/activa`,

  /** Playlist cargada en el reproductor */
  playlistCargada: (estId) => `sesiones/${estId}/playlist_cargada`,

  /** Vinculación de extensión */
  extVincular: (estId) => `sesiones/${estId}/Ext_vincular`,

  /** Contador de canciones sonadas en la sesión */
  cancionesSonadas: (estId) => `sesiones/${estId}/canciones_sonadas`,

  /** Log de interacciones del anfitrión (skip, rewind, etc.) */
  interaccionesAnfitrion: (estId) => `sesiones/${estId}/interacciones_anfitrion`,
};
