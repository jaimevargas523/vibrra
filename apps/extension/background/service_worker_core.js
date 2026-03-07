/**
 * service_worker_core.js
 *
 * Core del Service Worker de la extensión VIBRRA.
 * Maneja autenticación, sesiones, cola de reproducción y comunicación
 * con los content scripts.
 *
 * Usa Firebase REST API directamente — sin SDK, sin bundles pesados.
 */

import { FIREBASE_CONFIG, RTDB_PATHS } from './firebase_config.js';
import {
  detectarReproductor,
  verificarReproductorActivo,
} from '../utils/player_detector.js';
import {
  sincronizarCola,
  siguienteCancion,
  limpiarCola,
  longitudCola,
} from '../utils/queue_manager.js';

// ─── Constants ───────────────────────────────────────────────────

const API_KEY = FIREBASE_CONFIG.apiKey;
const RTDB_BASE = `https://${FIREBASE_CONFIG.projectId}-default-rtdb.firebaseio.com`;
const AUTH_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`;
const REFRESH_URL = `https://securetoken.googleapis.com/v1/token?key=${API_KEY}`;

// ─── State ───────────────────────────────────────────────────────

const STATE = {
  extensionId: null,
  uid: null,
  idToken: null,
  refreshToken: null,
  tokenExpiry: 0,
  // Establecimiento vinculado (directo, sin dropdown)
  establecimientoId: null,
  establecimientoNombre: null,
  establecimientoImagen: null,
  // Sesión activa
  reproductor: null,
  sesionActiva: false,
  _pollInterval: null,
};

// ─── Extension ID (deterministic per browser profile + device) ───

/**
 * Generates a stable, deterministic ID by hashing properties that don't
 * change across extension reloads: chrome.runtime.id (unique per Chrome
 * profile), CPU cores, language, and platform.
 *
 * Even if chrome.storage.local gets cleared, the same browser on the
 * same device always produces the same ID.
 */
async function generateDeterministicId() {
  const raw = [
    chrome.runtime.id,              // unique per Chrome profile + extension path
    navigator.hardwareConcurrency,  // CPU cores — stable per device
    navigator.language,             // locale — stable per user config
    navigator.platform,             // OS platform — stable per device
  ].join('|');

  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(raw),
  );
  const bytes = new Uint8Array(hashBuffer).slice(0, 16);
  // Set UUID v4 variant bits for format compliance
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return [
    hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16),
    hex.slice(16, 20), hex.slice(20),
  ].join('-');
}

async function getOrCreateExtensionId() {
  // Try cache first (avoids re-hashing every time)
  const { vibrra_ext_id } = await chrome.storage.local.get('vibrra_ext_id');
  if (vibrra_ext_id) {
    STATE.extensionId = vibrra_ext_id;
    return vibrra_ext_id;
  }

  // Generate deterministic ID — same browser+device = same ID always
  const id = await generateDeterministicId();
  await chrome.storage.local.set({ vibrra_ext_id: id });
  STATE.extensionId = id;
  console.log('[VIBRRA] extensionId (deterministic):', id);
  return id;
}

// ─── Firebase Auth (REST API) ────────────────────────────────────

async function signInWithCustomToken(customToken) {
  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Auth failed: ${res.status}`);
  }
  return res.json();
}

async function refreshAuthToken() {
  if (!STATE.refreshToken) throw new Error('No refresh token');
  const res = await fetch(REFRESH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: STATE.refreshToken,
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  const data = await res.json();
  STATE.idToken = data.id_token;
  STATE.refreshToken = data.refresh_token;
  STATE.tokenExpiry = Date.now() + parseInt(data.expires_in, 10) * 1000;
  await persistState();
}

async function ensureAuth() {
  if (!STATE.idToken) throw new Error('No autenticado');
  if (Date.now() > STATE.tokenExpiry - 60_000) {
    await refreshAuthToken();
  }
  return STATE.idToken;
}

// ─── RTDB REST helpers ───────────────────────────────────────────

async function rtdbRead(path, auth = true) {
  const token = auth ? await ensureAuth() : null;
  const q = token ? `?auth=${token}` : '';
  const res = await fetch(`${RTDB_BASE}/${path}.json${q}`);
  if (!res.ok) throw new Error(`RTDB read ${path}: ${res.status}`);
  return res.json();
}

async function rtdbWrite(path, data, auth = true) {
  const token = auth ? await ensureAuth() : null;
  const q = token ? `?auth=${token}` : '';
  const res = await fetch(`${RTDB_BASE}/${path}.json${q}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`RTDB write ${path}: ${res.status}`);
  return res.json();
}

async function rtdbUpdate(path, data, auth = true) {
  const token = auth ? await ensureAuth() : null;
  const q = token ? `?auth=${token}` : '';
  const res = await fetch(`${RTDB_BASE}/${path}.json${q}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`RTDB update ${path}: ${res.status}`);
  return res.json();
}

/**
 * Query RTDB: find session where Ext_vincular/id == extensionId.
 * Returns { estId, data } or null.
 */
async function rtdbQueryByExtension(extensionId) {
  const url = `${RTDB_BASE}/sesiones.json?orderBy="Ext_vincular/id"&equalTo="${extensionId}"&limitToFirst=1`;
  const res = await fetch(url);
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    console.warn('[VIBRRA] RTDB query failed:', res.status, errBody);
    return null;
  }
  const result = await res.json();
  if (!result || typeof result !== 'object') return null;
  const keys = Object.keys(result);
  if (keys.length === 0) return null;
  return { estId: keys[0], data: result[keys[0]] };
}

// ─── Persistence (chrome.storage.local) ──────────────────────────

async function persistState() {
  await chrome.storage.local.set({
    vibrra_auth: {
      uid: STATE.uid,
      idToken: STATE.idToken,
      refreshToken: STATE.refreshToken,
      tokenExpiry: STATE.tokenExpiry,
      establecimientoId: STATE.establecimientoId,
      establecimientoNombre: STATE.establecimientoNombre,
      establecimientoImagen: STATE.establecimientoImagen,
    },
  });
}

async function restoreState() {
  // 1. Try chrome.storage.local — trust it for auth tokens
  const { vibrra_auth } = await chrome.storage.local.get('vibrra_auth');
  if (vibrra_auth?.uid) {
    STATE.uid = vibrra_auth.uid;
    STATE.idToken = vibrra_auth.idToken;
    STATE.refreshToken = vibrra_auth.refreshToken;
    STATE.tokenExpiry = vibrra_auth.tokenExpiry;
    STATE.establecimientoId = vibrra_auth.establecimientoId || null;
    STATE.establecimientoNombre = vibrra_auth.establecimientoNombre || null;
    STATE.establecimientoImagen = vibrra_auth.establecimientoImagen || null;
    console.log('[VIBRRA] Auth restored from storage:', STATE.establecimientoNombre);

    // Check RTDB for active session (sesionActiva is not persisted in storage)
    if (STATE.establecimientoId) {
      try {
        const sesion = await rtdbRead(RTDB_PATHS.sesion(STATE.establecimientoId), false);
        if (sesion?.activa) {
          // Verify player tab is actually open
          const det = await detectarReproductor();
          if (det) {
            STATE.sesionActiva = true;
            STATE.reproductor = det;
            console.log('[VIBRRA] Active session restored — player found:', det.label);
            startQueuePolling(STATE.establecimientoId);
            startHeartbeat(STATE.establecimientoId);
          } else {
            // Player gone → close zombie session in RTDB
            console.log('[VIBRRA] RTDB says active but no player found — closing zombie session');
            await rtdbUpdate(RTDB_PATHS.sesion(STATE.establecimientoId), {
              activa: false,
              ultima_actividad: Date.now(),
            }, false);
          }
        }
      } catch (err) {
        console.warn('[VIBRRA] RTDB session check failed:', err.message);
      }
    }
    return;
  }

  // 2. No stored auth — check RTDB to see if we're already linked
  if (STATE.extensionId) {
    await _restoreFromRTDB();
  } else {
    console.log('[VIBRRA] No stored auth found');
  }
}

/**
 * Check RTDB for linked establishment and active session.
 * Restores STATE.establecimientoId, nombre, sesionActiva, reproductor.
 */
async function _restoreFromRTDB() {
  try {
    const match = await rtdbQueryByExtension(STATE.extensionId);
    if (!match || !match.data.Ext_vincular?.usado || match.data.Ext_vincular.id !== STATE.extensionId) {
      console.log('[VIBRRA] Not linked in RTDB');
      return;
    }

    const { estId, data } = match;
    STATE.establecimientoId = estId;
    STATE.establecimientoNombre = data.Ext_vincular.nombre || data.nombre || '';
    STATE.establecimientoImagen = data.Ext_vincular.imagen || null;
    console.log('[VIBRRA] Found linked establishment in RTDB:', STATE.establecimientoNombre);

    // Check if session is active
    if (data.activa) {
      const det = await detectarReproductor();
      if (det) {
        STATE.sesionActiva = true;
        STATE.reproductor = det;
        console.log('[VIBRRA] Active session restored — player found:', det.label);
        startQueuePolling(estId);
        startHeartbeat(estId);
      } else {
        // Player gone → close zombie session
        console.log('[VIBRRA] RTDB says active but no player found — closing zombie session');
        try {
          await rtdbUpdate(RTDB_PATHS.sesion(estId), {
            activa: false,
            ultima_actividad: Date.now(),
          }, false);
        } catch { /* best effort */ }
      }
    }
  } catch (err) {
    console.warn('[VIBRRA] RTDB restore failed:', err.message);
  }
}

function clearAuthState() {
  STATE.uid = null;
  STATE.idToken = null;
  STATE.refreshToken = null;
  STATE.tokenExpiry = 0;
  STATE.establecimientoId = null;
  STATE.establecimientoNombre = null;
  STATE.establecimientoImagen = null;
  STATE.reproductor = null;
  STATE.sesionActiva = false;
  stopQueuePolling();
  stopHeartbeat();
  chrome.storage.local.remove('vibrra_auth');
}

// ─── Auth helper (non-throwing) ─────────────────────────────────

/**
 * Try to ensure we have a valid auth token.
 * Returns true if auth is available, false if not (but doesn't throw).
 * When false, RTDB operations should use auth=false (works with open rules).
 */
async function _tryEnsureAuth() {
  if (STATE.idToken && Date.now() < STATE.tokenExpiry - 60_000) return true;
  if (STATE.refreshToken) {
    try {
      await refreshAuthToken();
      return true;
    } catch (err) {
      console.warn('[VIBRRA] Token refresh failed:', err.message);
    }
  }
  return false;
}

// ─── Multi-device detection ─────────────────────────────────────

/**
 * Check if Ext_vincular/id still matches our extensionId.
 * If another extension was linked, we lose ownership → close session + logout.
 */
async function checkExtensionOwnership() {
  if (!STATE.establecimientoId || !STATE.extensionId) return true;

  try {
    const hasAuth = await _tryEnsureAuth();
    const vincData = await rtdbRead(
      RTDB_PATHS.extVincular(STATE.establecimientoId),
      hasAuth,
    );
    if (!vincData || vincData.id !== STATE.extensionId) {
      console.warn('[VIBRRA] Ownership lost — another extension was linked');
      if (STATE.sesionActiva) await handleCerrarSesion();
      clearAuthState();
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[VIBRRA] Ownership check failed:', err.message);
    return true; // Don't kick out on network errors
  }
}

// ─── Queue Polling ───────────────────────────────────────────────

function startQueuePolling(estId) {
  stopQueuePolling();
  const poll = async () => {
    // Check ownership first — if another extension took over, stop everything
    const stillOwner = await checkExtensionOwnership();
    if (!stillOwner) return;

    try {
      const hasAuth = await _tryEnsureAuth();
      const snapshot = await rtdbRead(RTDB_PATHS.cola(estId), hasAuth);
      sincronizarCola(snapshot);
    } catch (err) {
      console.warn('[VIBRRA] Queue poll error:', err.message);
    }
  };
  poll();
  STATE._pollInterval = setInterval(poll, 2500);
}

function stopQueuePolling() {
  if (STATE._pollInterval) {
    clearInterval(STATE._pollInterval);
    STATE._pollInterval = null;
  }
}

// ─── Heartbeat (ultima_actividad) ────────────────────────────────

function startHeartbeat(estId) {
  stopHeartbeat();
  STATE._heartbeatInterval = setInterval(async () => {
    if (!STATE.sesionActiva) return;
    try {
      const hasAuth = await _tryEnsureAuth();
      await rtdbWrite(RTDB_PATHS.ultimaActividad(estId), Date.now(), hasAuth);
    } catch (err) {
      console.warn('[VIBRRA] Heartbeat error:', err.message);
    }
  }, 30000);
}

function stopHeartbeat() {
  if (STATE._heartbeatInterval) {
    clearInterval(STATE._heartbeatInterval);
    STATE._heartbeatInterval = null;
  }
}

// ─── Player Communication ────────────────────────────────────────

async function sendToPlayer(message) {
  if (!STATE.reproductor?.tabId) throw new Error('No active player tab');

  const stillActive = await verificarReproductorActivo(
    STATE.reproductor.tabId,
    STATE.reproductor.tipo,
  );
  if (!stillActive) {
    const newPlayer = await detectarReproductor();
    if (!newPlayer) throw new Error('Player tab was closed');
    STATE.reproductor = newPlayer;
  }

  // YouTube: usar chrome.scripting.executeScript en MAIN world
  // porque el content script no puede acceder a la API de YouTube
  if (STATE.reproductor.tipo === 'youtube' && message.action === 'LOAD_TRACK') {
    const videoId = message.fuente_id;
    await chrome.scripting.executeScript({
      target: { tabId: STATE.reproductor.tabId },
      world: 'MAIN',
      func: (vid) => {
        const player = document.getElementById('movie_player');
        if (player && player.loadVideoById) {
          player.loadVideoById(vid);
        }
      },
      args: [videoId],
    });
    return { ok: true };
  }

  return chrome.tabs.sendMessage(STATE.reproductor.tabId, message);
}

async function triggerPlaylistRead(estId) {
  try {
    const tabs = await chrome.tabs.query({ url: '*://www.youtube.com/*' });
    if (tabs.length === 0) return;
    const tabId = tabs[0].id;

    // Leer datos de playlist desde MAIN world (YouTube API)
    const [apiResult] = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: () => {
        const player = document.getElementById('movie_player');
        if (!player) return null;
        return {
          videoIds: typeof player.getPlaylist === 'function' ? player.getPlaylist() : null,
          playlistIndex: typeof player.getPlaylistIndex === 'function' ? player.getPlaylistIndex() : -1,
          videoData: typeof player.getVideoData === 'function' ? player.getVideoData() : null,
        };
      },
    });

    if (!apiResult?.result) return;
    const { videoIds, playlistIndex, videoData } = apiResult.result;

    // Leer títulos via DOM scraping (no necesita MAIN world)
    const [titlesResult] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const titulos = [];
        document.querySelectorAll('ytd-playlist-panel-video-renderer #video-title')
          .forEach((el) => titulos.push((el.textContent || '').trim()));
        return titulos;
      },
    });
    const titulosDOM = titlesResult?.result || [];

    let playlist = null;

    if (videoIds && videoIds.length > 0) {
      playlist = {
        timestamp: Date.now(),
        fuente: 'youtube',
        total_items: videoIds.length,
        indice_actual: playlistIndex,
        items: videoIds.map((vid, i) => ({
          posicion: i, videoId: vid, titulo: titulosDOM[i] || '', fuente: 'youtube',
        })),
      };
    } else if (videoData && videoData.video_id) {
      playlist = {
        timestamp: Date.now(),
        fuente: 'youtube',
        total_items: 1,
        indice_actual: 0,
        items: [{ posicion: 0, videoId: videoData.video_id, titulo: videoData.title || '', fuente: 'youtube' }],
      };
    }

    if (playlist) {
      const hasAuth = await _tryEnsureAuth();
      await rtdbWrite(RTDB_PATHS.playlistCargada(estId), playlist, hasAuth);
      console.log(`[VIBRRA] Playlist uploaded (${playlist.total_items} items)`);
    }
  } catch (err) {
    console.error('[VIBRRA] Playlist read error:', err.message);
  }
}

// ─── Message Handlers ────────────────────────────────────────────

async function handleLoginQR() {
  const extId = STATE.extensionId;
  if (!extId) {
    console.warn('[VIBRRA] LOGIN_QR: no extensionId');
    return { ok: false, error: 'No extensionId' };
  }

  // If we already have valid auth, return success directly
  if (STATE.uid && STATE.establecimientoId) {
    try {
      await ensureAuth();
      return {
        ok: true,
        establecimientoId: STATE.establecimientoId,
        establecimientoNombre: STATE.establecimientoNombre,
        establecimientoImagen: STATE.establecimientoImagen,
      };
    } catch {
      // Auth expired — continue to try re-linking below
      console.warn('[VIBRRA] LOGIN_QR: stored auth expired, attempting re-link');
    }
  }

  // Query RTDB: find session where Ext_vincular/id == our extensionId
  const match = await rtdbQueryByExtension(extId);
  if (!match) return { ok: false }; // Silent — popup polls this repeatedly

  const { estId, data } = match;
  const vincular = data.Ext_vincular;
  if (!vincular) return { ok: false };

  // Already used — try to restore from persisted storage
  if (vincular.usado && !vincular.custom_token) {
    const { vibrra_auth } = await chrome.storage.local.get('vibrra_auth');
    if (vibrra_auth?.uid && vibrra_auth.establecimientoId === estId) {
      STATE.uid = vibrra_auth.uid;
      STATE.idToken = vibrra_auth.idToken;
      STATE.refreshToken = vibrra_auth.refreshToken;
      STATE.tokenExpiry = vibrra_auth.tokenExpiry;
      STATE.establecimientoId = estId;
      STATE.establecimientoNombre = vincular.nombre || vibrra_auth.establecimientoNombre || '';
      STATE.establecimientoImagen = vincular.imagen || vibrra_auth.establecimientoImagen || null;

      try {
        await ensureAuth();
        console.log('[VIBRRA] Re-linked from storage:', STATE.establecimientoNombre);
        return {
          ok: true,
          establecimientoId: estId,
          establecimientoNombre: STATE.establecimientoNombre,
          establecimientoImagen: STATE.establecimientoImagen,
        };
      } catch {
        console.warn('[VIBRRA] Stored tokens expired — need re-link from dashboard');
        clearAuthState();
        return { ok: false, error: 'Sesión expirada. Vincula de nuevo desde el dashboard.' };
      }
    }
    return { ok: false, error: 'Sesión expirada. Vincula de nuevo desde el dashboard.' };
  }

  // Fresh link — needs custom_token
  if (!vincular.custom_token) {
    return { ok: false };
  }
  if (vincular.expira && Date.now() > vincular.expira) {
    return { ok: false, error: 'Vinculación expirada' };
  }

  // Sign in with custom token
  const authResult = await signInWithCustomToken(vincular.custom_token);

  STATE.uid = authResult.localId;
  STATE.idToken = authResult.idToken;
  STATE.refreshToken = authResult.refreshToken;
  STATE.tokenExpiry = Date.now() + parseInt(authResult.expiresIn, 10) * 1000;
  STATE.establecimientoId = estId;
  STATE.establecimientoNombre = vincular.nombre || '';
  STATE.establecimientoImagen = vincular.imagen || null;

  // Mark as used and remove custom_token (authenticated now)
  await rtdbUpdate(RTDB_PATHS.extVincular(estId), {
    usado: true,
    custom_token: null,
  });

  await persistState();

  console.log('[VIBRRA] Linked to:', STATE.establecimientoNombre, `(${estId})`);

  return {
    ok: true,
    establecimientoId: estId,
    establecimientoNombre: STATE.establecimientoNombre,
    establecimientoImagen: STATE.establecimientoImagen,
  };
}

async function handleLogout() {
  if (STATE.sesionActiva) await handleCerrarSesion();
  clearAuthState();
  return { ok: true };
}

async function handleIniciarSesion() {
  const estId = STATE.establecimientoId;
  console.log('[VIBRRA] INICIAR_SESION:', { uid: STATE.uid, estId });
  if (!estId) return { ok: false, error: 'No hay establecimiento vinculado' };

  // Check if we have valid auth — try refresh if needed
  const hasAuth = await _tryEnsureAuth();

  const reproductor = await detectarReproductor();
  console.log('[VIBRRA] Reproductor detectado:', reproductor);
  if (!reproductor) return { ok: false, error: 'No se detecta reproductor abierto' };

  STATE.reproductor = reproductor;
  STATE.sesionActiva = true;

  await rtdbUpdate(RTDB_PATHS.sesion(estId), {
    activa: true,
    cancion_actual: null,
    canciones_sonadas: 0,
    ultima_actividad: Date.now(),
    reproductor: { tipo: reproductor.tipo, label: reproductor.label },
  }, hasAuth);

  console.log('[VIBRRA] Session started:', estId, reproductor.label);

  startQueuePolling(estId);
  startHeartbeat(estId);
  setTimeout(() => triggerPlaylistRead(estId), 3000);

  return { ok: true };
}

async function handleCerrarSesion() {
  const estId = STATE.establecimientoId;

  stopQueuePolling();
  stopHeartbeat();
  limpiarCola();

  if (estId) {
    const hasAuth = await _tryEnsureAuth();
    try {
      await rtdbUpdate(RTDB_PATHS.sesion(estId), {
        activa: false,
        ultima_actividad: Date.now(),
      }, hasAuth);
    } catch (err) {
      console.warn('[VIBRRA] Error closing session:', err.message);
    }
  }

  STATE.reproductor = null;
  STATE.sesionActiva = false;
  return { ok: true };
}

async function handleTrackEnded() {
  if (!STATE.sesionActiva || !STATE.establecimientoId) return { ok: false };
  const estId = STATE.establecimientoId;

  // Mark finished song and increment counter
  await _markSongAsPlayed(estId);
  await _incrementCancionesSonadas(estId);

  const next = siguienteCancion();
  if (!next) {
    console.log('[VIBRRA] Queue empty — YouTube auto-advances');
    return { ok: true, queueEmpty: true };
  }

  try {
    await sendToPlayer({
      action: 'LOAD_TRACK',
      fuente_id: next.fuente_id,
      titulo: next.titulo,
      artista: next.artista,
    });
  } catch (err) {
    console.error('[VIBRRA] Failed to load track:', err.message);
    return { ok: false, error: err.message };
  }

  try {
    const hasAuth = await _tryEnsureAuth();
    await rtdbWrite(RTDB_PATHS.cancionActual(estId), {
      ...next, inicio_timestamp: Date.now(),
    }, hasAuth);
  } catch (err) {
    console.warn('[VIBRRA] Failed to update current song:', err.message);
  }

  return { ok: true, cancion: next.titulo };
}

async function handleTrackStarted(duracion_ms) {
  if (!STATE.sesionActiva || !STATE.establecimientoId) return { ok: false };
  const estId = STATE.establecimientoId;

  try {
    const hasAuth = await _tryEnsureAuth();

    // Update cancion_actual with new song info from YouTube
    // Read current video data via chrome.scripting
    let videoTitle = null;
    if (STATE.reproductor?.tabId) {
      try {
        const [result] = await chrome.scripting.executeScript({
          target: { tabId: STATE.reproductor.tabId },
          world: 'MAIN',
          func: () => {
            const p = document.getElementById('movie_player');
            if (p && typeof p.getVideoData === 'function') {
              const d = p.getVideoData();
              return { title: d.title, videoId: d.video_id, author: d.author };
            }
            return null;
          },
        });
        if (result?.result) videoTitle = result.result;
      } catch { /* ignore */ }
    }

    const cancionData = {
      duracion_ms,
      inicio_timestamp: Date.now(),
    };
    if (videoTitle) {
      cancionData.titulo = videoTitle.title || '';
      cancionData.artista = videoTitle.author || '';
      cancionData.fuente_id = videoTitle.videoId || '';
      cancionData.fuente = 'youtube';
    }

    await rtdbWrite(RTDB_PATHS.cancionActual(estId), cancionData, hasAuth);
    await rtdbWrite(RTDB_PATHS.ultimaActividad(estId), Date.now(), hasAuth);
  } catch (err) {
    console.warn('[VIBRRA] Failed to update track started:', err.message);
  }
  return { ok: true };
}

/**
 * Remove the first item from playlist_cargada (the song that just finished).
 */
async function _markSongAsPlayed(estId) {
  try {
    const hasAuth = await _tryEnsureAuth();
    const playlist = await rtdbRead(RTDB_PATHS.playlistCargada(estId), hasAuth);
    if (!playlist?.items || !Array.isArray(playlist.items)) return;

    const idx = playlist.indice_actual ?? 0;
    if (idx >= playlist.items.length) return;

    // Mark current song as played and advance index
    await rtdbUpdate(`${RTDB_PATHS.playlistCargada(estId)}/items/${idx}`, {
      sonada: true,
      sonada_timestamp: Date.now(),
    }, hasAuth);
    await rtdbUpdate(RTDB_PATHS.playlistCargada(estId), {
      indice_actual: idx + 1,
    }, hasAuth);

    console.log(`[VIBRRA] Marked song ${idx} as played. Next: ${idx + 1}`);
  } catch (err) {
    console.warn('[VIBRRA] Failed to mark song as played:', err.message);
  }
}

async function _incrementCancionesSonadas(estId) {
  try {
    const hasAuth = await _tryEnsureAuth();
    const current = await rtdbRead(RTDB_PATHS.cancionesSonadas(estId), hasAuth);
    const count = (typeof current === 'number' ? current : 0) + 1;
    await rtdbWrite(RTDB_PATHS.cancionesSonadas(estId), count, hasAuth);
    console.log(`[VIBRRA] Canciones sonadas: ${count}`);
  } catch (err) {
    console.warn('[VIBRRA] Failed to increment canciones_sonadas:', err.message);
  }
}

// ─── Host Interaction Handlers ──────────────────────────────────

/**
 * Log a host interaction (skip, rewind) to RTDB.
 * Uses push-style key so entries don't overwrite each other.
 */
async function _logInteraccion(estId, tipo, detalles) {
  try {
    const hasAuth = await _tryEnsureAuth();
    const path = RTDB_PATHS.interaccionesAnfitrion(estId);
    // POST = push (auto-generated key)
    const token = hasAuth ? await ensureAuth() : null;
    const q = token ? `?auth=${token}` : '';
    await fetch(`${RTDB_BASE}/${path}.json${q}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo,
        timestamp: Date.now(),
        ...detalles,
      }),
    });
    console.log(`[VIBRRA] Logged interaction: ${tipo}`);
  } catch (err) {
    console.warn('[VIBRRA] Failed to log interaction:', err.message);
  }
}

/**
 * Get the next unplayed song from playlist_cargada.
 * Returns null if no unplayed songs remain.
 */
async function _getNextFromPlaylist(estId) {
  try {
    const hasAuth = await _tryEnsureAuth();
    const playlist = await rtdbRead(RTDB_PATHS.playlistCargada(estId), hasAuth);
    if (!playlist?.items || !Array.isArray(playlist.items)) return null;

    const idx = playlist.indice_actual ?? 0;
    // Find next unplayed song starting from current index
    for (let i = idx; i < playlist.items.length; i++) {
      if (!playlist.items[i].sonada) {
        return { item: playlist.items[i], index: i };
      }
    }
    return null;
  } catch (err) {
    console.warn('[VIBRRA] Failed to read playlist:', err.message);
    return null;
  }
}

/**
 * HOST_SKIP_FORWARD: El anfitrión adelantó >10s en YouTube.
 * → Inyectar la siguiente canción de la cola VIBRRA o playlist.
 * → Registrar interacción.
 */
async function handleHostSkipForward(msg) {
  if (!STATE.sesionActiva || !STATE.establecimientoId) return { ok: false };
  const estId = STATE.establecimientoId;

  // Log the interaction
  await _logInteraccion(estId, 'skip_forward', {
    desde_seg: msg.desde,
    hasta_seg: msg.hasta,
    fuente: msg.fuente,
  });

  // Mark current song as played
  await _markSongAsPlayed(estId);
  await _incrementCancionesSonadas(estId);

  // 1. Try queue first (client-requested songs have priority)
  let next = siguienteCancion();

  // 2. If queue empty, try next from playlist_cargada
  if (!next) {
    const playlistNext = await _getNextFromPlaylist(estId);
    if (playlistNext) {
      next = {
        fuente_id: playlistNext.item.videoId,
        titulo: playlistNext.item.titulo || '',
        artista: '',
        fuente: playlistNext.item.fuente || 'youtube',
      };
    }
  }

  if (!next) {
    console.log('[VIBRRA] HOST_SKIP_FORWARD: no next song available');
    return { ok: true, injected: false };
  }

  // Inject the song
  try {
    await sendToPlayer({
      action: 'LOAD_TRACK',
      fuente_id: next.fuente_id,
      titulo: next.titulo,
      artista: next.artista,
    });

    // Update cancion_actual in RTDB
    const hasAuth = await _tryEnsureAuth();
    await rtdbWrite(RTDB_PATHS.cancionActual(estId), {
      titulo: next.titulo,
      artista: next.artista || '',
      fuente_id: next.fuente_id,
      fuente: next.fuente || 'youtube',
      inicio_timestamp: Date.now(),
      inyectada: true,
    }, hasAuth);

    console.log(`[VIBRRA] Injected next song: ${next.titulo}`);
    return { ok: true, injected: true, cancion: next.titulo };
  } catch (err) {
    console.error('[VIBRRA] Failed to inject song:', err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * HOST_REWIND: El anfitrión atrasó >3s en YouTube.
 * → Dejar que repita la misma canción.
 * → Registrar interacción en RTDB.
 */
async function handleHostRewind(msg) {
  if (!STATE.sesionActiva || !STATE.establecimientoId) return { ok: false };
  const estId = STATE.establecimientoId;

  // Log the interaction (no playback change — just record it)
  await _logInteraccion(estId, 'rewind', {
    desde_seg: msg.desde,
    hasta_seg: msg.hasta,
    fuente: msg.fuente,
  });

  console.log(`[VIBRRA] HOST_REWIND logged: ${msg.desde}s → ${msg.hasta}s`);
  return { ok: true };
}

async function handlePlaylistData(establecimientoId, playlist) {
  try {
    const hasAuth = await _tryEnsureAuth();
    await rtdbWrite(RTDB_PATHS.playlistCargada(establecimientoId), playlist, hasAuth);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ─── Message Router ──────────────────────────────────────────────

async function handleMessage(msg) {
  switch (msg.action) {
    case 'GET_ESTADO': {
      // If authenticated, check ownership (non-blocking for popup responsiveness)
      if (STATE.uid && STATE.establecimientoId) {
        checkExtensionOwnership(); // fire and forget — next GET_ESTADO will reflect change
      }
      // "autenticado" is true if we have uid OR if we have an establecimiento
      // (linked via RTDB but auth tokens may need refresh)
      const vinculado = !!STATE.uid || !!STATE.establecimientoId;

      // Read canciones_sonadas from RTDB if session active
      let cancionesSonadas = 0;
      if (STATE.sesionActiva && STATE.establecimientoId) {
        try {
          const hasAuth = await _tryEnsureAuth();
          const count = await rtdbRead(RTDB_PATHS.cancionesSonadas(STATE.establecimientoId), hasAuth);
          cancionesSonadas = typeof count === 'number' ? count : 0;
        } catch { /* ignore */ }
      }

      return {
        autenticado: vinculado,
        sesionActiva: STATE.sesionActiva,
        extensionId: STATE.extensionId,
        establecimientoId: STATE.establecimientoId,
        establecimientoNombre: STATE.establecimientoNombre,
        establecimientoImagen: STATE.establecimientoImagen,
        reproductor: STATE.reproductor?.label ?? null,
        cancionesSonadas,
      };
    }

    case 'LOGIN_QR':
      return handleLoginQR();

    case 'LOGOUT':
      return handleLogout();

    case 'INICIAR_SESION':
      return handleIniciarSesion();

    case 'CERRAR_SESION':
      return handleCerrarSesion();

    case 'TRACK_ENDED':
      return handleTrackEnded();

    case 'TRACK_STARTED':
      return handleTrackStarted(msg.duracion_ms);

    case 'HOST_SKIP_FORWARD':
      return handleHostSkipForward(msg);

    case 'HOST_REWIND':
      return handleHostRewind(msg);

    case 'PLAYLIST_DATA':
      return handlePlaylistData(msg.establecimientoId, msg.playlist);

    default:
      return { error: `Unknown action: ${msg.action}` };
  }
}

// ─── Startup (must complete before handling messages) ───────────

let _startupResolve;
const _startupReady = new Promise((r) => { _startupResolve = r; });

(async () => {
  try {
    await getOrCreateExtensionId();
    await restoreState();
    console.log(
      '[VIBRRA] Service Worker ready',
      `(extId: ${STATE.extensionId})`,
      STATE.uid ? `(auth: ${STATE.uid}, est: ${STATE.establecimientoNombre})` : '(not authenticated)',
    );
  } catch (err) {
    console.error('[VIBRRA] Startup error:', err);
  } finally {
    _startupResolve();
  }
})();

// ─── Message Listener (waits for startup) ───────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  _startupReady
    .then(() => handleMessage(msg))
    .then(sendResponse)
    .catch((err) => {
      console.error(`[VIBRRA] ${msg.action} error:`, err);
      sendResponse({ error: err.message });
    });
  return true;
});

// ─── Tab Close Detection ──────────────────────────────────────────

chrome.tabs.onRemoved.addListener((tabId) => {
  // Only act if we have an active session with a known player tab
  if (!STATE.sesionActiva || !STATE.reproductor?.tabId) return;

  if (tabId === STATE.reproductor.tabId) {
    console.log('[VIBRRA] Player tab closed — closing session');
    handleCerrarSesion().catch((err) => {
      console.error('[VIBRRA] Auto-close session error:', err.message);
    });
  }
});
