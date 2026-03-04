/**
 * queue_manager.js
 * 
 * Gestión de la cola de reproducción en memoria local.
 * 
 * La cola NO vive en Firebase durante la sesión — vive aquí.
 * El RTDB es solo el bus de eventos: cuando llega una puja,
 * este manager reordena la cola local y la extensión reproduce
 * sin hacer consultas adicionales a Firebase.
 * 
 * Estructura de un item en cola:
 * {
 *   id:          string   — item_id del nodo RTDB
 *   titulo:      string
 *   artista:     string
 *   duracion_ms: number
 *   fuente:      'youtube' | 'spotify' | 'soundcloud'
 *   fuente_id:   string   — video_id, spotify_uri, o soundcloud_url
 *   puja_mayor:  number
 *   cliente_id:  string
 *   tipo:        'anfitrion' | 'bono' | 'normal'
 *   timestamp:   number
 * }
 */

/** @type {Array<Object>} Cola local ordenada por prioridad */
let _cola = [];

/**
 * Reemplaza la cola completa con el snapshot del RTDB.
 * Se llama cada vez que Firebase notifica un cambio en la cola.
 * 
 * @param {Object} snapshot — Objeto con los items del nodo cola/{estId}
 */
export function sincronizarCola(snapshot) {
  if (!snapshot) {
    _cola = [];
    return;
  }

  // Convertir el objeto de Firebase a array y ordenar por prioridad
  _cola = Object.entries(snapshot)
    .map(([id, data]) => ({ id, ...data }))
    .sort(_comparadorPrioridad);
}

/**
 * Retorna y elimina el primer item de la cola (la siguiente canción).
 * Retorna null si la cola está vacía.
 * 
 * @returns {Object|null}
 */
export function siguienteCancion() {
  if (_cola.length === 0) return null;
  return _cola.shift();
}

/**
 * Retorna el primer item sin eliminarlo (solo para consultar).
 * 
 * @returns {Object|null}
 */
export function verSiguiente() {
  return _cola[0] ?? null;
}

/**
 * Retorna el estado actual de la cola (copia para lectura).
 * 
 * @returns {Array<Object>}
 */
export function obtenerCola() {
  return [..._cola];
}

/**
 * Vacía la cola. Se llama al cerrar sesión.
 */
export function limpiarCola() {
  _cola = [];
}

/**
 * Cantidad de canciones en cola.
 * 
 * @returns {number}
 */
export function longitudCola() {
  return _cola.length;
}

// ─── Lógica de prioridad ─────────────────────────────────────────────────────

/**
 * Comparador de prioridad para ordenar la cola.
 * 
 * Reglas (de mayor a menor prioridad):
 * 1. tipo 'normal' o 'bono' con puja > 0 → mayor puja sube primero
 * 2. tipo 'bono' con puja 0 → supera al anfitrión por timestamp
 * 3. tipo 'anfitrion' → siempre al fondo, ordenado por timestamp
 * 
 * @param {Object} a
 * @param {Object} b
 * @returns {number}
 */
function _comparadorPrioridad(a, b) {
  // Anfitrión siempre va al fondo
  if (a.tipo === 'anfitrion' && b.tipo !== 'anfitrion') return 1;
  if (b.tipo === 'anfitrion' && a.tipo !== 'anfitrion') return -1;

  // Si ambos son anfitrión, ordenar por timestamp (FIFO)
  if (a.tipo === 'anfitrion' && b.tipo === 'anfitrion') {
    return a.timestamp - b.timestamp;
  }

  // Entre clientes/bonos: mayor puja primero
  if (b.puja_mayor !== a.puja_mayor) {
    return b.puja_mayor - a.puja_mayor;
  }

  // Empate en puja: quien pujó primero (timestamp más antiguo) gana
  return a.timestamp - b.timestamp;
}
