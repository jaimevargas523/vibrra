/**
 * popup.js
 *
 * VIBRRA Extension Popup UI Controller.
 * Communicates with service_worker_core.js via chrome.runtime.sendMessage.
 */

(function () {
  'use strict';

  console.log('[VIBRRA POPUP] Script loaded');

  // ─── Constants ─────────────────────────────────────────────────

  var QR_EXPIRY_MS = 5 * 60 * 1000;
  var QR_POLL_INTERVAL = 2000;
  var MSG_TIMEOUT = 3000; // 3 second timeout for service worker messages

  // ─── DOM References ────────────────────────────────────────────

  function $(id) { return document.getElementById(id); }

  var DOM = {
    vistaLogin:  $('vista-login'),
    vistaInicio: $('vista-inicio'),
    vistaSesion: $('vista-sesion'),

    qrCanvas:    $('qr-canvas'),
    qrTimer:     $('qr-timer'),
    qrRefresh:   $('qr-refresh'),
    loginEstado: $('login-estado'),
    extIdBox:    $('ext-id-box'),
    extIdText:   $('ext-id-text'),
    extIdCopy:   $('ext-id-copy'),

    estNombre:   $('est-nombre'),
    repEstado:   $('reproductor-estado'),
    repIcono:    $('reproductor-icono'),
    repNombre:   $('reproductor-nombre'),
    noRep:       $('no-reproductor'),
    btnIniciar:  $('btn-iniciar'),
    btnLogout:   $('btn-logout'),

    sesionRep:   $('sesion-reproductor'),
    colaCount:   $('cola-count'),
    btnCerrar:   $('btn-cerrar'),
  };

  // ─── State ─────────────────────────────────────────────────────

  var _extensionId = null;
  var _qrExpiry = 0;
  var _qrPollInterval = null;
  var _qrCountdown = null;
  var _refreshInterval = null;

  // ─── Helper: send message to service worker (with timeout) ────

  function sendMsg(msg) {
    return new Promise(function (resolve) {
      var timer = setTimeout(function () {
        console.warn('[VIBRRA POPUP] sendMsg timeout:', msg.action);
        resolve({ _timeout: true });
      }, MSG_TIMEOUT);

      try {
        chrome.runtime.sendMessage(msg, function (response) {
          clearTimeout(timer);
          if (chrome.runtime.lastError) {
            console.warn('[VIBRRA POPUP] sendMsg error:', chrome.runtime.lastError.message);
            resolve({ _error: chrome.runtime.lastError.message });
          } else {
            resolve(response || {});
          }
        });
      } catch (err) {
        clearTimeout(timer);
        console.error('[VIBRRA POPUP] sendMsg exception:', err);
        resolve({ _error: err.message });
      }
    });
  }

  // ─── View Management ──────────────────────────────────────────

  function showView(name) {
    if (DOM.vistaLogin)  DOM.vistaLogin.classList.add('oculto');
    if (DOM.vistaInicio) DOM.vistaInicio.classList.add('oculto');
    if (DOM.vistaSesion) DOM.vistaSesion.classList.add('oculto');

    if (name === 'login'  && DOM.vistaLogin)  DOM.vistaLogin.classList.remove('oculto');
    if (name === 'inicio' && DOM.vistaInicio) DOM.vistaInicio.classList.remove('oculto');
    if (name === 'sesion' && DOM.vistaSesion) DOM.vistaSesion.classList.remove('oculto');

    console.log('[VIBRRA POPUP] Vista:', name);
  }

  // ─── Status Messages ──────────────────────────────────────────

  function showEstado(msg, type) {
    type = type || 'error';
    if (!DOM.loginEstado) return;
    DOM.loginEstado.textContent = msg;
    DOM.loginEstado.className = 'estado-msg ' + type;
    DOM.loginEstado.classList.remove('oculto');
    console.log('[VIBRRA POPUP] Estado:', type, msg);
  }

  // ─── Establecimiento Info ─────────────────────────────────────

  function mostrarEstablecimiento(nombre) {
    if (DOM.estNombre) DOM.estNombre.textContent = nombre || '';
  }

  // ─── Initialization ───────────────────────────────────────────

  async function init() {
    console.log('[VIBRRA POPUP] init() start');

    var estado = await sendMsg({ action: 'GET_ESTADO' });
    console.log('[VIBRRA POPUP] GET_ESTADO response:', JSON.stringify(estado));

    if (estado._timeout || estado._error) {
      // Service worker not responding
      showView('login');
      showEstado('Service Worker no responde. Recarga la extensión.');
      return;
    }

    _extensionId = estado.extensionId || null;

    if (!estado.autenticado) {
      showView('login');
      generarQR();
    } else if (!estado.sesionActiva) {
      showView('inicio');
      mostrarEstablecimiento(estado.establecimientoNombre);
      detectarReproductor();
    } else {
      showView('sesion');
      actualizarSesion(estado);
      startRefreshLoop();
    }
  }

  // ─── QR Login Flow ────────────────────────────────────────────

  async function generarQR() {
    stopQrPolling();

    if (!_extensionId) {
      var estado = await sendMsg({ action: 'GET_ESTADO' });
      _extensionId = estado.extensionId;
      console.log('[VIBRRA POPUP] extensionId retry:', _extensionId);
    }

    if (!_extensionId) {
      showEstado('Error: no se pudo obtener ID de extensión');
      return;
    }

    _qrExpiry = Date.now() + QR_EXPIRY_MS;
    if (DOM.qrTimer) DOM.qrTimer.textContent = 'Generando QR...';

    var qrData = 'vibrra://ext/' + _extensionId;
    console.log('[VIBRRA POPUP] QR data:', qrData);

    try {
      if (typeof VIBRRA_QR === 'undefined') {
        showEstado('Error: librería QR no cargada');
        return;
      }
      VIBRRA_QR.render(DOM.qrCanvas, qrData, {
        scale: 5,
        foreground: '#FFE566',
        background: '#1A1A1A',
        margin: 2,
      });
      console.log('[VIBRRA POPUP] QR rendered');

      // Show extensionId as copiable text
      if (DOM.extIdBox) DOM.extIdBox.classList.remove('oculto');
      if (DOM.extIdText) DOM.extIdText.textContent = _extensionId;
    } catch (err) {
      showEstado('Error renderizando QR: ' + err.message);
      return;
    }

    startQrCountdown();
    startQrPolling();
  }

  // ─── QR Polling ──────────────────────────────────────────────

  function startQrPolling() {
    _qrPollInterval = setInterval(async function () {
      if (Date.now() > _qrExpiry) {
        stopQrPolling();
        if (DOM.qrTimer) DOM.qrTimer.textContent = 'QR expirado';
        return;
      }

      try {
        var result = await sendMsg({ action: 'LOGIN_QR' });

        if (result.ok) {
          console.log('[VIBRRA POPUP] Vinculación exitosa:', result.establecimientoNombre);
          stopQrPolling();
          showView('inicio');
          mostrarEstablecimiento(result.establecimientoNombre);
          detectarReproductor();
        }
      } catch (err) {
        console.warn('[VIBRRA POPUP] QR poll error:', err);
      }
    }, QR_POLL_INTERVAL);
  }

  function stopQrPolling() {
    if (_qrPollInterval) {
      clearInterval(_qrPollInterval);
      _qrPollInterval = null;
    }
    if (_qrCountdown) {
      clearInterval(_qrCountdown);
      _qrCountdown = null;
    }
  }

  function startQrCountdown() {
    updateCountdown();
    _qrCountdown = setInterval(updateCountdown, 1000);
  }

  function updateCountdown() {
    var remaining = Math.max(0, _qrExpiry - Date.now());
    var mins = Math.floor(remaining / 60000);
    var secs = Math.floor((remaining % 60000) / 1000);
    if (DOM.qrTimer) {
      DOM.qrTimer.textContent = 'Expira en ' + mins + ':' + String(secs).padStart(2, '0');
    }
    if (remaining <= 0) {
      if (DOM.qrTimer) DOM.qrTimer.textContent = 'QR expirado';
      stopQrPolling();
    }
  }

  // ─── Inicio View ────────────────────────────────────────────

  async function detectarReproductor() {
    var patterns = [
      { tipo: 'youtube',    regex: /youtube\.com\/(watch|music)/, label: 'YouTube',    icon: '\u25B6' },
      { tipo: 'spotify',    regex: /open\.spotify\.com/,          label: 'Spotify',    icon: '\u266B' },
      { tipo: 'soundcloud', regex: /soundcloud\.com/,             label: 'SoundCloud', icon: '\u266A' },
    ];

    try {
      var tabs = await chrome.tabs.query({});
      var found = null;

      for (var t = 0; t < tabs.length; t++) {
        var url = tabs[t].url || '';
        for (var p = 0; p < patterns.length; p++) {
          if (patterns[p].regex.test(url)) {
            found = patterns[p];
            break;
          }
        }
        if (found) break;
      }

      if (found) {
        if (DOM.repEstado) DOM.repEstado.classList.remove('oculto');
        if (DOM.noRep) DOM.noRep.classList.add('oculto');
        if (DOM.repIcono) DOM.repIcono.textContent = found.icon;
        if (DOM.repNombre) DOM.repNombre.textContent = found.label;
        if (DOM.btnIniciar) DOM.btnIniciar.disabled = false;
      } else {
        if (DOM.repEstado) DOM.repEstado.classList.add('oculto');
        if (DOM.noRep) DOM.noRep.classList.remove('oculto');
        if (DOM.btnIniciar) DOM.btnIniciar.disabled = true;
      }
    } catch (e) {
      if (DOM.repEstado) DOM.repEstado.classList.add('oculto');
      if (DOM.noRep) DOM.noRep.classList.remove('oculto');
      if (DOM.btnIniciar) DOM.btnIniciar.disabled = true;
    }
  }

  // ─── Session View ──────────────────────────────────────────

  function actualizarSesion(estado) {
    if (DOM.sesionRep) DOM.sesionRep.textContent = estado.reproductor || '';
    if (DOM.colaCount) DOM.colaCount.textContent = estado.cancionesSonadas || 0;
  }

  function startRefreshLoop() {
    stopRefreshLoop();
    _refreshInterval = setInterval(async function () {
      try {
        var estado = await sendMsg({ action: 'GET_ESTADO' });
        if (estado.sesionActiva) {
          actualizarSesion(estado);
        } else {
          stopRefreshLoop();
          showView('inicio');
          mostrarEstablecimiento(estado.establecimientoNombre);
          detectarReproductor();
        }
      } catch (e) {
        /* popup may be closing */
      }
    }, 3000);
  }

  function stopRefreshLoop() {
    if (_refreshInterval) {
      clearInterval(_refreshInterval);
      _refreshInterval = null;
    }
  }

  // ─── Event Listeners ──────────────────────────────────────────

  if (DOM.qrRefresh) DOM.qrRefresh.addEventListener('click', generarQR);

  if (DOM.extIdCopy) DOM.extIdCopy.addEventListener('click', function () {
    if (!_extensionId) return;
    navigator.clipboard.writeText(_extensionId).then(function () {
      DOM.extIdCopy.textContent = '✓';
      DOM.extIdCopy.classList.add('copied');
      setTimeout(function () {
        DOM.extIdCopy.textContent = '⎘';
        DOM.extIdCopy.classList.remove('copied');
      }, 1500);
    });
  });

  if (DOM.btnIniciar) DOM.btnIniciar.addEventListener('click', async function () {
    DOM.btnIniciar.disabled = true;
    DOM.btnIniciar.textContent = 'Iniciando...';

    try {
      var result = await sendMsg({ action: 'INICIAR_SESION' });
      console.log('[VIBRRA POPUP] INICIAR_SESION result:', JSON.stringify(result));

      if (result.ok) {
        showView('sesion');
        var estado = await sendMsg({ action: 'GET_ESTADO' });
        actualizarSesion(estado);
        startRefreshLoop();
      } else {
        showEstado(result.error || 'Error al iniciar');
      }
    } catch (err) {
      showEstado(err.message);
    } finally {
      DOM.btnIniciar.disabled = false;
      DOM.btnIniciar.textContent = 'VIBRRAR';
    }
  });

  if (DOM.btnCerrar) DOM.btnCerrar.addEventListener('click', async function () {
    DOM.btnCerrar.disabled = true;
    DOM.btnCerrar.textContent = 'Cerrando...';

    try {
      await sendMsg({ action: 'CERRAR_SESION' });
      stopRefreshLoop();
      showView('inicio');

      var estado = await sendMsg({ action: 'GET_ESTADO' });
      mostrarEstablecimiento(estado.establecimientoNombre);
      detectarReproductor();
    } catch (err) {
      showEstado(err.message);
    } finally {
      DOM.btnCerrar.disabled = false;
      DOM.btnCerrar.textContent = 'Cerrar sesión';
    }
  });

  if (DOM.btnLogout) DOM.btnLogout.addEventListener('click', async function () {
    await sendMsg({ action: 'LOGOUT' });
    showView('login');
    generarQR();
  });

  // ─── Cleanup on popup close ────────────────────────────────────

  window.addEventListener('unload', function () {
    stopQrPolling();
    stopRefreshLoop();
  });

  // ─── Start ─────────────────────────────────────────────────────

  init().catch(function (err) {
    console.error('[VIBRRA POPUP] init() failed:', err);
    showView('login');
    showEstado('Error: ' + err.message);
  });
})();
