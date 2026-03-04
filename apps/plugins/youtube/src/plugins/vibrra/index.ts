/**
 * @file index.ts
 * @description Plugin VIBRRA para Pear Desktop (YouTube Music).
 *
 * FLUJO COMPLETO:
 * ──────────────────────────────────────────────────────────────────────────
 * 1. [BACKEND] Al iniciar, verifica si hay sesión guardada en electron-store.
 * 2. [BACKEND] Abre una BrowserWindow flotante que muestra:
 *    a) Formulario de login Firebase (si no hay sesión)
 *    b) QR del negocio para que los clientes escaneen y pidan canciones
 * 3. [BACKEND] El host ingresa sus credenciales en la ventana.
 *    - Se autentica contra Firebase REST API
 *    - Se guarda refreshToken en electron-store
 *    - Se genera el QR permanente: vibrra.live/neg/{uid}
 * 4. [BACKEND] Inicia polling de Firestore cada 8s buscando solicitudes
 *    con estado 'pendiente', tomando la de mayor puja.
 * 5. [BACKEND → RENDERER] Cuando hay canción lista, envía IPC 'vibrra:play-song'
 *    con datos de la canción (artista, título, monto).
 * 6. [RENDERER] Inyecta una búsqueda en YouTube Music y hace clic en el
 *    primer resultado para reproducir automáticamente la canción.
 * 7. [RENDERER] Muestra un toast de notificación con los datos de la canción.
 * ──────────────────────────────────────────────────────────────────────────
 *
 * INSTALACIÓN:
 * Coloca esta carpeta en src/plugins/vibrra/ dentro del proyecto pear-desktop.
 * Añade 'vibrra' al array de plugins activos en src/config/defaults.ts.
 *
 * DEPENDENCIAS REQUERIDAS (en el package.json de pear-desktop):
 * No se requieren dependencias adicionales; usa fetch nativo de Node/Chromium.
 */

import { BrowserWindow } from 'electron';
import path from 'path';
import { createPlugin } from '@/utils';
import style from './style.css?inline';
import {
  signIn,
  signOut,
  startPolling,
  stopPolling,
  restoreSession,
} from './firebase';
import type { VibrraConfig, PlaySongMessage } from './types';

// ─── IPC Channel Names ────────────────────────────────────────────────────────
/** Canal IPC para notificar al renderer que reproduzca una canción */
const IPC_PLAY_SONG   = 'vibrra:play-song';
/** Canal IPC: login desde la ventana del QR → backend */
const IPC_LOGIN       = 'vibrra:login';
/** Canal IPC: logout desde la ventana del QR → backend */
const IPC_LOGOUT      = 'vibrra:logout';
/** Canal IPC: renderer solicita la sesión activa actual */
const IPC_GET_SESSION = 'vibrra:get-session';
/** Canal IPC: backend notifica al renderer de la canción en reproducción */
const IPC_NOW_PLAYING = 'vibrra:now-playing';

// ─── Referencia a la ventana flotante del QR ─────────────────────────────────
/** Ventana BrowserWindow del panel del host (QR + login) */
let qrWindow: BrowserWindow | null = null;

export default createPlugin<VibrraConfig>({
  name: 'VIBRRA',
  restartNeeded: false,

  config: {
    enabled: false,
    negocioUid: null,
    firebaseToken: null,
  },

  // ─── Menú contextual en la barra de menús de Pear Desktop ──────────────────
  menu: async ({ getConfig, setConfig }) => {
    const config = await getConfig();

    return [
      {
        label: 'VIBRRA Jukebox',
        submenu: [
          {
            label: config.negocioUid
              ? '✅ Sesión activa — ver panel'
              : '🔐 Iniciar sesión',
            click() {
              // Mostrar u ocultar la ventana flotante del QR
              if (qrWindow && !qrWindow.isDestroyed()) {
                qrWindow.show();
                qrWindow.focus();
              }
            },
          },
          { type: 'separator' },
          {
            label: '🔁 Ver cola de solicitudes',
            enabled: !!config.negocioUid,
            click() {
              if (qrWindow && !qrWindow.isDestroyed()) {
                qrWindow.show();
              }
            },
          },
          {
            label: '🚪 Cerrar sesión',
            enabled: !!config.negocioUid,
            async click() {
              signOut();
              await setConfig({ negocioUid: null, firebaseToken: null });
              qrWindow?.webContents.send(IPC_LOGOUT);
            },
          },
        ],
      },
    ];
  },

  // ─── BACKEND (Main Process / Electron) ─────────────────────────────────────
  backend: {
    /**
     * Se ejecuta al activar el plugin.
     * Crea la ventana flotante del panel VIBRRA y registra los handlers IPC.
     */
    async start({ window: mainWindow, ipc, getConfig, setConfig }) {
      const config = await getConfig();

      // ── Crear ventana flotante del panel VIBRRA ────────────────────────
      qrWindow = new BrowserWindow({
        width:           340,
        height:          520,
        resizable:       false,
        frame:           false,           // Sin decoración nativa (draggable via CSS)
        transparent:     false,
        alwaysOnTop:     true,            // Flota sobre YouTube Music
        skipTaskbar:     true,            // No aparece en la barra de tareas
        show:            true,
        backgroundColor: '#0D0D0D',
        webPreferences: {
          nodeIntegration:   false,
          contextIsolation:  true,
          // El preload del plugin expone window.vibrraAPI al HTML de la ventana
          preload: path.join(__dirname, 'preload.js'),
        },
      });

      // Posicionar en la esquina superior derecha de la pantalla principal
      const { screen } = await import('electron');
      const { width: sw } = screen.getPrimaryDisplay().workAreaSize;
      qrWindow.setPosition(sw - 360, 40);

      // Cargar el HTML del panel
      await qrWindow.loadFile(path.join(__dirname, 'qr-window.html'));

      // Evitar que cierre el proceso al cerrar la ventana (solo ocultar)
      qrWindow.on('close', (e) => {
        e.preventDefault();
        qrWindow?.hide();
      });

      // ── Handler IPC: Login ─────────────────────────────────────────────
      /**
       * El HTML de qr-window.html envía credenciales → autenticamos con Firebase
       * → guardamos el token en config → devolvemos el resultado.
       */
      ipc.handle(IPC_LOGIN, async (_event, email: string, password: string) => {
        try {
          const { uid, refreshToken } = await signIn(email, password);

          // Persistir en electron-store para sesiones futuras
          await setConfig({ negocioUid: uid, firebaseToken: refreshToken });

          // Iniciar escucha de Firestore
          startListening(uid, mainWindow, getConfig, setConfig);

          return { success: true, negocioUid: uid };
        } catch (err) {
          console.error('[VIBRRA] Error de login:', err);
          return { success: false, error: (err as Error).message };
        }
      });

      // ── Handler IPC: Logout ────────────────────────────────────────────
      ipc.handle(IPC_LOGOUT, async () => {
        signOut();
        stopPolling();
        await setConfig({ negocioUid: null, firebaseToken: null });
      });

      // ── Handler IPC: Get Session ───────────────────────────────────────
      /** El HTML consulta si ya hay sesión activa al abrirse la ventana */
      ipc.handle(IPC_GET_SESSION, async () => {
        const currentConfig = await getConfig();
        return { negocioUid: currentConfig.negocioUid ?? null };
      });

      // ── Restaurar sesión previa si hay token guardado ──────────────────
      if (config.firebaseToken && config.negocioUid) {
        try {
          console.log('[VIBRRA] Restaurando sesión previa...');
          await restoreSession(config.firebaseToken);
          startListening(config.negocioUid, mainWindow, getConfig, setConfig);
          console.log(`[VIBRRA] Sesión restaurada para negocio: ${config.negocioUid}`);
        } catch (err) {
          // Token expirado o inválido → el usuario tendrá que hacer login manual
          console.warn('[VIBRRA] No se pudo restaurar la sesión:', (err as Error).message);
          await setConfig({ firebaseToken: null });
        }
      }
    },

    /** Se ejecuta al desactivar el plugin → limpiar recursos */
    stop() {
      stopPolling();
      if (qrWindow && !qrWindow.isDestroyed()) {
        qrWindow.destroy();
        qrWindow = null;
      }
      console.log('[VIBRRA] Plugin detenido.');
    },
  },

  // ─── RENDERER (Renderer Process / YouTube Music DOM) ───────────────────────
  stylesheets: [style],

  renderer: {
    /**
     * Se ejecuta en el contexto de la página web de YouTube Music.
     * Escucha el evento IPC del backend para reproducir canciones.
     */
    async start(context) {
      console.log('[VIBRRA Renderer] Plugin iniciado.');

      /**
       * Escucha el canal IPC enviado desde el backend cuando hay una
       * canción lista para reproducir (la de mayor puja en Firestore).
       */
      context.ipc.on(IPC_PLAY_SONG, async (_event, song: PlaySongMessage) => {
        console.log(`[VIBRRA Renderer] 🎵 Reproduciendo: ${song.artista} - ${song.cancion}`);

        // Mostrar toast de notificación en la UI de YouTube Music
        showToast(song, 'buscando...');

        try {
          // Intentar reproducir la canción en YouTube Music
          await injectAndPlay(song);

          // Actualizar toast: reproducción en curso
          updateToast(song, null);

          // Ocultar toast después de 5 segundos
          setTimeout(() => hideToast(), 5_000);
        } catch (err) {
          console.error('[VIBRRA Renderer] Error al reproducir:', err);
          updateToast(song, '⚠️ Error al reproducir');
          setTimeout(() => hideToast(), 4_000);
        }
      });
    },
  },
});

// ─── HELPERS BACKEND ─────────────────────────────────────────────────────────

/**
 * Inicia el polling de Firestore y conecta el resultado con el renderer de YouTube Music.
 * Cuando hay una canción pendiente con la mayor puja, envía IPC al renderer
 * y notifica al panel QR del host.
 *
 * @param negocioUid - UID del negocio autenticado.
 * @param mainWindow - BrowserWindow principal (YouTube Music).
 * @param getConfig - Función para leer la config actual del plugin.
 * @param setConfig - Función para guardar cambios en la config.
 */
function startListening(
  negocioUid: string,
  mainWindow: BrowserWindow,
  getConfig: () => Promise<VibrraConfig>,
  setConfig: (config: Partial<VibrraConfig>) => Promise<void>,
): void {
  startPolling(negocioUid, (solicitud) => {
    const song: PlaySongMessage = {
      solicitudId: solicitud.id,
      artista:     solicitud.artista,
      cancion:     solicitud.cancion,
      monto:       solicitud.monto,
    };

    // → Renderer de YouTube Music: reproduce la canción
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC_PLAY_SONG, song);
    }

    // → Ventana del panel QR: actualizar "reproduciendo ahora"
    if (qrWindow && !qrWindow.isDestroyed()) {
      qrWindow.webContents.send(IPC_NOW_PLAYING, song);
    }
  });
}

// ─── HELPERS RENDERER ────────────────────────────────────────────────────────
// Las siguientes funciones se ejecutan en el contexto del renderer (DOM de YT Music).

/**
 * Busca una canción en YouTube Music e inicia su reproducción automáticamente.
 *
 * Estrategia:
 * 1. Navega a la URL de búsqueda de YouTube Music.
 * 2. Espera a que cargue el primer resultado de tipo "canción".
 * 3. Hace doble clic en el resultado para reproducirlo.
 *
 * @param song - Datos de la canción a reproducir.
 */
async function injectAndPlay(song: PlaySongMessage): Promise<void> {
  const query = encodeURIComponent(`${song.artista} ${song.cancion}`);
  const searchUrl = `https://music.youtube.com/search?q=${query}`;

  // Navegar a la búsqueda
  window.location.href = searchUrl;

  // Esperar a que la página cargue y aparezcan los resultados
  await waitForResults();

  // Buscar el primer resultado de tipo "canción" en la lista
  const firstSong = await waitForElement(
    'ytmusic-responsive-list-item-renderer[data-hveid]',
    6_000,
  );

  if (!firstSong) {
    throw new Error(`No se encontraron resultados para: ${song.artista} - ${song.cancion}`);
  }

  // Hacer clic para seleccionar y reproducir el primer resultado
  // YouTube Music reproduce al hacer doble clic en el item de la lista
  (firstSong as HTMLElement).dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
}

/**
 * Espera a que la página de resultados de búsqueda de YouTube Music cargue.
 * Detecta la presencia del contenedor de resultados.
 */
async function waitForResults(): Promise<void> {
  await waitForElement('ytmusic-search-page', 8_000);
  // Pequeño delay adicional para que los items individuales rendericen
  await delay(800);
}

/**
 * Espera a que un elemento del DOM aparezca con un timeout.
 * @param selector - Selector CSS del elemento a esperar.
 * @param timeoutMs - Tiempo máximo de espera en milisegundos.
 * @returns El elemento encontrado o null si se agotó el tiempo.
 */
function waitForElement(selector: string, timeoutMs: number): Promise<Element | null> {
  return new Promise((resolve) => {
    const existing = document.querySelector(selector);
    if (existing) return resolve(existing);

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeoutMs);
  });
}

/** Promesa de delay simple */
const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ─── TOAST UI ────────────────────────────────────────────────────────────────

/**
 * Muestra el toast de notificación VIBRRA en YouTube Music.
 * @param song - Datos de la canción.
 * @param statusText - Texto de estado opcional (ej: "buscando...").
 */
function showToast(song: PlaySongMessage, statusText?: string | null): void {
  removeExistingToast();

  const toast = document.createElement('div');
  toast.id = 'vibrra-toast';
  toast.innerHTML = `
    <span class="vibrra-icon">🎵</span>
    <div class="vibrra-toast-content">
      <div class="vibrra-toast-label">
        VIBRRA
        ${statusText ? `<span class="vibrra-searching"></span>` : ''}
      </div>
      <div class="vibrra-toast-song">${escapeHtml(song.artista)} — ${escapeHtml(song.cancion)}</div>
      <div class="vibrra-toast-amount">$${song.monto.toLocaleString('es-CO')} COP</div>
    </div>
  `;

  document.body.appendChild(toast);
}

/**
 * Actualiza el estado del toast existente.
 * @param song - Datos de la canción.
 * @param errorText - Texto de error si hubo problema (null = sin error).
 */
function updateToast(song: PlaySongMessage, errorText: string | null): void {
  const toast = document.getElementById('vibrra-toast');
  if (!toast) return;

  const label = toast.querySelector('.vibrra-toast-label');
  if (label) {
    label.innerHTML = errorText ? `VIBRRA · ${errorText}` : '▶️ Reproduciendo ahora';
  }
}

/**
 * Oculta y elimina el toast con animación de salida.
 */
function hideToast(): void {
  const toast = document.getElementById('vibrra-toast');
  if (!toast) return;

  toast.classList.add('hide');
  toast.addEventListener('animationend', () => toast.remove(), { once: true });
}

/** Elimina el toast si existe (sin animación). */
function removeExistingToast(): void {
  document.getElementById('vibrra-toast')?.remove();
}

/** Escapa caracteres HTML para evitar XSS en el toast. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
