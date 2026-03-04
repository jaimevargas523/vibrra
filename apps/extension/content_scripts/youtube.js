/**
 * content_scripts/youtube.js
 *
 * Content Script inyectado en youtube.com (ISOLATED world).
 *
 * Monitorea el <video> element para detectar:
 *   - Canción terminó (ended)
 *   - Nueva canción cargada (loadedmetadata)
 *   - Adelantar / atrasar (seeked)
 *
 * Las acciones que necesitan la API de YouTube (cargar canción, leer playlist)
 * las ejecuta el Service Worker vía chrome.scripting.executeScript con world: MAIN.
 *
 * Comunicación CS → Worker:
 *   TRACK_ENDED        — canción terminó naturalmente
 *   TRACK_STARTED      — nueva canción cargó (con duración)
 *   HOST_SKIP_FORWARD  — anfitrión adelantó (>10s adelante)
 *   HOST_REWIND        — anfitrión atrasó (>3s atrás)
 *
 * Worker → CS:
 *   PING → { ok: true, fuente: 'youtube' }
 */

(function () {
  'use strict';

  let _video = null;
  let _endedDisparado = false;
  let _lastTime = 0;       // último currentTime conocido antes del seek
  let _tracking = false;    // si estamos trackeando timeupdate
  let _transitioning = false; // true durante transición de canción (ignora seeks)

  // ─── Safe sendMessage (handles orphaned context) ──────────────

  function safeSend(msg) {
    try {
      chrome.runtime.sendMessage(msg, () => {
        if (chrome.runtime.lastError) {
          // Extension context invalidated — stop monitoring
          console.warn('[VIBRRA] Extension context lost, stopping monitor');
          _stopMonitor();
        }
      });
    } catch {
      console.warn('[VIBRRA] Extension context invalidated');
      _stopMonitor();
    }
  }

  // ─── Inicialización ───────────────────────────────────────────

  function inicializar() {
    if (!location.pathname.startsWith('/watch')) return;

    const MAX_INTENTOS = 30;
    let intentos = 0;

    const interval = setInterval(() => {
      intentos++;
      const video = document.querySelector('video');

      if (video) {
        clearInterval(interval);
        if (_video !== video) {
          _video = video;
          _iniciarMonitor();
        }
        console.log('[VIBRRA] Video element detectado');
      } else if (intentos >= MAX_INTENTOS) {
        clearInterval(interval);
      }
    }, 500);
  }

  // ─── Monitor de eventos del <video> ───────────────────────────

  function _onTimeUpdate() {
    if (_video) _lastTime = _video.currentTime;
  }

  function _onEnded() {
    if (!_endedDisparado) {
      _endedDisparado = true;
      _transitioning = true; // Canción terminó → transición en curso
      safeSend({ action: 'TRACK_ENDED', fuente: 'youtube' });
      console.log('[VIBRRA] Canción terminó');
    }
  }

  function _onLoadedMetadata() {
    _endedDisparado = false;
    _transitioning = true; // Nueva canción cargando → ignorar seeks iniciales
    _lastTime = 0;
    if (_video && _video.duration > 0) {
      safeSend({
        action: 'TRACK_STARTED',
        fuente: 'youtube',
        duracion_ms: Math.round(_video.duration * 1000),
      });
    }
    // Dar 2s de gracia para que el video se estabilice antes de detectar seeks
    setTimeout(() => { _transitioning = false; }, 2000);
  }

  function _onPlaying() {
    _endedDisparado = false;
  }

  function _onSeeked() {
    if (!_video) return;
    const now = _video.currentTime;
    const delta = now - _lastTime;

    // Ignorar seeks durante transición de canción (cambio en playlist, ended → next, etc.)
    if (_transitioning) {
      _lastTime = now;
      return;
    }

    // Ignorar si currentTime está cerca de 0 (nueva canción arrancando)
    if (now < 3 && _lastTime === 0) {
      _lastTime = now;
      return;
    }

    if (delta > 10) {
      // Adelantó más de 10 segundos → skip forward
      safeSend({
        action: 'HOST_SKIP_FORWARD',
        fuente: 'youtube',
        desde: Math.round(_lastTime),
        hasta: Math.round(now),
      });
      console.log(`[VIBRRA] Anfitrión adelantó: ${Math.round(_lastTime)}s → ${Math.round(now)}s`);
    } else if (delta < -3) {
      // Atrasó más de 3 segundos → rewind
      safeSend({
        action: 'HOST_REWIND',
        fuente: 'youtube',
        desde: Math.round(_lastTime),
        hasta: Math.round(now),
      });
      console.log(`[VIBRRA] Anfitrión atrasó: ${Math.round(_lastTime)}s → ${Math.round(now)}s`);
    }

    _lastTime = now;
  }

  function _iniciarMonitor() {
    _video.addEventListener('ended', _onEnded);
    _video.addEventListener('loadedmetadata', _onLoadedMetadata);
    _video.addEventListener('playing', _onPlaying);
    _video.addEventListener('seeked', _onSeeked);
    _video.addEventListener('timeupdate', _onTimeUpdate);
    _tracking = true;
  }

  function _stopMonitor() {
    if (_video && _tracking) {
      _video.removeEventListener('ended', _onEnded);
      _video.removeEventListener('loadedmetadata', _onLoadedMetadata);
      _video.removeEventListener('playing', _onPlaying);
      _video.removeEventListener('seeked', _onSeeked);
      _video.removeEventListener('timeupdate', _onTimeUpdate);
      _tracking = false;
    }
  }

  // ─── Mensajes desde el Service Worker ─────────────────────────

  chrome.runtime.onMessage.addListener((mensaje, _sender, responder) => {
    if (mensaje.action === 'PING') {
      responder({ ok: true, fuente: 'youtube' });
    } else {
      responder({ ok: true });
    }
    return true;
  });

  // ─── Arranque ─────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
  } else {
    inicializar();
  }

  // Re-inicializar en navegación SPA de YouTube
  let _urlActual = location.href;
  new MutationObserver(() => {
    if (location.href !== _urlActual) {
      _urlActual = location.href;
      _transitioning = true; // Navegación SPA → ignorar seeks
      _stopMonitor();
      _video = null;
      _endedDisparado = false;
      _lastTime = 0;
      setTimeout(inicializar, 1500);
    }
  }).observe(document.body, { childList: true, subtree: true });

})();
