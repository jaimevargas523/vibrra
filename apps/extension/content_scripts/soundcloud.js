/**
 * content_scripts/soundcloud.js
 * 
 * Content Script inyectado en soundcloud.com.
 * 
 * Estrategia: SoundCloud expone un Widget API público que permite
 * controlar el reproductor embebido. Sin embargo, en soundcloud.com
 * (no en un iframe externo) usamos el Widget API directamente
 * a través de postMessage, que SoundCloud soporta nativamente.
 * 
 * Comunicación con el Worker:
 *   Worker → CS:  { action: 'LOAD_TRACK', fuente_id: 'https://soundcloud.com/...', titulo, artista }
 *   CS → Worker:  { action: 'TRACK_ENDED' }
 *   CS → Worker:  { action: 'TRACK_STARTED', duracion_ms: number }
 */

(function () {
  'use strict';

  // ─── Widget API de SoundCloud ────────────────────────────────────────────────
  // SoundCloud expone SC.Widget en su página. Lo cargamos dinámicamente.

  const SC_WIDGET_URL = 'https://w.soundcloud.com/player/api.js';

  // ─── Estado interno ─────────────────────────────────────────────────────────

  /** @type {Object|null} Instancia del SC Widget */
  let _widget = null;

  /** @type {boolean} */
  let _trackEndedDisparado = false;

  // ─── Inicialización ─────────────────────────────────────────────────────────

  function inicializar() {
    console.log('[VIBRRA] SoundCloud CS activo ✓');
    _cargarWidgetAPI();
  }

  /**
   * Carga el Widget API de SoundCloud si no está ya disponible,
   * luego inicializa el widget sobre el iframe del reproductor.
   */
  function _cargarWidgetAPI() {
    if (window.SC && window.SC.Widget) {
      _inicializarWidget();
      return;
    }

    const script = document.createElement('script');
    script.src = SC_WIDGET_URL;
    script.onload = _inicializarWidget;
    document.head.appendChild(script);
  }

  /**
   * Obtiene el iframe del reproductor de SoundCloud y crea
   * la instancia del Widget API sobre él.
   */
  function _inicializarWidget() {
    const MAX_INTENTOS = 15;
    let intentos = 0;

    const interval = setInterval(() => {
      intentos++;

      // SoundCloud usa un iframe con id="widget_iframe" o similar
      const iframe = document.querySelector('iframe[src*="soundcloud.com/player"]');

      if (iframe) {
        clearInterval(interval);
        _widget = SC.Widget(iframe);
        _registrarEventos();
        console.log('[VIBRRA] SoundCloud Widget inicializado ✓');

      } else if (intentos >= MAX_INTENTOS) {
        clearInterval(interval);
        // Fallback: monitoreo por DOM si no hay iframe embebido
        console.warn('[VIBRRA] SoundCloud: iframe no encontrado, usando fallback DOM');
        _iniciarFallbackDOM();
      }
    }, 500);
  }

  /**
   * Registra los eventos del Widget API de SoundCloud.
   */
  function _registrarEventos() {
    if (!_widget) return;

    // Canción terminó
    _widget.bind(SC.Widget.Events.FINISH, () => {
      if (!_trackEndedDisparado) {
        _trackEndedDisparado = true;
        chrome.runtime.sendMessage({ action: 'TRACK_ENDED', fuente: 'soundcloud' });
        console.log('[VIBRRA] SoundCloud: canción terminó → notificando Worker');
      }
    });

    // Canción empezó a reproducir
    _widget.bind(SC.Widget.Events.PLAY, () => {
      _trackEndedDisparado = false;

      _widget.getDuration((duracion_ms) => {
        chrome.runtime.sendMessage({
          action:      'TRACK_STARTED',
          fuente:      'soundcloud',
          duracion_ms: Math.round(duracion_ms)
        });
      });
    });
  }

  /**
   * Fallback cuando SoundCloud está en modo página (no iframe).
   * Monitorea el DOM para detectar el fin de una canción.
   */
  function _iniciarFallbackDOM() {
    // SoundCloud en modo página muestra el tiempo en .playbackTimeline__timePassed
    setInterval(() => {
      const tiempoActual = document.querySelector('.playbackTimeline__timePassed')?.textContent;
      const tiempoTotal  = document.querySelector('.playbackTimeline__duration')?.textContent;

      if (!tiempoActual || !tiempoTotal) return;

      const pos = _parsearTiempo(tiempoActual);
      const dur = _parsearTiempo(tiempoTotal);

      if (dur > 0 && dur - pos <= 1 && !_trackEndedDisparado) {
        _trackEndedDisparado = true;
        chrome.runtime.sendMessage({ action: 'TRACK_ENDED', fuente: 'soundcloud' });
      } else if (pos < dur - 2) {
        _trackEndedDisparado = false;
      }
    }, 2000);
  }

  // ─── Mensajes desde el Service Worker ───────────────────────────────────────

  chrome.runtime.onMessage.addListener((mensaje, _sender, responder) => {
    if (mensaje.action === 'LOAD_TRACK') {
      _cargarCancion(mensaje.fuente_id, mensaje.titulo, mensaje.artista);
      responder({ ok: true });
    }

    if (mensaje.action === 'PING') {
      responder({ ok: true, fuente: 'soundcloud' });
    }

    return true;
  });

  /**
   * Carga un track de SoundCloud por su URL.
   * 
   * @param {string} trackUrl — URL del track (e.g. "https://soundcloud.com/artist/song")
   * @param {string} titulo
   * @param {string} artista
   */
  function _cargarCancion(trackUrl, titulo, artista) {
    console.log(`[VIBRRA] SoundCloud: cargando ${artista} — ${titulo}`);
    _trackEndedDisparado = false;

    if (_widget) {
      // Cargar vía Widget API (modo iframe)
      _widget.load(trackUrl, { auto_play: true });
    } else {
      // Fallback: navegar directamente a la URL del track
      location.href = trackUrl;
    }
  }

  // ─── Utilidades ─────────────────────────────────────────────────────────────

  /**
   * Convierte "m:ss" a segundos.
   * 
   * @param {string} texto
   * @returns {number}
   */
  function _parsearTiempo(texto) {
    const partes = (texto ?? '').trim().split(':');
    if (partes.length !== 2) return 0;
    return parseInt(partes[0]) * 60 + parseInt(partes[1]);
  }

  // ─── Arranque ────────────────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
  } else {
    inicializar();
  }

})();
