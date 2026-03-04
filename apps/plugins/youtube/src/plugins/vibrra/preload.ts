/**
 * @file preload.ts
 * @description Preload script de la ventana flotante del panel VIBRRA.
 *
 * Este script corre en el contexto de la BrowserWindow de qr-window.html
 * con contextIsolation: true. Expone un API seguro (window.vibrraAPI)
 * para que el HTML de la ventana pueda comunicarse con el backend de Electron
 * sin tener acceso directo a Node.js.
 *
 * ContextBridge: HTML ↔ window.vibrraAPI ↔ ipcRenderer ↔ IPC ↔ Backend
 */

import { contextBridge, ipcRenderer } from 'electron';
import type { PlaySongMessage } from './types';

// ─── IPC Channel Names (deben coincidir con index.ts) ──────────────────────
const IPC_LOGIN       = 'vibrra:login';
const IPC_LOGOUT      = 'vibrra:logout';
const IPC_GET_SESSION = 'vibrra:get-session';
const IPC_NOW_PLAYING = 'vibrra:now-playing';

// ─── API expuesta al HTML de qr-window.html ────────────────────────────────

contextBridge.exposeInMainWorld('vibrraAPI', {
  /**
   * Solicita al backend autenticarse con Firebase usando email y contraseña.
   * @param email - Correo electrónico del host.
   * @param password - Contraseña del host.
   * @returns { success: boolean, negocioUid?: string, error?: string }
   */
  login: (email: string, password: string) =>
    ipcRenderer.invoke(IPC_LOGIN, email, password),

  /**
   * Cierra la sesión activa del host.
   */
  logout: () =>
    ipcRenderer.invoke(IPC_LOGOUT),

  /**
   * Obtiene la sesión activa actual (si existe).
   * @returns { negocioUid: string | null }
   */
  getSession: () =>
    ipcRenderer.invoke(IPC_GET_SESSION),

  /**
   * Registra un listener para cuando el backend notifica que
   * una canción está siendo reproducida en YouTube Music.
   * @param callback - Función que recibe el objeto PlaySongMessage.
   */
  onSongPlaying: (callback: (song: PlaySongMessage) => void) => {
    ipcRenderer.on(IPC_NOW_PLAYING, (_event, song: PlaySongMessage) => {
      callback(song);
    });
  },
});

/**
 * Tipo global para que TypeScript reconozca window.vibrraAPI en el HTML.
 * (Solo necesario si el HTML usa TypeScript; para HTML/JS vanilla no aplica.)
 */
declare global {
  interface Window {
    vibrraAPI: {
      login: (email: string, password: string) => Promise<{ success: boolean; negocioUid?: string; error?: string }>;
      logout: () => Promise<void>;
      getSession: () => Promise<{ negocioUid: string | null }>;
      onSongPlaying: (callback: (song: PlaySongMessage) => void) => void;
    };
  }
}
