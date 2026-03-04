/**
 * content_scripts/spotify.js
 * 
 * Content Script inyectado en open.spotify.com.
 * 
 * Estrategia: Spotify no expone una API pública para extensiones,
 * así que controlamos el reproductor observando el DOM y simulando
 * clics en los controles nativos de la interfaz web.
 * 
 * Comunicación con el Worker:
 *   Worker → CS:  { action: 'LOAD_TRACK', fuente_id: 'spotify:track:xxx', titulo, artista }
 *   CS → Worker:  { action: 'TRACK_ENDED' }
 *   CS → Worker:  { action: 'TRACK_STARTED', duracion_ms: number }
 * 
 * NOTA: Requiere que el anfitrión tenga Spotify Premium activo.
 * Sin Premium, Spotify reproduce en modo aleatorio y no permite
 * seleccionar canciones específicas.
 */

(function () {
  'use strict';

  // ─── Selectores del DOM de Spotify Web ──────────────────────────────────────
  // Spotify actualiza su UI frecuentemente — estos pueden cambiar.
  // Si dejan de funcionar, inspeccionar el DOM en open.spotify.com.

  const SEL = {
    /** Barra de progreso de la canción actual */
    progressBar:    '[data-testid="playback-progressbar"]',

    /** Botón de siguiente canción */
    btnNext:        '[data-testid="control-button-skip-forward"]',

    /** Nombre de la canción actual */
    trackName:      '[data-testid="context-item-info-title"]',

    /** Duración total (formato "3:45") */
    duration:       '[data-testid="playback-duration"]',

    /** Tiempo actual reproducido */
    position:       '[data-testid="playback-position"]',

    /** Indicador de estado (icono de pausa visible = reproduciendo) */
    pauseBtn:       '[data-testid="control-button-pause"]'
  };

  // ─── Estado interno ─────────────────────────────────────────────────────────

  /** @type {MutationObserver|null} Observer que monitorea cambios en la UI */
  let _observer = null;

  /** @type {string|null} Nombre de la canción actualmente detectada */
  let _trackActual = null;

  /** @type {boolean} Evita disparar TRACK_ENDED múltiples veces */
  let _trackEndedDisparado = false;

  // ─── Inicialización ─────────────────────────────────────────────────────────

  function inicializar() {
    console.log('[VIBRRA] Spotify CS activo ✓');
    _iniciarObserver();
  }

  /**
   * Observa cambios en el nombre de la canción para detectar
   * cuándo Spotify avanza a la siguiente (incluyendo el fin natural).
   * 
   * También monitorea la barra de progreso para detectar cuando
   * llega al 100% (fin de canción).
   */
  function _iniciarObserver() {
    if (_observer) _observer.disconnect();

    // Monitor de progreso cada 2 segundos
    setInterval(_verificarFin, 2000);

    // Observer para detectar cambio de canción (Spotify avanzó solo)
    _observer = new MutationObserver(() => {
      const nombreActual = document.querySelector(SEL.trackName)?.textContent;
      if (nombreActual && nombreActual !== _trackActual) {
        // La canción cambió externamente (Spotify avanzó)
        _trackActual = nombreActual;
        // No disparamos TRACK_ENDED aquí — solo registramos el cambio
      }
    });

    const target = document.querySelector('[data-testid="now-playing-widget"]');
    if (target) {
      _observer.observe(target, { childList: true, subtree: true });
    }
  }

  /**
   * Verifica si la canción llegó al final comparando posición vs duración.
   * Spotify no siempre dispara un evento claro de "fin" — hay que detectarlo.
   */
  function _verificarFin() {
    const posTexto = document.querySelector(SEL.position)?.textContent;
    const durTexto = document.querySelector(SEL.duration)?.textContent;

    if (!posTexto || !durTexto) return;

    const pos = _parsearTiempo(posTexto);
    const dur = _parsearTiempo(durTexto);

    // Si la posición está a 1 segundo o menos del final → canción terminó
    if (dur > 0 && dur - pos <= 1 && !_trackEndedDisparado) {
      _trackEndedDisparado = true;
      chrome.runtime.sendMessage({ action: 'TRACK_ENDED', fuente: 'spotify' });
      console.log('[VIBRRA] Spotify: canción terminó → notificando Worker');
    } else if (pos < dur - 2) {
      _trackEndedDisparado = false;
    }
  }

  // ─── Mensajes desde el Service Worker ───────────────────────────────────────

  chrome.runtime.onMessage.addListener((mensaje, _sender, responder) => {
    if (mensaje.action === 'LOAD_TRACK') {
      _cargarCancion(mensaje.fuente_id, mensaje.titulo, mensaje.artista);
      responder({ ok: true });
    }

    if (mensaje.action === 'PING') {
      responder({ ok: true, fuente: 'spotify' });
    }

    return true;
  });

  /**
   * Navega a una canción específica de Spotify usando su URI.
   * 
   * @param {string} spotifyUri — URI del track (e.g. "spotify:track:4iV5W9uYEdYUVa79Axb7Rh")
   * @param {string} titulo
   * @param {string} artista
   */
  function _cargarCancion(spotifyUri, titulo, artista) {
    console.log(`[VIBRRA] Spotify: cargando ${artista} — ${titulo}`);
    _trackEndedDisparado = false;

    // Navegar a la URL de la canción en Spotify Web
    // Convertir spotify:track:ID → /track/ID
    const trackId = spotifyUri.replace('spotify:track:', '');
    const url = `https://open.spotify.com/track/${trackId}`;

    // Abrir la URL en la misma pestaña
    location.href = url;

    // Esperar a que cargue y reportar duración
    setTimeout(() => {
      const durTexto = document.querySelector(SEL.duration)?.textContent;
      if (durTexto) {
        const duracion_ms = _parsearTiempo(durTexto) * 1000;
        chrome.runtime.sendMessage({
          action:      'TRACK_STARTED',
          fuente:      'spotify',
          duracion_ms: Math.round(duracion_ms)
        });
      }
    }, 3000);
  }

  // ─── Utilidades ─────────────────────────────────────────────────────────────

  /**
   * Convierte un tiempo en formato "m:ss" a segundos.
   * 
   * @param {string} texto — e.g. "3:45"
   * @returns {number} Segundos
   */
  function _parsearTiempo(texto) {
    const partes = texto.trim().split(':');
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
