/**
 * @file firebase.ts
 * @description Servicio de Firebase para el proceso backend (main process) de Electron.
 * Usa la Firebase REST API directamente para evitar problemas de compatibilidad con ESM/CJS.
 * Maneja autenticación con email/password y escucha la cola de Firestore en tiempo real.
 */

import type { FirebaseAuthResponse, Solicitud } from './types';

// ─── CONFIGURACIÓN ───────────────────────────────────────────────────────────
// ⚠️  Reemplaza estos valores con los de tu proyecto Firebase de VIBRRA

const FIREBASE_CONFIG = {
  apiKey: 'TU_API_KEY_DE_FIREBASE',
  projectId: 'TU_PROJECT_ID',
};

const AUTH_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_CONFIG.apiKey}`;
const REFRESH_URL = `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_CONFIG.apiKey}`;
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;

// ─── ESTADO INTERNO ──────────────────────────────────────────────────────────

/** ID del intervalo de polling de Firestore (si se usa polling en lugar de WS) */
let pollingInterval: NodeJS.Timeout | null = null;

/** Token de acceso activo para las peticiones a Firestore */
let currentIdToken: string | null = null;

/** Refresh token para renovar el idToken cuando expira */
let currentRefreshToken: string | null = null;

// ─── AUTENTICACIÓN ───────────────────────────────────────────────────────────

/**
 * Autentica al host del negocio con email y contraseña.
 * @param email - Correo electrónico del host registrado en Firebase.
 * @param password - Contraseña del host.
 * @returns Objeto con uid, idToken y refreshToken.
 * @throws Error si las credenciales son inválidas.
 */
export async function signIn(
  email: string,
  password: string,
): Promise<{ uid: string; idToken: string; refreshToken: string }> {
  const response = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error?.message ?? 'Error de autenticación');
  }

  const data: FirebaseAuthResponse = await response.json();

  // Guardar tokens en memoria para uso posterior
  currentIdToken = data.idToken;
  currentRefreshToken = data.refreshToken;

  return {
    uid: data.localId,
    idToken: data.idToken,
    refreshToken: data.refreshToken,
  };
}

/**
 * Renueva el idToken usando el refreshToken guardado.
 * Firebase idTokens expiran en 1 hora.
 * @returns Nuevo idToken.
 * @throws Error si el refreshToken es inválido o expiró.
 */
export async function refreshIdToken(): Promise<string> {
  if (!currentRefreshToken) {
    throw new Error('No hay refreshToken disponible. El usuario debe iniciar sesión.');
  }

  const response = await fetch(REFRESH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=refresh_token&refresh_token=${currentRefreshToken}`,
  });

  if (!response.ok) {
    throw new Error('No se pudo renovar el token. Inicia sesión nuevamente.');
  }

  const data = await response.json();
  currentIdToken = data.id_token;
  currentRefreshToken = data.refresh_token;

  return currentIdToken!;
}

/**
 * Restaura una sesión previa usando un refreshToken guardado.
 * @param refreshToken - Token guardado en electron-store de la sesión anterior.
 */
export async function restoreSession(refreshToken: string): Promise<string> {
  currentRefreshToken = refreshToken;
  return await refreshIdToken();
}

// ─── FIRESTORE ───────────────────────────────────────────────────────────────

/**
 * Obtiene el token activo, renovándolo si es necesario.
 * @returns idToken válido.
 */
async function getValidToken(): Promise<string> {
  if (!currentIdToken) {
    if (currentRefreshToken) {
      return await refreshIdToken();
    }
    throw new Error('No autenticado');
  }
  return currentIdToken;
}

/**
 * Convierte un documento de Firestore REST API al tipo Solicitud.
 * @param doc - Documento crudo de la API de Firestore.
 * @returns Objeto Solicitud tipado.
 */
function parseFirestoreDoc(doc: Record<string, unknown>): Solicitud {
  const fields = doc.fields as Record<string, Record<string, unknown>>;
  const name = doc.name as string;

  return {
    id: name.split('/').pop() ?? '',
    artista: (fields.artista?.stringValue as string) ?? '',
    cancion: (fields.cancion?.stringValue as string) ?? '',
    monto: Number(fields.monto?.integerValue ?? fields.monto?.doubleValue ?? 0),
    estado: (fields.estado?.stringValue as Solicitud['estado']) ?? 'pendiente',
    creadoEn: Number(fields.creadoEn?.integerValue ?? 0),
    uidUsuario: (fields.uidUsuario?.stringValue as string) ?? '',
  };
}

/**
 * Consulta las solicitudes con estado 'pendiente' para un negocio.
 * @param negocioUid - UID del negocio autenticado.
 * @returns Array de solicitudes pendientes ordenadas por monto.
 */
export async function fetchSolicitudesPendientes(negocioUid: string): Promise<Solicitud[]> {
  const token = await getValidToken();

  // Usamos el endpoint de consulta estructurada de Firestore
  const url = `${FIRESTORE_BASE}:runQuery`;
  const query = {
    structuredQuery: {
      from: [{ collectionId: 'solicitudes', allDescendants: false }],
      where: {
        compositeFilter: {
          op: 'AND',
          filters: [
            {
              fieldFilter: {
                field: { fieldPath: 'estado' },
                op: 'EQUAL',
                value: { stringValue: 'pendiente' },
              },
            },
            {
              fieldFilter: {
                field: { fieldPath: 'negocioId' },
                op: 'EQUAL',
                value: { stringValue: negocioUid },
              },
            },
          ],
        },
      },
      orderBy: [{ field: { fieldPath: 'monto' }, direction: 'DESCENDING' }],
      limit: 1, // Solo queremos la canción con mayor puja
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(query),
  });

  if (!response.ok) return [];

  const results = await response.json();

  return results
    .filter((r: Record<string, unknown>) => r.document)
    .map((r: Record<string, unknown>) => parseFirestoreDoc(r.document as Record<string, unknown>));
}

/**
 * Actualiza el estado de una solicitud en Firestore.
 * @param negocioUid - UID del negocio.
 * @param solicitudId - ID del documento en Firestore.
 * @param estado - Nuevo estado de la solicitud.
 */
export async function updateSolicitudEstado(
  negocioUid: string,
  solicitudId: string,
  estado: Solicitud['estado'],
): Promise<void> {
  const token = await getValidToken();

  // PATCH con updateMask para actualizar solo el campo estado
  const url = `${FIRESTORE_BASE}/Negocios/${negocioUid}/solicitudes/${solicitudId}?updateMask.fieldPaths=estado`;

  await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      fields: {
        estado: { stringValue: estado },
      },
    }),
  });
}

// ─── POLLING ─────────────────────────────────────────────────────────────────

/**
 * Inicia el polling de Firestore para detectar nuevas canciones pujadas.
 * Consulta cada 8 segundos. Llama al callback cuando encuentra una canción pendiente.
 *
 * @param negocioUid - UID del negocio autenticado.
 * @param onNewSong - Callback ejecutado cuando hay una canción lista para reproducir.
 * @param intervalMs - Intervalo de polling en milisegundos (default: 8000).
 */
export function startPolling(
  negocioUid: string,
  onNewSong: (solicitud: Solicitud) => void,
  intervalMs = 8_000,
): void {
  if (pollingInterval) {
    stopPolling();
  }

  console.log(`[VIBRRA] Iniciando polling cada ${intervalMs}ms para negocio ${negocioUid}`);

  pollingInterval = setInterval(async () => {
    try {
      const solicitudes = await fetchSolicitudesPendientes(negocioUid);

      if (solicitudes.length > 0) {
        const top = solicitudes[0]; // La de mayor puja
        console.log(`[VIBRRA] 🎵 Canción detectada: ${top.artista} - ${top.cancion} ($${top.monto})`);

        // Marcar como "reproduciendo" antes de notificar para evitar duplicados
        await updateSolicitudEstado(negocioUid, top.id, 'reproduciendo');

        // Notificar al plugin para inyección en YouTube Music
        onNewSong(top);
      }
    } catch (err) {
      console.error('[VIBRRA] Error en polling:', err);

      // Si el token expiró, intentar renovar en el próximo ciclo
      if ((err as Error).message?.includes('401') || (err as Error).message?.includes('UNAUTHENTICATED')) {
        currentIdToken = null; // Forzar renovación
      }
    }
  }, intervalMs);
}

/**
 * Detiene el polling de Firestore y limpia recursos.
 */
export function stopPolling(): void {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log('[VIBRRA] Polling detenido.');
  }
}

/**
 * Cierra la sesión y limpia los tokens en memoria.
 */
export function signOut(): void {
  currentIdToken = null;
  currentRefreshToken = null;
  stopPolling();
  console.log('[VIBRRA] Sesión cerrada.');
}
