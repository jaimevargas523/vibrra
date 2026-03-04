# VIBRRA — Extensión Chrome

Control remoto del jukebox digital VIBRRA para anfitriones.

## Estructura del proyecto

```
vibrra-extension/
├── manifest.json                  ← Manifest V3
├── background/
│   ├── service_worker.js          ← Cerebro: Firebase, cola, lógica central
│   └── firebase_config.js         ← Keys de Firebase DEV/PROD
├── content_scripts/
│   ├── youtube.js                 ← Control del reproductor YouTube
│   ├── spotify.js                 ← Control del reproductor Spotify
│   └── soundcloud.js              ← Control del reproductor SoundCloud
├── popup/
│   ├── popup.html                 ← UI del popup
│   ├── popup.js                   ← Lógica del popup
│   └── popup.css                  ← Estilos (paleta VIBRRA)
├── utils/
│   ├── player_detector.js         ← Detecta qué reproductor está abierto
│   └── queue_manager.js           ← Cola en memoria local
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Flujo de datos

```
RTDB (puja llega)
      ↓
Service Worker (sincroniza cola local)
      ↓
Canción termina → Content Script → Worker
      ↓
Worker toma siguiente de cola
      ↓
Worker → Content Script → Carga canción en reproductor
      ↓
Worker escribe inicio_timestamp en RTDB
      ↓
Todos los clientes Flutter sincronizan timer local
```

## Reproductores soportados

| Reproductor | Detección | Control |
|---|---|---|
| YouTube | youtube.com/watch | IFrame API (movie_player) |
| Spotify | open.spotify.com | DOM observation + navegación |
| SoundCloud | soundcloud.com | Widget API + fallback DOM |

## Configuración inicial

1. Reemplazar los valores en `background/firebase_config.js` con los del proyecto Firebase DEV
2. Agregar iconos PNG en `icons/` (16x16, 48x48, 128x128)
3. Cargar en Chrome: `chrome://extensions` → "Cargar sin empaquetar" → seleccionar esta carpeta

## Pendientes (próximos pasos)

- [ ] Flujo completo de login QR (integrar con la app Flutter)
- [ ] QR flotante sobre el reproductor (`div` con `position: fixed`)
- [ ] Cierre de sesión con escritura de stats en Firestore
- [ ] Módulo de publicidad entre canciones (F5)
- [ ] Iconos reales con la marca VIBRRA
