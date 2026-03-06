# CLAUDE.md

Este archivo guía a Claude Code (claude.ai/code) al trabajar con el código de este repositorio.

## Descripción del Proyecto

VIBRRA es una plataforma de jukebox digital. Este es un monorepo con pnpm gestionado con Turborepo.

## Apps y Paquetes

| Paquete | Stack | Puerto | Descripción |
|---------|-------|--------|-------------|
| `apps/web` | Next.js 16 + next-intl + Tailwind v4 | 3000 | Landing pública y shortlinks `/s/` |
| `apps/dashboard` | Vite + React 19 + React Router 7 + Tailwind v4 | 5173 | Panel de administración para anfitriones |
| `apps/api` | Express 5 + TypeScript (Node 22) | 4000 | API REST + Socket.IO |
| `apps/extension` | Chrome Extension (Manifest V3) | — | Control remoto del jukebox |
| `apps/mobile` | React Native (Expo) | — | App móvil |
| `packages/shared` | TypeScript | — | Config Firebase, tipos compartidos (PaisConfig, etc.) |

Proyecto Firebase: `vibrra-6cd01`

## Comandos

```bash
pnpm install          # Instalar todas las dependencias
pnpm dev              # Ejecutar todas las apps en paralelo (turbo)
pnpm build            # Compilar todas las apps
pnpm lint             # Lint en todas las apps (tsc --noEmit)

# Apps individuales
cd apps/api && pnpm dev         # tsx watch src/index.ts
cd apps/dashboard && pnpm dev   # vite
cd apps/web && pnpm dev         # next dev
```

No hay test runner configurado actualmente.

## Arquitectura

### Ruteo Web → Dashboard

`next.config.ts` reescribe `/login`, `/anfitrion/**` y `/assets/**` hacia la app del dashboard. En dev hace proxy a `localhost:5173`, en prod a `vibrra-6cd01.web.app`.

### Dashboard

- **Ruteo:** React Router con rutas protegidas por `AuthGuard` bajo `/anfitrion/*`
- **Estado:** Stores de Zustand (`auth.store.ts`, `session.store.ts`, `establishment.store.ts`, `ui.store.ts`)
- **Obtención de datos:** TanStack React Query (staleTime: 2min, retry: 1, sin refetchOnWindowFocus)
- **Cliente API:** `lib/api-client.ts` — wrapper de fetch que inyecta tokens Bearer de Firebase Auth, con helpers `apiGet/apiPost/apiPut/apiPatch/apiDelete`
- **Alias de rutas:** `@/*` → `./src/*`
- **Proxy en dev:** `/api` → `http://localhost:4000` (en vite.config.ts)

### API

- **Middleware de auth:** Verifica tokens de Firebase ID vía Admin SDK. Acepta `dev-mock-token` en dev. Establece `req.uid`.
- **Validación de env:** Esquema Zod en `src/config/env.ts` para `PORT`, `FIREBASE_SERVICE_ACCOUNT`, `FIREBASE_DATABASE_URL`
- **Tiempo real:** Socket.IO en namespace `/sesion`
- **Despliegue:** Firebase Functions (desde `apps/api`) + Docker (Node 22 Alpine multi-stage)
- **CORS:** Permite `localhost:5173`, `localhost:3000`, `vibrra.live`, `vibrra-6cd01.web.app`

### Paquete Shared

Exporta instancias de Firebase client (`db`, `rtdb`, `auth`, `storage`) y tipos TypeScript compartidos. El tipo `PaisConfig` modela la configuración por país (moneda, fiscal, suscripciones, modos de recarga) almacenada en Firestore `Paises/{code}`.

### Extensión

Extensión de Chrome con Manifest V3. El service worker sincroniza con Firebase RTDB para gestión de cola en tiempo real. Los content scripts controlan reproductores de YouTube, Spotify y SoundCloud.

## i18n

Todo texto en la UI debe usar i18n — nunca hardcodear strings.

- **Dashboard:** i18next con archivos JSON por namespace en `src/i18n/locales/{es,en,pt}/`. Usar `useTranslation("namespace")`.
- **Web:** next-intl con mensajes en `messages/{es,en,pt}.json`. Segmento de ruta dinámico `[locale]`.
- **Idiomas:** es, en, pt

## Tokens de Diseño (Dashboard)

Definidos en `apps/dashboard/src/index.css` como custom properties CSS consumidas por Tailwind v4:

- Dorado marca: `--color-gold: #D4A017`, `--color-gold-light: #FFE566`
- Fondo: `--color-bg: #0A0A0A`, `--color-surface: #1A1A1A`
- Acentos: `--color-green: #00D9A3`, `--color-error: #EF4444`
- Iconos: lucide-react en todo el dashboard

## Formularios

Todos los formularios deben soportar Enter para avanzar al siguiente campo, y Enter en el último campo envía el formulario.

## Logo

Siempre usar `/vibrra-logo.svg` (disponible en `apps/dashboard/public/` y `apps/web/public/`) — nunca usar placeholders de texto ni iconos de letras.

## Despliegue Firebase

```
firebase.json:
  - Hosting: apps/dashboard/dist → SPA con /api/** → Cloud Function "api"
  - Functions: functions/ (legacy) + apps/api (codebase: "api")
  - AppHosting: apps/web (backendId: vibrra-web)
  - Firestore: firestore.rules, firestore.indexes.json
  - RTDB: database.rules.json
```

## Variables de Entorno

**apps/api** (`.dev.env`): `PORT`, `FIREBASE_SERVICE_ACCOUNT` (string JSON), `FIREBASE_DATABASE_URL`

**apps/dashboard** (`.env`): claves `VITE_FIREBASE_*`, `VITE_API_URL`

**apps/web** (`.env.local`): config cliente Firebase
