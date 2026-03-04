# 🎵 VIBRRA Plugin — Pear Desktop

Plugin para [Pear Desktop](https://github.com/pear-devs/pear-desktop) que integra la plataforma **VIBRRA Jukebox** con YouTube Music.

## ¿Qué hace?

| Paso | Proceso | Descripción |
|------|---------|-------------|
| 1 | Login | El host del bar/negocio inicia sesión con sus credenciales de Firebase |
| 2 | QR | Se genera el QR permanente del negocio (`vibrra.live/neg/{uid}`) |
| 3 | Escucha | El plugin hace polling a Firestore cada 8s buscando canciones con mayor puja |
| 4 | Reproducción | Cuando hay ganadora, busca la canción en YouTube Music y la reproduce automáticamente |
| 5 | Notificación | Se muestra un toast en la interfaz de YouTube Music con los datos de la canción |

---

## 📁 Estructura de archivos

```
src/plugins/vibrra/
├── index.ts          # Plugin principal (createPlugin, backend, renderer)
├── firebase.ts       # Firebase REST API: auth + Firestore polling
├── preload.ts        # Bridge seguro: ventana QR ↔ IPC ↔ Backend
├── qr-window.html    # Ventana flotante: login + QR del negocio
├── style.css         # Toast overlay para YouTube Music
└── types.ts          # Tipos TypeScript compartidos
```

---

## 🚀 Instalación

### 1. Copiar archivos

Copia la carpeta `vibrra` en:
```
pear-desktop/src/plugins/vibrra/
```

### 2. Configurar Firebase

En `firebase.ts`, reemplaza los valores de `FIREBASE_CONFIG`:

```typescript
const FIREBASE_CONFIG = {
  apiKey:    'TU_API_KEY_DE_FIREBASE',    // Firebase > Configuración del proyecto > API Key
  projectId: 'TU_PROJECT_ID',             // Firebase > Configuración del proyecto > ID del proyecto
};
```

### 3. Registrar el plugin

En `src/config/defaults.ts` de pear-desktop, añade `'vibrra'` al objeto de plugins:

```typescript
plugins: {
  // ... otros plugins
  vibrra: {
    enabled: true,
    negocioUid: null,
    firebaseToken: null,
  },
}
```

### 4. Compilar y ejecutar

```bash
pnpm dev
```

---

## 🔥 Estructura esperada en Firestore

El plugin lee de la siguiente colección:

```
Negocios/
└── {negocioUid}/
    └── solicitudes/
        └── {solicitudId}
            ├── artista:    string   # "Bad Bunny"
            ├── cancion:    string   # "Tití Me Preguntó"
            ├── monto:      number   # 5000 (COP)
            ├── estado:     string   # "pendiente" | "reproduciendo" | "completada"
            ├── negocioId:  string   # UID del negocio (para filtrar)
            ├── uidUsuario: string   # UID del cliente que pujó
            └── creadoEn:   number   # timestamp Unix
```

**Flujo de estados:**
```
pendiente → reproduciendo (asignado por el plugin) → completada (asignado por tu app Flutter)
```

---

## ⚙️ Reglas de Firestore recomendadas

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /Negocios/{negocioId}/solicitudes/{solicitudId} {
      // El host puede leer y actualizar el estado
      allow read, update: if request.auth != null && request.auth.uid == negocioId;
      // Los clientes pueden crear solicitudes
      allow create: if request.auth != null;
    }
  }
}
```

---

## 🛠️ Personalización

### Cambiar el intervalo de polling

En `index.ts`, la función `startListening` llama a `startPolling` con un intervalo configurable:

```typescript
startPolling(negocioUid, callback, 5_000); // Cada 5 segundos
```

### Ajustar el QR para otro dominio

En `qr-window.html`:
```javascript
const url = `https://tu-dominio.com/neg/${negocioUid}`;
```

---

## 📌 Notas técnicas

- **Sin SDK de Firebase**: El plugin usa la Firebase REST API directamente para evitar conflictos con el bundler de Electron/Vite. No requiere instalar `firebase` como dependencia.
- **Polling vs WebSocket**: Se usa polling HTTP en lugar de `onSnapshot` de Firestore por la misma razón. Para producción con alto volumen, considera migrar a WebSockets con la [Firestore Listen API](https://firebase.google.com/docs/firestore/reference/rest/v1/projects.databases.documents/listen).
- **Token refresh**: El plugin renueva automáticamente el `idToken` de Firebase cuando detecta errores 401 en las peticiones a Firestore.
