/**
 * @file types.ts
 * @description Tipos TypeScript para el plugin VIBRRA en Pear Desktop.
 * Define las estructuras de datos usadas en Firebase/Firestore y el flujo del plugin.
 */

/**
 * Configuración persistente del plugin (guardada en electron-store).
 */
export interface VibrraConfig {
  /** ¿Plugin habilitado? */
  enabled: boolean;
  /** UID del negocio autenticado en Firebase (null si no hay sesión) */
  negocioUid: string | null;
  /** Credenciales guardadas para re-autenticación silenciosa */
  firebaseToken: string | null;
}

/**
 * Credenciales de login que el host ingresa en la ventana de QR/login.
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Respuesta del endpoint de autenticación de Firebase REST API.
 */
export interface FirebaseAuthResponse {
  idToken: string;
  localId: string; // UID del usuario
  refreshToken: string;
  email: string;
  expiresIn: string;
}

/**
 * Estructura de una solicitud/canción en Firestore.
 * Colección: Negocios/{negocioUid}/solicitudes/{solicitudId}
 */
export interface Solicitud {
  /** ID del documento en Firestore */
  id: string;
  /** Nombre del artista */
  artista: string;
  /** Título de la canción */
  cancion: string;
  /** Monto total pujado (COP) */
  monto: number;
  /** Estado de la solicitud */
  estado: 'pendiente' | 'reproduciendo' | 'completada' | 'rechazada';
  /** Timestamp de creación */
  creadoEn: number;
  /** UID del usuario que realizó la puja ganadora */
  uidUsuario: string;
}

/**
 * Mensaje IPC enviado del backend al renderer para reproducir una canción.
 */
export interface PlaySongMessage {
  solicitudId: string;
  artista: string;
  cancion: string;
  monto: number;
}

/**
 * Mensaje IPC enviado desde la ventana de login al backend con las credenciales.
 */
export interface LoginMessage {
  type: 'login-credentials';
  email: string;
  password: string;
}

/**
 * Configuración del proyecto Firebase (variables de entorno o hardcoded para el plugin).
 */
export interface FirebaseConfig {
  apiKey: string;
  projectId: string;
  authDomain: string;
}
