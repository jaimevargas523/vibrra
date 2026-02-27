# VIBRRA — Documento Maestro de Arquitectura
> Versión: 3.0 · Fecha: Febrero 2026  
> Usar este documento al inicio de cada sesión de desarrollo para mantener contexto completo.

---

## ¿Qué es VIBRRA?

Plataforma de jukebox digital para bares y discotecas. Los clientes del negocio escanean un **QR** en su mesa, buscan canciones y **pujan** para subir su canción al tope de la cola. La canción con mayor puja suena primero. El anfitrión recauda las pujas.

**URL del negocio:** `vibrra.live/neg/{uid}` — el QR siempre apunta a esta URL permanente.

---

## Modelo de usuarios

| Colección Firestore | Quién es | Cómo accede |
|---|---|---|
| `Anonimos` | Cliente del bar sin cuenta | Escanea QR, sin registro |
| `Clientes` | Anónimo que se registró — tiene beneficios | App Flutter / web |
| `Anfitriones` | Dueño de establecimientos — puede tener varios | App Flutter |
| `Establecimientos` | Local físico — movimientos y saldo propios | Gestionado por Anfitrión |
| `Usuarios` | Equipo interno VIBRRA (superadmin) | App Flutter (sección oculta) |
| `Empresarios` | Paga publicidad — **en construcción** | App Flutter |

**Reglas de Firestore:**
- Todas las colecciones inician con **letra mayúscula**
- Los campos internos van en **minúscula con guion bajo**
- Un `Anfitrion` puede tener **N Establecimientos**
- Cada `Establecimiento` tiene el campo `anfitrion_id` → referencia a `Anfitriones/{id}`

---

## Modelo de saldos y bonificaciones

### Anfitrión
- **Bono de bienvenida:** $30.000 COP — no reclamables, solo consumibles
- **Uso del bono:** recargar clientes o cubrir pujas propias
- **Canciones propias:** puja = `0`, ilimitadas, sin costo
- **Costo mensual:** gratis el primer mes → $15.000/mes desde el mes 2

### Anónimo
- **Identificación:** device ID persistente — siempre identificado aunque no se registre
- **Precio conexión:** paga `precio_conexion` al entrar al establecimiento
  - Excepción: si tiene bono de conexión activo → gratis
  - Excepción: si el anfitrión define `precio_conexion = 0` → gratis
- **Canciones:** puja inicial = `precio_por_cancion` del establecimiento
- **Sin tope de puja máxima**

### Cliente (anónimo que se registra)
- **Bono de bienvenida:** 2 canciones gratis (puja = `0`) + $2.000 para conexión
- **Canciones de bono:** puja inicial = `0`
- **Canciones normales:** puja inicial = `precio_por_cancion` del establecimiento
- **Beneficios permanentes definidos globalmente por VIBRRA:**
  - 2 conexiones gratis por mes a cualquier establecimiento VIBRRA
  - 3 canciones gratis por mes (recurrentes, no acumulables)
  - Historial global de canciones pedidas en todos los bares
  - Favoritos globales para pedir en 1 tap
  - Insignia "Cliente VIBRRA" visible en la cola del establecimiento
  - Notificaciones push cuando abre un establecimiento visitado
  - Bonos en recargas: recarga $10.000 → recibe $12.000
  - 15% extra en la primera recarga de cada mes

### Empresario
- **Saldo propio** para pagar campañas publicitarias dentro de VIBRRA
- Módulo **en construcción** — ver sección de estado del desarrollo

---

## Precios del establecimiento

Los define el anfitrión. Persisten hasta que los cambie. Viven en `Establecimientos/{id}`.

```
precio_conexion       → cobro al entrar a la sesión (0 = gratis para todos)
precio_minimo_puja    → mínimo para pujar sobre canción existente
precio_por_cancion    → puja inicial al agregar canción nueva
```

**Lógica de cobro de conexión:**
```
¿Usuario tiene bono de conexión activo?  → gratis
¿precio_conexion del establecimiento == 0? → gratis
Cualquier otro caso                      → cobra precio_conexion
```

**Lógica de prioridad en cola:**
```
Anfitrión            → puja 0  (siempre al fondo)
Cliente con bono     → puja 0  (supera al anfitrión por timestamp)
Cliente/Anónimo      → puja = precio_por_cancion (supera al anfitrión automáticamente)
Cualquiera           → puede pujar más sobre cualquier canción para subir posición
```

---

## Historial y favoritos del cliente

- **Scope:** global — registra canciones de todos los establecimientos VIBRRA
- **Historial guarda:** título, artista, youtube_video_id, establecimiento, fecha, monto pujado
- **Favoritos guarda:** título, artista, youtube_video_id (sin datos del establecimiento)
- Desde favoritos el cliente puede agregar directamente a la cola del establecimiento actual

---

## Búsqueda de canciones

**Método:** YouTube Search API integrada en VIBRRA

- Sin salir de la app — fricción mínima en contexto de bar
- Filtra resultados (karaoke, covers, versiones incorrectas)
- Duración disponible antes de agregar (necesaria para el timer local)
- **Fallback:** botón "Pegar enlace de YouTube" para usuarios avanzados
- **Costo:** 10.000 unidades/día gratis (100 por búsqueda = 100 búsquedas gratis/día). Extra: ~$5 por cada 1.000 búsquedas adicionales.

---

## Partes del sistema y tecnología

### 1. App Flutter (móvil + web)
**Stack:** Flutter/Dart · Bloc + Clean Architecture · Firebase  
**Usuarios:** Anónimos, Clientes, Anfitriones, Usuarios VIBRRA, Empresarios

**Responsabilidades:**
- Escanear QR, conectarse a sesión, pagar conexión o aplicar bono
- Buscar canciones vía YouTube Search API
- Realizar pujas con transacción atómica en Realtime DB
- Calcular progreso de canción **localmente** con timer (cero ops Firebase)
- Notificar cuando su canción sube al #1
- Registrar presencia (`onDisconnect()` limpia automáticamente)
- Escribir cada puja en Firestore (dato económico)
- Pantalla de login QR para vincular extensión Chrome (Anfitrión)
- Gestión de saldo, recargas, retiros
- Panel superadmin (guard por `rol == "superadmin"`)
- Panel empresario (campañas de publicidad)

---

### 2. Extensión Chrome
**Stack:** JavaScript · Manifest V3  
**Componentes:** Background Service Worker + Content Script (YouTube) + Popup

**Responsabilidades:**
- Login vía QR escaneado desde la app Flutter (como WhatsApp Web)
- Mantener cola en **memoria local** — NO en Firebase
- Escuchar pujas en Realtime DB → reordenar cola en memoria
- Controlar YouTube: reproducir, pausar, detectar fin de canción
- Al cambiar canción: escribir `inicio_timestamp` en Realtime DB (una escritura)
- **QR flotante** sobre youtube.com: `div` con `position: fixed` — legal, solo modifica DOM local del navegador del anfitrión, no interfiere con anuncios ni YouTube API
- Selector de establecimiento si el anfitrión tiene varios
- Al terminar sesión: escribir resumen económico en Firestore y limpiar RTDB

---

### 3. Firebase Realtime Database
**Propósito:** Bus de eventos — datos **volátiles**  
**Latencia:** ~100ms · **Costo:** por GB transferido

```
sesiones/{establecimiento_id}/
  estado/
    activa: boolean
    cancion_actual/
      titulo, artista, duracion_ms
      inicio_timestamp          ← clientes calculan progreso localmente
      youtube_video_id
  cola/{item_id}/
    titulo, artista, duracion_ms, youtube_video_id
    puja_mayor, cliente_id
    tipo: "anfitrion" | "bono" | "normal"
    timestamp
  presencia/{usuario_id}/
    conectado, ultimo_ping

sesiones_qr/{token}/
  custom_token, uid_anfitrion
  establecimientos: array
  expira, usado
```

Al terminar la sesión: `remove(ref(db, 'sesiones/{estId}'))` — no persiste nada.

---

### 4. Firestore
**Propósito:** Datos **económicos y persistentes** únicamente

```
Anfitriones/{uid}

  ── Identidad y perfil ──
  nombre:                string
  email:                 string
  telefono:              string
  activo:                boolean
  fecha_registro:        timestamp
  cuenta_bancaria: {
    banco, tipo_cuenta, numero, titular
  }

  ── Tributario ──
  rut:                   string
  tipo_persona:          string        ← "natural" | "juridica"
  razon_social:          string
  es_declarante_renta:   boolean
  regimen_tributario:    string        ← "simple" | "ordinario"
  tarifa_retencion:      number        ← 3.5 | 4.0 | 6.0 (calculada automáticamente)
  municipio_fiscal:      string
  responsable_iva:       boolean

  ── Saldo consolidado (suma de todos sus establecimientos) ──
  saldo_disponible:      number        ← sum(establecimientos.generado_pendiente) — campo calculado
  ultimo_retiro_fecha:   timestamp     ← última transferencia procesada
  retiro_este_mes:       boolean       ← true si ya solicitó retiro en el mes en curso
  total_retirado_historico: number     ← acumulado total transferido al anfitrión

  ↳ Movimientos/{id}              ← extracto unificado de TODOS los establecimientos
      tipo, concepto, monto_bruto, monto_neto
      establecimiento_id           ← a qué local corresponde este movimiento
      referencia, sesion_id, timestamp, detalle{}

  ↳ AuditLog/{id}                 ← historial de TODOS los cambios realizados en la cuenta
      tipo_cambio:    string       ← "datos_personales" | "datos_establecimiento" |
                                     "doc_legal" | "retiro" | "precio" | "estado_cuenta"
      establecimiento_id: string  ← si aplica (null para cambios personales)
      campo:          string       ← nombre del campo modificado
      valor_anterior: any          ← valor antes del cambio
      valor_nuevo:    any          ← valor después del cambio
      realizado_por:  string       ← uid del anfitrión o uid del superadmin
      rol_autor:      string       ← "anfitrion" | "superadmin"
      timestamp:      timestamp
      ip:             string       ← IP desde donde se hizo el cambio (opcional)
      motivo:         string       ← descripción libre (requerida para cambios hechos por superadmin)

Establecimientos/{id}

  ── Identidad ──
  nombre:                string
  ciudad:                string
  barrio:                string
  direccion:             string          ← dirección física del local
  telefono:              string          ← contacto del local
  anfitrion_id:          string          ← ref → Anfitriones/{uid}
  activo:                boolean
  fecha_registro:        timestamp
  fecha_cambio_estado:   timestamp
  qr_imagen_url:         string          ← URL en Firebase Storage (PNG para imprimir)

  ── Precios (configurables por el anfitrión) ──
  precio_conexion:       number          ← 0 = gratis para todos
  precio_minimo_puja:    number          ← mínimo para pujar sobre canción existente
  precio_por_cancion:    number          ← puja inicial al agregar canción nueva
  precio_dedicatoria:    number          ← mensaje visible en pantalla al sonar canción

  ── Economía (por establecimiento — para analytics y rendimiento por local) ──
  total_generado_historico: number  ← acumulado histórico 70% del anfitrión en este local
  total_generado_mes:       number  ← acumulado del mes en curso
  generado_mes_fecha:       timestamp ← inicio del período mensual actual
  generado_pendiente:       number  ← lo generado en este local aún no incluido en un retiro
                                       suma con otros establecimientos = Anfitriones.saldo_disponible
  pujas_mes:                number  ← número de pujas del mes (para stats)
  pujas_mes_fecha:          timestamp

  ── Suscripción VIBRRA ──
  suscripcion_estado:           string    ← "trial" | "activa" | "suspendida" | "cancelada"
  suscripcion_inicio:           timestamp ← fecha en que inició (trial o pago)
  suscripcion_proximo_cobro:    timestamp ← próxima fecha de cobro mensual
  suscripcion_meses_pagados:    number    ← contador histórico de meses pagados

  ── Documentación legal (Art. 87 Ley 1801/2016) ──
  ── Documentos permanentes ──
  doc_rut_nit:                  string    ← NIT del establecimiento ante la DIAN
  doc_uso_suelo_estado:         string    ← "vigente" | "pendiente" | "no_aplica"
  doc_licencia_funcionamiento:  string    ← "vigente" | "pendiente" | "vencida"

  ── Documentos de renovación anual ──
  doc_matricula_mercantil_vigente:    boolean   ← renovar antes del 31 de marzo c/año
  doc_matricula_mercantil_vence:      timestamp
  doc_bomberos_vigente:               boolean   ← Concepto Técnico Bomberos — vigencia 1 año
  doc_bomberos_vence:                 timestamp
  doc_sanitario_vigente:              boolean   ← Concepto Sanitario Secretaría Salud — 1 año
  doc_sanitario_vence:                timestamp
  doc_sayco_acinpro_vigente:          boolean   ← CRÍTICO: sin este no se puede activar sesión
  doc_sayco_acinpro_vence:            timestamp ← pago anual a OSA (Ley 23/1982 Art. 158-159)
  doc_licor_vigente:                  boolean   ← Permiso expendio bebidas alcohólicas — 1 año
  doc_licor_vence:                    timestamp
  doc_horario_extendido:              boolean   ← ¿tiene permiso municipal de horario extendido?
  doc_horario_maxima:                 string    ← "02:00" | "03:00" según municipio

  ── Estado de cumplimiento (calculado) ──
  docs_estado_general:          string    ← "completo" | "advertencia" | "critico"
  docs_ultima_verificacion:     timestamp ← última vez que el anfitrión actualizó sus docs

  ── Mapa y visibilidad ──
  lat:                   number
  lng:                   number
  sesion_activa:         boolean         ← actualizado por la extensión Chrome al abrir/cerrar
  visible_en_mapa:       boolean         ← el anfitrión puede ocultarse del mapa público

Sesiones/{id}
  establecimiento_id, total_recaudado
  canciones_reproducidas, pico_usuarios, duracion_min, fecha

Pujas/{id}
  cliente_id, establecimiento_id
  cancion, youtube_video_id, monto, timestamp

Clientes/{uid}
  nombre, email, saldo
  conexiones_gratis_restantes: number     ← reset mensual por VIBRRA
  canciones_gratis_restantes: number      ← reset mensual (3/mes)
  fecha_registro

Historial/{uid}/canciones/{id}
  titulo, artista, youtube_video_id
  establecimiento_id, establecimiento_nombre
  fecha, monto_pujado

Favoritos/{uid}/canciones/{id}
  titulo, artista, youtube_video_id

Anonimos/{id}
  device_id, sesion_id, establecimiento_id, timestamp

Usuarios/{uid}
  nombre, email, rol: "superadmin", activo, fecha_creacion

Empresarios/{uid}
  nombre, email, saldo, activo
  razon_social, nit, fecha_registro
  campanas_activas: number
```

**Regla de retiros:** primeros 10 días del mes · 1 retiro por mes · fuera de ese período: botón deshabilitado con countdown.

**Beneficios del cliente:** definidos globalmente por VIBRRA. Un job mensual resetea `conexiones_gratis_restantes = 2` y `canciones_gratis_restantes = 3` para todos los Clientes.

---

### 5. Firebase Functions

```javascript
// Genera customToken para autenticar la extensión Chrome
exports.generateExtensionToken = onCall(async (request) => {
  const { uid, establecimientos } = request.data;
  const customToken = await admin.auth().createCustomToken(uid);
  await db.ref(`sesiones_qr/${tokenQR}`).set({
    custom_token: customToken,
    uid_anfitrion: uid,
    establecimientos,
    expira: Date.now() + 120_000,
    usado: false,
  });
});

// Job mensual: resetear beneficios de todos los Clientes
exports.resetBeneficiosMensuales = onSchedule('0 0 1 * *', async () => {
  // Actualiza conexiones_gratis_restantes = 2
  // Actualiza canciones_gratis_restantes = 3
});

// ── Resiliencia: detector de sesiones inactivas ─────────────────────────

// Corre cada hora. Si una sesión lleva 3h sin cambiar canción → escribe
// los stats acumulados en RTDB a Firestore y limpia el nodo.
// Costo: 24 invocaciones/día — mínimo. No usa heartbeat.
exports.detectarSesionesInactivas = onSchedule('0 * * * *', async () => {
  const snapshot = await rtdb.ref('sesiones').get();
  const ahora = Date.now();
  const TRES_HORAS = 3 * 60 * 60 * 1000;
  const promesas = [];

  snapshot.forEach((estSnap) => {
    const estado = estSnap.val()?.estado;
    if (!estado?.activa) return;

    const inactivo = ahora - (estado.ultima_actividad || 0);
    if (inactivo > TRES_HORAS) {
      // Misma lógica que cerrarSesion pero con cierre_tipo = 'inactividad'
      promesas.push(cerrarSesionDesdeRTDB(estSnap.key, estSnap.val(), 'inactividad'));
    }
  });

  await Promise.all(promesas);
});
```

---

### 6. Panel Superadmin
**Dentro de:** App Flutter · Guard: `rol == "superadmin"` en `Usuarios`  
**Archivos generados:** `vibrra_admin_module.zip`

Funcionalidades: lista de establecimientos, activar/desactivar, retiros pendientes, métricas globales.

```bash
dart run scripts/create_superadmin.dart
```

---

### 7. Módulo Empresarios
**Estado:** en construcción  
**Dentro de:** App Flutter (sección propia para Empresarios)

**Funcionalidades planificadas:**
- Registro de empresa (nombre, NIT, razón social)
- Carga de saldo para campañas
- Crear campaña: imagen/video + establecimientos objetivo + presupuesto + duración
- Ver métricas de campaña: impresiones, establecimientos activos
- Panel superadmin VIBRRA: aprobar/rechazar campañas, ver facturación

**Cómo se muestra la publicidad:**
- Durante la sesión del bar, entre canciones o en la UI de la cola
- La extensión Chrome puede mostrar el anuncio en pantalla entre canciones
- Los clientes en la app ven el anuncio en la cola mientras esperan

---

## Flujo de autenticación de la Extensión (Login QR)

```
1. Anfitrión abre extensión → QR temporal (válido 2 min)
2. Escanea desde app Flutter
3. App llama Firebase Function: generateExtensionToken(uid, establecimientos)
4. Function escribe { customToken, uid, establecimientos } en RTDB sesiones_qr/{token}
5. Extensión detecta el cambio → signInWithCustomToken(customToken)
6. Extensión guarda en chrome.storage.local:
   { refreshToken, uid, establecimientos, expira: now + 30días }
7. Si tiene varios establecimientos → selector
8. Lista para iniciar sesión de jukebox
```

---

## Flujos de datos durante una sesión

### Cliente entra al establecimiento
```
1. Escanea QR → vibrra.live/neg/{establecimiento_id}
2. App verifica: ¿tiene bono de conexión? ¿precio_conexion == 0?
3. Si debe pagar → descuenta de saldo del cliente
4. Registra presencia en RTDB presencia/{uid}
5. Suscribe a sesiones/{estId}/estado y cola en Realtime DB
6. Recibe inicio_timestamp → inicia timer local de progreso
```

### Cliente puja
```
1. runTransaction() en RTDB cola/{itemId}        [atómico — orden de reproducción]
2. Si ganó → escribe en Firestore Pujas/{id}     [economía — inmediato]
             escribe Anfitriones/Movimientos/{id} [extracto — inmediato]
             increment generado_pendiente + total_generado_mes (Establecimiento)
             increment saldo_disponible (Anfitriones/{uid}) [saldo consolidado — inmediato]
3. RTDB notifica a Extensión (~100ms)
4. Extensión reordena cola en memoria → escribe en RTDB
5. RTDB notifica a todos los clientes
6. Si posición == 0 → notificación "tu canción es la siguiente"
```
> Todo lo económico (dinero, saldos, movimientos) se escribe en Firestore de forma
> inmediata con cada puja. Esto nunca estuvo en duda.
> Lo que vive en RTDB son los datos operativos de la sesión: cola, presencia,
> estadísticas acumuladas. Estos se pasan a Firestore al cerrar sesión.

### Canción cambia
```
1. YouTube ENDED → Content Script → chrome.runtime.sendMessage
2. Extensión toma siguiente de cola local (sin Firebase)
3. player.loadVideoById(siguiente.youtube_video_id)
4. Extensión escribe en RTDB estado/cancion_actual { inicio_timestamp, duracion_ms, ... }
5. Todos los clientes reinician timer local
```

### Progreso de canción
```
NUNCA toca Firebase.
progreso = (now - inicio_timestamp) / duracion_ms  → cada 500ms, local
200 usuarios × toda la noche = 0 operaciones Firebase
```

### Fin de sesión — cierre manual (normal)
```
1. Anfitrión cierra sesión desde extensión Chrome
2. Extensión llama cerrarSesion(estId)
3. Function toma datos acumulados del RTDB sesiones/{estId}
4. Batch a Firestore:
     Sesiones/{id}                  [resumen de la noche]
     Stats_Establecimientos/{id}    [métricas del local]
     Stats_Canciones/{vid}          [ranking global]
     Stats_Horarios/{id}            [distribución por hora]
5. remove(ref(db, 'sesiones/{estId}'))      [limpia RTDB]
6. Establecimientos/{id}.update({ sesion_activa: false })
7. Clientes detectan nodo eliminado → "Sesión finalizada"
```

### Fin de sesión — inactividad detectada (anfitrión apagó el PC sin cerrar)
El problema: los datos estadísticos viven en RTDB durante la sesión. Si el anfitrión
nunca llama cerrarSesion(), esa sesión desaparece del historial analítico.

Solución: detector de inactividad basado en cambios de canción.

```
Durante la sesión: cada vez que cambia cancion_actual →
  RTDB sesiones/{estId}/estado/ultima_actividad = serverTimestamp()
  [1 write extra por cambio de canción — insignificante]

Function detectarSesionesInactivas — corre cada hora:
  Para cada sesión con activa == true:
    inactivo = ahora - ultima_actividad
    Si inactivo > 3 horas:
      → tomar datos acumulados del RTDB
      → escribir a Firestore (misma lógica de cerrarSesion)
      → marcar Sesiones/{id}.cierre_tipo = "inactividad"
      → remove(ref(db, 'sesiones/{estId}'))
      → Establecimientos/{id}.update({ sesion_activa: false })
```

¿Por qué `ultima_actividad` en lugar de heartbeat?
- Heartbeat: 1 write cada 30s × sesión de 4h = 480 writes RTDB
- ultima_actividad: 1 write por cambio de canción = ~40 writes RTDB por noche
- El cambio de canción es el evento más representativo de "sesión viva"
- Si llevan 3h sin cambiar canción, el bar cerró o se fue la luz hace rato

---

## Arquitectura de datos

| Dato | Realtime DB | Firestore | Local |
|---|---|---|---|
| Cola de reproducción | ✅ orden | ❌ | ✅ lógica extensión |
| Canción actual + timestamp | ✅ | ❌ | ❌ |
| Progreso de canción | ❌ | ❌ | ✅ timer cliente |
| Presencia de usuarios | ✅ | ❌ | ❌ |
| ultima_actividad (cambio canción) | ✅ 1 write/canción | ❌ | ❌ |
| Stats acumuladas de sesión | ✅ durante sesión | ✅ al cerrar/inactividad | ❌ |
| Pujas realizadas | ✅ transacción | ✅ inmediato | ❌ |
| Movimientos del anfitrión | ❌ | ✅ inmediato | ❌ |
| retiro_pendiente | ❌ | ✅ inmediato | ❌ |
| Saldo / recargas / retiros | ❌ | ✅ | ❌ |
| Precios del establecimiento | ❌ | ✅ | ❌ |
| Historial y favoritos cliente | ❌ | ✅ | ❌ |
| Beneficios mensuales cliente | ❌ | ✅ | ❌ |
| Resumen de sesión (stats) | ❌ | ✅ al cerrar o 3h inactivo | ❌ |
| Campañas empresarios | ❌ | ✅ | ❌ |
| Sesión QR autenticación | ✅ temporal | ❌ | ✅ chrome.storage |

---

## Estimación de costos

**Regla general:** todo lo económico (pujas, saldos, movimientos) es escritura inmediata
en Firestore — su costo ya está contemplado en la arquitectura base.

El único costo adicional es la Function `detectarSesionesInactivas` para resguardar
los datos estadísticos cuando el anfitrión nunca cierra sesión.

| Escenario | Writes Firestore/mes | Function invoc./mes | Costo total est. |
|---|---|---|---|
| Piloto — 10 est | ~27.000 | 720 (24/día) | **$0.00** — free tier |
| Crecimiento — 50 est | ~290.000 | 720 | **$0.00** — free tier |
| Escala — 200 est | ~1.908.000 | 720 | **~$2.35 USD/mes** |

**Costos adicionales de la solución de inactividad:**
- `detectarSesionesInactivas`: 24 invocaciones/día = 720/mes — el free tier cubre 2.000.000
- `ultima_actividad` write en RTDB: 1 write por cambio de canción (~40/noche/bar)  
  vs heartbeat cada 30s (~480/noche/bar) — **12x menos writes RTDB**
- Costo adicional neto: **$0.00** en todos los escenarios relevantes

**Separación clara de responsabilidades:**
```
Economía (dinero)   → Firestore inmediato, siempre. Sin excepción.
Stats / historial   → RTDB durante sesión → Firestore al cerrar o tras 3h inactivo
Cola / presencia    → RTDB durante sesión → se destruye al cerrar (no persiste)
```

---


---

---

---

---

## Tratamiento tributario de bonos y descuentos

> Basado en conceptos DIAN: Oficio 906484/2021, Oficio 016302/2019, Art. 107 y 107-1 E.T., Art. 454 E.T., parágrafo 3° Art. 28 E.T.

---

### Principio general

Los bonos y descuentos de VIBRRA tienen dos efectos tributarios favorables:
1. **No generan IVA** en el momento de otorgarse — solo al redimirse si el servicio está gravado
2. **Son gasto deducible** de renta para VIBRRA — reducen la base del 35% de impuesto

Están diseñados como herramienta comercial pero actúan simultáneamente como **escudo fiscal legítimo** mientras estén documentados y sean proporcionales al negocio.

---

### Tabla de tratamiento por tipo de bono

| Tipo de bono | IVA para VIBRRA | Renta VIBRRA | Para quien lo recibe |
|---|---|---|---|
| Canciones/conexiones gratis mensuales (fidelización) | No al otorgar · Sí al redimir si aplica | Gasto deducible Art. 107 E.T. | No es ingreso — menor valor del costo |
| Bono bienvenida cliente ($2.000 + 2 canciones) | No al otorgar | Gasto deducible — límite 1% ingresos netos Art. 107-1 | No es ingreso para el cliente |
| Bono bienvenida anfitrión ($30.000 no reclamable) | No — no es venta ni servicio | Gasto diferido, se deduce al consumirse | No es ingreso — es crédito consumible |
| Bono recarga ($10K → $12K / 15% primer mes) | IVA sobre $10.000 completos (descuento condicionado) | $2.000 extra es gasto deducible | No es ingreso — es descuento en compra |
| Canciones propias del anfitrión (puja = 0) | Sin base gravable (precio cero) | Sin impacto tributario | Sin impacto |
| Canción gratis por responder encuesta | No al otorgar | Gasto de marketing deducible Art. 107 | No es ingreso — es incentivo |

---

### Análisis por tipo

#### Programas de fidelización — canciones y conexiones gratis mensuales
Clasificación DIAN (parágrafo 3° Art. 28 E.T.): **incentivo sujeto a condición futura** — descuento o crédito condicionado.

- Al otorgarse: no hay venta ni servicio — no se factura, no se causa IVA
- Al redimirse: se materializa la prestación — si el servicio base tiene IVA, se causa en ese momento
- Para el cliente: **no es ingreso** en su declaración de renta — es menor valor del costo
- Para VIBRRA: **gasto deducible** de renta, registrado al momento del consumo

#### Bono de bienvenida cliente y anfitrión
Clasificación DIAN (Oficio 906484/2021): **bono regalo** — no es venta de bien ni prestación de servicio al otorgarse.

- No genera obligación de facturar al momento de entrega
- La factura se emite cuando el beneficiario redime el bono (usa la canción / conexión gratis)
- Para VIBRRA: **gasto deducible** con límite del **1% de los ingresos fiscales netos** para atenciones y regalos a clientes (Art. 107-1 E.T.)

```
Ejemplo límite deducible:
  Ingresos brutos VIBRRA en el año         $50.000.000
  - Devoluciones y descuentos                       $0
  - Ingresos no constitutivos de renta              $0
  = Ingresos netos                         $50.000.000
  
  Límite deducible bonos bienvenida (1%)      $500.000
  
  Si VIBRRA da bonos por $800.000 → solo deduce $500.000
```

> Este límite aplica cuando VIBRRA escale. Al inicio con pocos anfitriones y clientes,
> el total de bonos entregados estará muy por debajo del 1%.

#### Bono no reclamable del anfitrión ($30.000)
Estructura tributariamente inteligente: al ser **no convertible en efectivo**, no es pasivo exigible ni ingreso gravable para el anfitrión.

- Para VIBRRA: **gasto diferido** — se reconoce contablemente al momento del consumo, no al otorgarse
- Reduce la comisión del 30% que VIBRRA cobra en las transacciones pagadas con ese bono
- Si el bono expira sin usarse → VIBRRA revierte el gasto diferido como ingreso

#### Bono de recarga ($10K → $12K)
Clasificación DIAN (Art. 454 E.T., Oficio 20067/2019): **descuento condicionado** — depende de que el cliente haga la recarga.

- Los descuentos condicionados **no se restan de la base gravable del IVA**
- El IVA se causa sobre $10.000 completos (el monto pagado), no sobre $8.000
- Los $2.000 adicionales acreditados son **gasto de promoción deducible** para VIBRRA
- Para el cliente: no es ingreso — es un menor valor de su compra

```
Recarga de $10.000:
  Base IVA (19%)                → $10.000  ← sobre el monto real pagado
  IVA a recaudar y declarar     →  $1.900
  Bono extra $2.000             → gasto deducible VIBRRA
```

---

### Registro contable recomendado en Firestore

```
Bonos/{id}
  tipo:            string   ← "bienvenida_cliente" | "bienvenida_anfitrion" |
                               "fidelizacion_mensual" | "recarga" | "encuesta"
  uid_beneficiario: string
  monto_otorgado:  number   ← valor nominal del bono
  monto_consumido: number   ← cuánto se ha usado
  monto_expirado:  number   ← cuánto expiró sin usar
  fecha_otorgado:  timestamp
  fecha_expira:    timestamp | null
  consumos: [{              ← log de cada uso
    fecha, monto, sesion_id, establecimiento_id
  }]
  estado:          string   ← "activo" | "consumido" | "expirado"
  deducible_renta: boolean  ← true para todos excepto bono no reclamable al otorgar
  gasto_reconocido: boolean ← false hasta que se consuma (para diferidos)
```

---

### Impacto en la utilidad neta de VIBRRA

Los bonos reducen la base del impuesto de renta (35%). Ejemplo con 100 anfitriones activos:

```
Ingresos por comisiones (30%)         $10.000.000
Ingresos por suscripciones            $1.500.000
─────────────────────────────────────────────────
Total ingresos brutos                 $11.500.000

Gastos deducibles:
  Bonos bienvenida anfitriones          -$300.000
  Bonos bienvenida clientes             -$150.000
  Bonos recarga (extras acreditados)    -$200.000
  Fidelización mensual consumida        -$180.000
  Costo Wompi (no deducible como IVA)   -$280.000
─────────────────────────────────────────────────
Base renta (antes de otros gastos)    $10.390.000
Impuesto renta estimado (35%)          $3.636.500

Sin bonos, la base sería $11.500.000 → impuesto $4.025.000
Ahorro por bonos: ~$388.500
```

---

### Regla de oro para VIBRRA

> Todo bono debe tener **trazabilidad documental** en Firestore:
> quién lo recibió, cuándo, por qué razón comercial, y cuándo se consumió.
> Sin esto, la DIAN puede rechazarlo como gasto en una auditoría.
> La colección `Bonos/{id}` con todos sus campos cumple ese requisito.

---

## Obligaciones tributarias — VIBRRA y Anfitriones

> ⚠️ Este análisis aplica a VIBRRA como **empresa colombiana**. La normativa de Presencia Económica Significativa (PES) que regula a Netflix/Spotify **no aplica** — esa es para plataformas extranjeras.

---

### Clasificación del servicio VIBRRA ante la DIAN

VIBRRA tiene dos tipos de ingreso con tratamientos distintos:

| Ingreso | Clasificación | IVA |
|---|---|---|
| Suscripción mensual del anfitrión ($15.000/mes) | SaaS / Cloud Computing | **Excluido** (Concepto DIAN 190/2024) |
| Comisión 30% sobre transacciones del bar | Intermediación en servicios audiovisuales | **Gravado 19%** (Art. 437-2 E.T.) |

La exclusión de IVA en SaaS aplica porque: el servicio es accesible por internet, sin interacción humana constante, escalable bajo demanda y medible. Si en algún momento la DIAN cuestiona la clasificación, el respaldo es el autodiagnóstico del MinTIC (Concepto 1444/2017).

---

### Tabla de responsabilidades tributarias

| Impuesto | VIBRRA | Anfitrión | Cuándo |
|---|---|---|---|
| **Renta (35%)** | ✅ Sobre utilidad neta | ✅ Sobre sus ingresos netos | Anual — declaración propia |
| **IVA 19%** | ✅ Recauda y declara sobre comisión 30% | ❌ | Bimestral ante DIAN |
| **IVA suscripción** | ❌ Excluido (SaaS) | ❌ | No aplica |
| **ICA** | ✅ En municipio de domicilio VIBRRA | ✅ En municipio del establecimiento | Según tarifas locales |
| **Retención en fuente** | ✅ Como agente retenedor al pagar al anfitrión | Retenido por VIBRRA | En cada pago/retiro |
| **Costo Wompi (2.49% + $900)** | ❌ | ✅ Deducible de su 70% | No es impuesto — costo operativo |

---

### VIBRRA como agente retenedor

Al transferir el 70% al anfitrión, VIBRRA **practica retención en la fuente**, la consigna a la DIAN y emite comprobante. El anfitrión la descuenta en su declaración de renta anual.

```
Tipo de anfitrión                          Tarifa retención
─────────────────────────────────────────────────────────
Persona natural declarante de renta        3.5%  (servicios)
Persona jurídica                           4.0%  (servicios)
Persona natural no declarante              6.0%
```

Por esto es **obligatorio** solicitar el RUT al anfitrión al momento del registro.

---

### Cálculo completo de un movimiento con impuestos

**Cliente puja $5.000 en el bar:**

```
Monto puja                                         $5.000
──────────────────────────────────────────────────────────
VIBRRA retiene (30%)                              -$1.500
Anfitrión base (70%)                              +$3.500

Sobre la comisión de VIBRRA ($1.500):
  IVA 19% a recaudar y declarar bimestralmente      $285
  (este IVA no lo paga el anfitrión, es de VIBRRA)

Sobre el pago al anfitrión ($3.500):
  Retención fuente 3.5% (persona natural decl.)    -$122
  → VIBRRA consigna $122 a la DIAN
  → Wompi proporcional ~2.49%                       -$87
──────────────────────────────────────────────────────────
Neto transferido al anfitrión                     $3.291
```

**Al momento del retiro (sobre saldo acumulado):**
```
Saldo disponible para retiro                     $200.000
  Retención en la fuente (ya aplicada por transacción)  $0
  ICA municipio del establecimiento (variable)      -$828
──────────────────────────────────────────────────────────
Neto transferido                                 $199.172
```

> La retención se practica en cada transacción, no al momento del retiro, para simplificar la contabilidad.

---

### Resumen real para el anfitrión

De cada **$100** que generan sus clientes en el bar:

```
$100   ingresan del cliente
 -$30  comisión VIBRRA
 -$2,5 costo Wompi proporcional
 -$3,5 retención en fuente (persona natural declarante)
 -$0,8 ICA estimado
─────────────────────────────
 $63,2  neto real en cuenta bancaria
```

Este resumen se muestra en el dashboard del anfitrión como "¿Cuánto me queda de cada $100?".

---

### Campos tributarios obligatorios en `Anfitriones/{uid}`

```
rut: string                      ← NIT o cédula — obligatorio al registrarse
tipo_persona: string             ← "natural" | "juridica"
es_declarante_renta: boolean     ← determina tarifa de retención
regimen_tributario: string       ← "simple" | "ordinario"
tarifa_retencion: number         ← calculada automáticamente al guardar RUT
                                    3.5 | 4.0 | 6.0
municipio_fiscal: string         ← para aplicar ICA correcto
razon_social: string             ← para comprobantes de retención
responsable_iva: boolean         ← si el anfitrión es responsable de IVA
```

**Validación al registrar anfitrión:**
```
1. Solicitar RUT (obligatorio)
2. Determinar tipo_persona y es_declarante_renta
3. Calcular y guardar tarifa_retencion automáticamente
4. Bloquear retiros si el RUT no está registrado
```

---

### Obligaciones operativas de VIBRRA ante la DIAN

| Obligación | Frecuencia | Qué se declara |
|---|---|---|
| Declaración IVA | Bimestral | IVA generado sobre comisiones 30% |
| Declaración retención en fuente | Mensual | Retenciones practicadas a anfitriones |
| Declaración renta | Anual | Utilidad neta de VIBRRA |
| Información exógena | Anual | Pagos a terceros (anfitriones) superiores a 1 UVT |
| Registro DIAN como responsable IVA | Antes del primer cobro | RUT con actividad de intermediación |

---

### Acciones antes del primer anfitrión de pago

1. **Registrar VIBRRA ante DIAN** como responsable de IVA (actividad: intermediación servicios digitales + audiovisuales)
2. **Solicitar RUT** en el formulario de registro del anfitrión — campo obligatorio, sin RUT no hay retiros
3. **Parametrizar tarifas de retención** en `Configuracion/impuestos/retencion` por tipo de contribuyente
4. **Concepto escrito de contador** sobre clasificación SaaS vs intermediario — blindaje ante posible revisión DIAN
5. **Facturación electrónica** — obligatoria en Colombia para empresas que facturan. VIBRRA debe emitir factura electrónica por cada comisión cobrada al anfitrión

---

## Modelo de ingresos y distribución financiera

### Regla base
VIBRRA retiene el **30%** de todo movimiento real de dinero generado en el establecimiento. El anfitrión recibe el **70%** restante, menos deducciones.

```
Aplica 30/70:          Pujas · Conexiones · Dedicatorias · Vetos
No aplica (neto 100%): Canciones de bono · Conexiones de bono · Canciones gratis cliente
```

---

### Cálculo completo de un movimiento

**Ejemplo: cliente puja $5.000**

```
Monto bruto                          $5.000
─────────────────────────────────────────────
VIBRRA (30%)                        -$1.500
─────────────────────────────────────────────
Base del anfitrión (70%)             $3.500

Deducciones sobre base del anfitrión:
  Costo pasarela Wompi proporcional     -$87   ← 2.49% de su parte
  Retención en la fuente (si aplica)      $0   ← solo al retirar
─────────────────────────────────────────────
Neto acreditado al anfitrión         $3.413
```

**Ejemplo: retiro de $200.000 acumulados**

```
Saldo disponible                   $200.000
  Retención en la fuente (3.5%)     -$7.000   ← Art. 392 ET, servicios
  ICA Manizales (4.14‰ aprox.)        -$828   ← varía por municipio
─────────────────────────────────────────────
Neto transferido al anfitrión      $192.172
```

> Los porcentajes de retención e ICA se parametrizan por municipio en
> `Configuracion/impuestos/{municipio}` — actualizables sin redespliegue.

---

### Deducciones definidas

| Concepto | Quién lo paga | Cuándo se aplica | Base |
|---|---|---|---|
| Comisión VIBRRA 30% | Anfitrión | En cada transacción | Monto bruto |
| Costo Wompi (2.49% + $900) | Anfitrión (proporcional a su 70%) | En cada recarga del cliente | Monto recarga |
| IVA sobre comisión VIBRRA | VIBRRA (interno) | Declaración VIBRRA | Comisión VIBRRA |
| Retención en la fuente | Anfitrión | Al momento del retiro | Monto retiro |
| ICA | Anfitrión | Al momento del retiro | Monto retiro |

> **Nota:** El IVA sobre la comisión de VIBRRA es obligación de VIBRRA, no del anfitrión.
> Se muestra en el estado de cuenta del anfitrión solo a título informativo.

---

### Movimientos bancarios del anfitrión

El dashboard del anfitrión muestra un estado de cuenta detallado — igual que un extracto bancario. Cada línea es trazable.

**Colección:**
```
Anfitriones/{uid}/Movimientos/{id}
  tipo:               string   ← "ingreso" | "deduccion" | "retiro" | "bono_vibrra"
  concepto:           string   ← descripción legible (ver tabla abajo)
  monto_bruto:        number   ← valor antes de deducciones
  monto_neto:         number   ← valor que afecta el saldo real
  referencia:         string   ← puja_id, sesion_id, retiro_id según corresponda
  sesion_id:          string   ← sesión donde ocurrió
  establecimiento_id: string   ← a qué local corresponde este movimiento
  timestamp:          timestamp
  detalle: {
    vibrra_30pct:     number   ← cuánto se fue a VIBRRA
    wompi_fee:        number   ← costo pasarela
    retencion:        number   ← retención en la fuente (si aplica)
    ica:              number   ← ICA (si aplica)
  }
```

> Los Movimientos son el extracto financiero unificado del anfitrión, sin importar cuántos
> establecimientos tenga. Cada línea tiene `establecimiento_id` para filtrar por local.

---

### Audit Log — historial de cambios de la cuenta

Cada cambio que se realice sobre la cuenta del anfitrión (datos personales, establecimientos,
documentos legales, retiros) genera un registro inmutable en AuditLog.

**Colección:**
```
Anfitriones/{uid}/AuditLog/{id}
  tipo_cambio:         string    ← "datos_personales" | "datos_establecimiento" |
                                    "doc_legal" | "precio" | "retiro" | "estado_cuenta"
  establecimiento_id:  string    ← null si el cambio es sobre el anfitrión directamente
  campo:               string    ← nombre exacto del campo modificado (ej: "precio_conexion")
  valor_anterior:      any       ← snapshot del valor antes del cambio
  valor_nuevo:         any       ← snapshot del valor después del cambio
  realizado_por:       string    ← uid del autor del cambio
  rol_autor:           string    ← "anfitrion" | "superadmin"
  motivo:              string    ← obligatorio cuando rol_autor == "superadmin"
  timestamp:           timestamp ← serverTimestamp() — no modificable por el cliente
  ip:                  string    ← IP de la solicitud (registrada por Function)
```

**Regla crítica:** El AuditLog es de solo escritura para el cliente — nunca se puede
modificar ni eliminar un registro existente. Solo Cloud Functions pueden escribir en él,
garantizando la integridad del historial.

**Ejemplos de entradas AuditLog:**

| tipo_cambio | campo | valor_anterior | valor_nuevo | rol_autor |
|---|---|---|---|---|
| datos_personales | email | "viejo@gmail.com" | "nuevo@gmail.com" | anfitrion |
| datos_establecimiento | precio_conexion | 0 | 2000 | anfitrion |
| doc_legal | doc_sayco_acinpro_vence | "2024-03-15" | "2025-03-15" | anfitrion |
| precio | precio_por_cancion | 1500 | 2000 | anfitrion |
| retiro | saldo_disponible | 185000 | 0 | superadmin |
| estado_cuenta | activo | true | false | superadmin |
| datos_personales | nombre | "Carlos" | "Carlos Andrés" | anfitrion |

**Conceptos por tipo:**

| concepto | tipo | Ejemplo monto_neto |
|---|---|---|
| `"puja_cliente"` | ingreso | +$3.413 |
| `"conexion_cliente"` | ingreso | +$1.365 |
| `"dedicatoria"` | ingreso | +$2.730 |
| `"veto_cancion"` | ingreso | +$3.413 |
| `"comision_vibrra_30pct"` | deduccion | -$1.500 |
| `"costo_pasarela_wompi"` | deduccion | -$87 |
| `"retencion_fuente"` | deduccion | -$7.000 |
| `"ica_municipal"` | deduccion | -$828 |
| `"retiro_transferencia"` | retiro | -$192.172 |
| `"bono_bienvenida_vibrra"` | bono_vibrra | +$30.000 |
| `"cancion_propia_anfitrion"` | info | $0 |

---

### Retiro consolidado de cuenta — anfitrión con múltiples establecimientos

Un anfitrión puede tener N establecimientos. Cada uno genera sus propias ganancias
(`generado_pendiente`). El retiro se realiza sobre el **total consolidado de la cuenta**,
no por establecimiento individual.

**Reglas de retiro:**
```
1. Solo disponible del día 1 al 10 de cada mes
2. Máximo 1 retiro por anfitrión por mes (no por establecimiento)
3. El retiro incluye el saldo de TODOS sus establecimientos
4. Monto mínimo: $20.000 COP
5. El campo Anfitriones/{uid}.retiro_este_mes previene doble retiro
6. Al procesar: se zeroan generado_pendiente de TODOS los establecimientos del anfitrión
```

**Colección Retiros/{id}:**
```
Retiros/{id}
  anfitrion_id:          string        ← ref → Anfitriones/{uid}
  monto_bruto:           number        ← saldo_disponible al momento de solicitar
  deducciones: {
    retencion_fuente:    number
    ica:                 number
  }
  monto_neto:            number        ← lo que realmente se transfiere
  estado:                string        ← "solicitado" | "en_proceso" | "procesado" | "rechazado"
  cuenta_destino: {
    banco, tipo_cuenta, numero, titular
  }
  desglose_por_establecimiento: [      ← trazabilidad de qué generó qué
    { establecimiento_id, nombre, monto },
    { establecimiento_id, nombre, monto },
    ...
  ]
  fecha_solicitud:       timestamp
  fecha_procesado:       timestamp     ← cuando superadmin ejecutó la transferencia
  procesado_por:         string        ← uid del superadmin
  referencia_bancaria:   string        ← número de transferencia del banco
```

**Flujo técnico al procesar un retiro:**
```
Superadmin aprueba Retiros/{id} →
  Function procesarRetiro():
    1. batch.update Anfitriones/{uid}:
         saldo_disponible = 0
         ultimo_retiro_fecha = now
         retiro_este_mes = true
         total_retirado_historico += monto_neto
    2. Para cada establecimiento en desglose_por_establecimiento:
         batch.update Establecimientos/{estId}:
           generado_pendiente = 0
    3. batch.set Anfitriones/{uid}/Movimientos:
         tipo: "retiro", monto_neto: -monto_neto, referencia: retiro_id
    4. batch.set Anfitriones/{uid}/AuditLog:
         tipo_cambio: "retiro", campo: "saldo_disponible"
         valor_anterior: monto_bruto, valor_nuevo: 0
         realizado_por: superadmin_uid, rol_autor: "superadmin"
    5. batch.update Retiros/{id}:
         estado: "procesado"
         fecha_procesado: now
         procesado_por: superadmin_uid
         referencia_bancaria: "..."
```

> Job mensual día 11: `resetRetiroMes` → pone `retiro_este_mes = false` en todos los
> anfitriones, habilitando el siguiente ciclo.

---

### Pantalla de movimientos en la app (anfitrión)

Formato de extracto bancario con filtros:

```
┌─────────────────────────────────────────────┐
│  Establecimiento: Bar La Séptima            │
│  Período: Feb 2026                          │
├─────────────────────────────────────────────┤
│  Saldo anterior          $0                 │
│  + Ingresos         +$245.000               │
│  - Deducciones       -$52.172               │
│  - Retiros          -$192.172               │
│  ─────────────────────────────              │
│  Saldo disponible      $656                 │
├─────────────────────────────────────────────┤
│  📅 24 Feb  22:15                           │
│  Puja cliente · "Amor perdido" (Silvestre)  │
│  Bruto: $5.000                              │
│  - Comisión VIBRRA (30%)        -$1.500     │
│  - Costo pasarela Wompi           -$87      │
│  Neto acreditado:               +$3.413  ✅ │
├─────────────────────────────────────────────┤
│  📅 24 Feb  23:40                           │
│  Conexión · Anónimo #2847                   │
│  Bruto: $2.000                              │
│  - Comisión VIBRRA (30%)          -$600     │
│  - Costo pasarela Wompi           -$35      │
│  Neto acreditado:               +$1.365  ✅ │
├─────────────────────────────────────────────┤
│  📅 25 Feb  10:03                           │
│  Retiro transferencia                       │
│  Saldo bruto:             $200.000          │
│  - Retención en la fuente  -$7.000          │
│  - ICA Manizales             -$828          │
│  Transferido:            +$192.172  🏦      │
└─────────────────────────────────────────────┘
```

Filtros disponibles: por sesión · por fecha · por tipo · exportar CSV/PDF

---

### Configuración de impuestos por municipio

```
Configuracion/impuestos/{municipio}/
  ica_promil: number           ← ej. 4.14 para Manizales
  retencion_pct: number        ← 3.5 servicios (Art. 392 ET)
  nombre_municipio: string
  activo: boolean
  ultima_actualizacion: timestamp
```

Actualizable desde el panel superadmin sin tocar código.

---

### Resumen para el anfitrión (transparencia total)

De cada $100 que generan sus clientes en el bar:

```
$100 ingresados por clientes
 -$30  Comisión VIBRRA
 -$2,5 Costo pasarela (Wompi, proporcional)
──────
 $67,5 base disponible para retiro

Al retirar:
 -$2,4  Retención en la fuente (3.5%)
 -$0,3  ICA (ejemplo Manizales)
──────
 $64,8  neto real en su cuenta bancaria
```

---

## Pasarela de pagos — Wompi

**SDK:** `wompi_flutter` o integración directa vía HTTP  
**Métodos soportados:** Nequi · PSE · Botón Bancolombia · Tarjetas Visa/Mastercard/Amex  
**Comisión:** 2.49% + $900 COP por transacción  
**Respuesta:** automática (webhook + polling)

**Flujo de recarga de saldo en VIBRRA:**
```
1. Usuario selecciona monto de recarga (ej. $10.000)
2. App crea transacción en Wompi vía API
3. Wompi retorna URL de checkout o deeplink a Nequi
4. Usuario completa el pago en Nequi/PSE/tarjeta
5. Wompi envía webhook a Firebase Function
6. Firebase Function valida la firma del webhook
7. Function acredita el saldo en Firestore Clientes/{uid}.saldo
8. App recibe actualización en tiempo real vía Firestore onSnapshot
```

**Colección de transacciones:**
```
Transacciones/{id}
  uid: string                    ← cliente o anfitrión
  tipo_usuario: string           ← "cliente" | "anfitrion" | "empresario"
  wompi_id: string               ← referencia de Wompi
  monto: number                  ← monto pagado
  monto_acreditado: number       ← monto + bono si aplica
  metodo_pago: string            ← "nequi" | "pse" | "bancolombia" | "tarjeta"
  estado: string                 ← "pendiente" | "aprobada" | "rechazada"
  timestamp: timestamp
```

**Firebase Function — webhook de Wompi:**
```javascript
exports.wompiWebhook = onRequest(async (req, res) => {
  // 1. Validar firma HMAC del webhook
  // 2. Si estado == APPROVED → acreditar saldo
  // 3. Si aplica bono de recarga → acreditar extra
  // 4. Escribir en Transacciones/{id}
  // 5. Actualizar saldo en Clientes/{uid} o Anfitriones/{uid}
});
```

---

## Convenciones de código Flutter

- Bloc + Clean Architecture: `domain` → `data` → `presentation`
- Colecciones Firestore con mayúscula inicial
- Campos en minúscula con guion bajo
- Responsive: móvil, tablet, laptop, TV
- `KeyboardScrollWrapper` en todas las páginas con scroll
- Colors: `AppColors.primaryDark`, `AppColors.grayLight`, `AppColors.pinkLight`, `AppColors.textDark`
- `CustomTextField` requiere parámetro `label`
- Imágenes: `image_picker` + `StorageService`
- Forms: `FocusNode` + `TextInputAction.next`
- Imports en collections/central/*: `'../../../services/'` (3 niveles)
- Bottom sheets: `Column` en `SingleChildScrollView`
- ZIPs: solo cuando James lo autoriza, solo archivos modificados

## Convenciones Extensión Chrome

- Manifest V3
- `chrome.storage.local` (no `localStorage`)
- Firebase SDK como módulo ES en el service worker

---

## Estado del desarrollo

| Módulo | Estado | Archivo |
|---|---|---|
| Panel superadmin Flutter | ✅ Completo | `vibrra_admin_module.zip` |
| Landing page | ✅ Completo | (en repo) |
| Auth Firebase (anfitrión app) | ✅ Completo | (en repo) |
| Diagrama de arquitectura | ✅ Completo | `vibrra_arquitectura.html` |
| Login QR extensión Chrome | 🔲 Pendiente | — |
| Extensión Chrome (core) | 🔲 Pendiente | — |
| Firebase Function (customToken) | 🔲 Pendiente | — |
| Firebase Function (reset mensual) | 🔲 Pendiente | — |
| Pantalla sesión clientes (cola + puja) | 🔲 Pendiente | — |
| Cola en tiempo real Flutter | 🔲 Pendiente | — |
| Reproductor / progreso local | 🔲 Pendiente | — |
| YouTube Search API integrada | 🔲 Pendiente | — |
| Módulo de saldos y recargas | 🔲 Pendiente | — |
| Módulo de retiros (anfitrión) | 🔲 Pendiente | — |
| QR flotante en YouTube (extensión) | 🔲 Pendiente | — |
| Historial y favoritos (cliente) | 🔲 Pendiente | — |
| Módulo Empresarios completo | 🔲 En construcción | — |

---

## Cómo usar este documento en un nuevo chat

```
Estoy desarrollando VIBRRA, un jukebox digital para bares.
Este es el documento maestro con toda la arquitectura definida:

[pegar contenido de este archivo]

Hoy quiero trabajar en: [módulo específico]
```

---

---

## Documentación legal de establecimientos (Art. 87 Ley 1801/2016)

> Todos los bares y discotecas en Colombia deben mantener estos documentos vigentes o se exponen a cierre temporal y multas según el Código Nacional de Seguridad y Convivencia Ciudadana.

### Documentos requeridos y su impacto en VIBRRA

| Documento | Entidad | Vigencia | Bloquea sesión VIBRRA si vence |
|---|---|---|---|
| Matrícula Mercantil | Cámara de Comercio | Anual (renovar antes 31 mar) | No — advertencia en dashboard |
| RUT/NIT del establecimiento | DIAN | Permanente | No |
| Concepto de Uso del Suelo | Planeación municipal | Indefinido / según POT | No |
| Licencia de Funcionamiento | Alcaldía municipal | Anual | No — advertencia |
| **Certificado OSA (SAYCO/ACINPRO)** | OSA — Organización Sayco Acinpro | **Anual** | **SÍ — crítico** |
| Concepto Técnico de Bomberos | Cuerpo de Bomberos | Anual | No — advertencia |
| Concepto Sanitario | Secretaría de Salud | Anual | No — advertencia |
| Permiso expendio de licor | Alcaldía municipal | Anual | No — advertencia |
| Permiso horario extendido | Alcaldía municipal | Anual | No |

### ¿Por qué el OSA bloquea la sesión?

El Certificado OSA (pago de derechos de autor a SAYCO-ACINPRO) es el único documento que VIBRRA **está obligada contractualmente a verificar**, por tres razones:

1. **Ley 23 de 1982, Art. 158-159**: todo establecimiento que comunique música al público debe tener autorización de la OSA. VIBRRA es el mecanismo que facilita esa comunicación.
2. **Riesgo directo para VIBRRA**: si la OSA demanda al establecimiento por no tener el certificado, VIBRRA podría ser coademandada como plataforma tecnológica facilitadora.
3. **Contrato de servicio VIBRRA**: el contrato que firma el anfitrión al registrarse incluye cláusula declarando que es su responsabilidad mantener el certificado OSA vigente. El bloqueo es la herramienta de enforcement.

> Los demás documentos son responsabilidad exclusiva del anfitrión. VIBRRA los registra y genera alertas, pero no bloquea la operación por ellos.

### Lógica de `docs_estado_general`

```
"completo"    → todos los docs_*_vigente == true
"advertencia" → algún doc vence en menos de 30 días
"critico"     → doc_sayco_acinpro_vigente == false
               O algún doc_*_vigente == false (excepto sayco que bloquea)
```

### Alertas automáticas al anfitrión

Firebase Function `verificarDocumentosVencimiento` — ejecuta diariamente a las 9am:

```javascript
// Pseudocódigo — lógica de alertas
para cada Establecimiento activo:
  dias_sayco = diff(doc_sayco_acinpro_vence, hoy)
  
  si dias_sayco <= 0:
    → bloquear sesion (sesion_activa = false si hay sesión abierta)
    → push notification: "Tu certificado OSA venció. Renuévalo para seguir usando VIBRRA."
  
  si dias_sayco <= 30:
    → push notification: "Tu certificado OSA vence en {N} días."
  
  para cada otro documento con _vence:
    si dias <= 15:
      → push notification suave en dashboard
  
  recalcular docs_estado_general
```

### Flujo de onboarding de documentos

Al registrar un nuevo establecimiento, el anfitrión debe:

```
Paso 1 — Datos básicos del local (nombre, ciudad, barrio, dirección)
Paso 2 — Subir foto del QR / certificado OSA vigente → Firebase Storage
Paso 3 — Registrar fechas de vencimiento de cada documento
Paso 4 — VIBRRA activa el establecimiento solo si doc_sayco_acinpro_vigente == true
```

El anfitrión puede declarar los documentos de forma manual (no hay validación automática con entidades externas al inicio). La responsabilidad contractual es del anfitrión. En versiones futuras se podría integrar con la API de la Cámara de Comercio para validación automática.

---

## Capa de Estadísticas

> Diseñada para ser consultable desde el panel superadmin, el dashboard del anfitrión y futuras integraciones de analytics. Todo se escribe en Firestore. Ningún dato de estadística vive en Realtime DB.

### Principio de diseño
- **Escritura barata:** se acumulan contadores con `FieldValue.increment()` — una sola operación
- **Lectura rápida:** datos pre-agregados por día/mes, no se calculan en tiempo real
- **Sin duplicación:** los datos crudos están en `Pujas` y `Sesiones` — las estadísticas son agregados derivados

---

### Colecciones de estadísticas

#### `Stats_Canciones/{youtube_video_id}`
Ranking global de canciones en toda la plataforma.

```
youtube_video_id: string
titulo: string
artista: string
duracion_ms: number
veces_pedida: number          ← total histórico
veces_reproducida: number     ← cuántas veces llegó a sonar (vs pedida)
total_pujado: number          ← suma de todas las pujas sobre esta canción
puja_maxima_historica: number
establecimientos_count: number ← en cuántos bares distintos se ha pedido
ultima_vez: timestamp
primera_vez: timestamp
genero: string                ← inferido o etiquetado manualmente
```

#### `Stats_Canciones/{youtube_video_id}/Por_Mes/{YYYY-MM}`
Desglose mensual por canción.

```
veces_pedida: number
veces_reproducida: number
total_pujado: number
establecimientos: array       ← ids únicos donde sonó ese mes
```

---

#### `Stats_Establecimientos/{establecimiento_id}`
Rendimiento acumulado de cada local.

```
establecimiento_id: string
total_sesiones: number
total_horas_activo: number
total_recaudado: number
puja_promedio: number
cancion_mas_pedida_id: string
cancion_mas_pujada_id: string
pico_usuarios_simultaneos: number
total_usuarios_unicos: number        ← device_id únicos históricos
total_clientes_registrados: number   ← de esos, cuántos eran Clientes
tasa_conversion_registro: number     ← % anónimos que se registraron en este bar
hora_pico: number                    ← 0-23, hora con más actividad histórica
dia_pico: string                     ← "viernes", "sábado", etc.
```

#### `Stats_Establecimientos/{establecimiento_id}/Por_Dia/{YYYY-MM-DD}`
Snapshot diario — permite gráficas de tendencia.

```
fecha: timestamp
duracion_min: number
total_recaudado: number
total_usuarios: number
total_canciones: number
total_pujas: number
puja_promedio: number
hora_inicio: timestamp
hora_fin: timestamp
cancion_mas_pujada: string
```

#### `Stats_Establecimientos/{establecimiento_id}/Canciones_Top/{youtube_video_id}`
Las 50 canciones más pedidas en ese establecimiento (actualización incremental).

```
youtube_video_id: string
titulo: string
artista: string
veces_pedida: number
total_pujado: number
ultima_vez: timestamp
```

---

#### `Stats_Plataforma/global`
Documento único con métricas globales de VIBRRA — actualizado al cerrar cada sesión.

```
total_sesiones: number
total_horas_activo: number
total_recaudado: number
total_pujas: number
total_canciones_distintas: number
total_usuarios_unicos: number
total_clientes_registrados: number
tasa_conversion_global: number      ← % anónimos → clientes
establecimiento_mas_activo_id: string
cancion_mas_pedida_id: string
ciudad_mas_activa: string
```

#### `Stats_Plataforma/Por_Mes/{YYYY-MM}`
Histórico mensual de la plataforma.

```
mes: string
total_sesiones: number
total_recaudado: number
nuevos_anfitriones: number
nuevos_clientes: number
nuevos_anonimos: number
establecimientos_activos: number
ciudades_activas: array
canciones_nuevas: number            ← video_ids que sonaron por primera vez
```

---

#### `Stats_Clientes/{uid}`
Comportamiento individual del cliente registrado.

```
uid: string
total_conexiones: number
total_canciones_pedidas: number
total_pujado: number
puja_promedio: number
genero_favorito: string             ← inferido de su historial
artista_mas_pedido: string
establecimiento_favorito_id: string ← donde más ha ido
total_establecimientos_visitados: number
dias_desde_registro: number
frecuencia_visita: number           ← promedio de días entre visitas
ultima_conexion: timestamp
nivel: string                       ← "nuevo" | "regular" | "frecuente" | "vip"
```

---

#### `Stats_Horarios/{establecimiento_id}`
Distribución de actividad por hora y día — útil para que el anfitrión sepa cuándo abrir.

```
lunes:    { 18: 0, 19: 2, 20: 15, 21: 34, 22: 67, 23: 89, 0: 45, 1: 12 }
martes:   { ... }
miercoles:{ ... }
jueves:   { ... }
viernes:  { ... }
sabado:   { ... }
domingo:  { ... }
```
Cada número = promedio de usuarios activos en esa hora.

---

### Cuándo se escribe cada estadística

| Evento | Qué se escribe |
|---|---|
| Usuario se conecta al establecimiento | `Stats_Establecimientos/{id}` usuarios únicos · `Stats_Plataforma/global` |
| Cliente se registra desde un bar | `Stats_Establecimientos/{id}` tasa_conversion · `Stats_Plataforma/Por_Mes` nuevos_clientes |
| Canción agregada a la cola | `Stats_Canciones/{vid}` veces_pedida · `Stats_Establecimientos/{id}/Canciones_Top` |
| Canción reproducida (llegó a sonar) | `Stats_Canciones/{vid}` veces_reproducida |
| Puja realizada | `Stats_Canciones/{vid}` total_pujado · `Stats_Clientes/{uid}` total_pujado |
| Sesión cerrada (extensión) | `Stats_Establecimientos/{id}/Por_Dia` · `Stats_Plataforma/global` · `Stats_Horarios/{id}` |
| Fin de mes (Function) | `Stats_Plataforma/Por_Mes/{YYYY-MM}` snapshot completo |

---

### Campos adicionales que se agregan a colecciones existentes

**`Pujas/{id}`** — agrega:
```
genero: string              ← del video de YouTube
duracion_ms: number
hora_del_dia: number        ← 0-23, para análisis de horarios
dia_semana: string          ← "viernes"
```

**`Sesiones/{id}`** — agrega:
```
hora_inicio: timestamp
hora_fin: timestamp
dia_semana: string
ciudad: string
puja_maxima: number
cancion_mas_pujada_id: string
tasa_reproduccion: number   ← canciones reproducidas / canciones pedidas
usuarios_anonimos: number
usuarios_clientes: number
nuevos_registros: number    ← clientes que se registraron durante esa sesión
```

**`Clientes/{uid}`** — agrega:
```
establecimiento_primer_uso_id: string   ← dónde se registró
device_id_origen: string                ← device_id del anónimo que era antes
```

**`Anonimos/{id}`** — agrega:
```
canciones_pedidas: number
total_pujado: number
se_registro: boolean        ← si eventualmente se convirtió en Cliente
```

---

### Firebase Function: job de cierre de sesión

Al llamar desde la extensión `cerrarSesion(establecimientoId)`, la Function calcula y escribe todos los agregados de estadísticas en una sola transacción batch — no lo hace la extensión directamente.

```javascript
exports.cerrarSesion = onCall(async ({ establecimientoId, resumen }) => {
  const batch = db.batch();
  // 1. Escribe Stats_Establecimientos/Por_Dia
  // 2. Incrementa Stats_Plataforma/global
  // 3. Actualiza Stats_Horarios con distribución de la sesión
  // 4. Actualiza Stats_Canciones de cada canción que sonó
  // 5. Escribe resumen en Sesiones/{id}
  await batch.commit();
});
```

Esto garantiza consistencia — o se escribe todo o no se escribe nada.

---

## Capa de Inteligencia de Usuarios (CRM)

> Objetivo: construir perfiles ricos de comportamiento que permitan segmentar campañas publicitarias, personalizar la experiencia y monetizar la audiencia. Todo respetando privacidad y legislación colombiana de datos (Ley 1581 de 2012).

---

### Filosofía de recolección

- **Pasiva:** se recolecta automáticamente del comportamiento — sin formularios molestos
- **Progresiva:** el anónimo tiene poco perfil, el cliente registrado tiene perfil completo
- **Consentida:** al registrarse el cliente acepta política de datos que explica el uso
- **Anonimizada para terceros:** los Empresarios ven segmentos, nunca datos individuales

---

### Perfil extendido del usuario

#### `Perfiles/{uid}` — aplica a Clientes y Anónimos (por device_id)

**Demografía inferida:**
```
edad_estimada: string          ← "18-24" | "25-34" | "35-44" | "45+"
                                  inferida por géneros musicales y horarios
genero_estimado: string        ← opcional, solo si el cliente lo provee al registrarse
ciudad: string                 ← inferida por geolocalización del establecimiento
barrio: string                 ← inferida por establecimientos visitados
nivel_socioeconomico: string   ← "bajo" | "medio" | "alto"
                                  inferido por monto promedio de pujas
```

**Gustos musicales:**
```
generos_favoritos: array       ← ["reggaeton", "salsa", "electronica"]
                                  ordenados por frecuencia
artistas_top: array            ← top 10 artistas más pedidos
canciones_favoritas: array     ← video_ids más pedidos
idioma_musical: string         ← "español" | "ingles" | "mixto"
energia_musical: string        ← "alta" | "media" | "baja"
                                  inferida por BPM promedio de canciones pedidas
hora_preferida: number         ← hora del día en que más activo (0-23)
dia_preferido: string          ← día de la semana con más actividad
```

**Comportamiento de consumo:**
```
ticket_promedio: number        ← promedio de gasto por visita
ticket_maximo: number          ← mayor gasto en una sola visita
frecuencia_visita: string      ← "ocasional" | "regular" | "frecuente" | "vip"
                                  basado en visitas por mes
tiempo_promedio_sesion: number ← minutos promedio que permanece conectado
canciones_por_visita: number   ← promedio
puja_promedio: number
impulsividad: string           ← "conservador" | "moderado" | "impulsivo"
                                  basado en velocidad de puja y montos
tipo_consumidor: string        ← "oyente" (no puja) | "activo" | "dominante" (siempre #1)
```

**Comportamiento social:**
```
influencia: number             ← 0-100, qué tanto copian sus canciones otros usuarios
primero_en_pedir: number       ← cuántas veces pidió una canción antes que otros
canciones_virales: number      ← canciones que pidió y luego todo el bar copió
```

**Geográfico:**
```
ciudades_visitadas: array
establecimientos_visitados: array    ← ids
establecimientos_favoritos: array    ← top 3 por frecuencia
radio_movilidad: number              ← km promedio entre establecimientos visitados
```

**Engagement con la plataforma:**
```
dias_activo: number                  ← días únicos con actividad
racha_actual: number                 ← días consecutivos activos
racha_maxima: number
nivel_lealtad: string                ← "nuevo" | "bronce" | "plata" | "oro" | "platino"
nps_score: number                    ← Net Promoter Score si ha respondido encuesta
ultima_encuesta: timestamp
fecha_primer_uso: timestamp
fecha_ultimo_uso: timestamp
dias_desde_ultimo_uso: number        ← para detectar usuarios en riesgo de abandono
```

---

### Segmentos predefinidos para campañas

Calculados automáticamente por Firebase Function cada noche. Se leen desde `Segmentos/{nombre}`.

```
Segmentos/reggaetoneros
  → generos_favoritos contiene "reggaeton" y frecuencia >= 3/mes

Segmentos/noctambulos
  → hora_preferida entre 23 y 3

Segmentos/vip
  → ticket_promedio > 15.000 y frecuencia == "frecuente"

Segmentos/en_riesgo
  → dias_desde_ultimo_uso > 30 y nivel_lealtad != "nuevo"

Segmentos/nuevos_este_mes
  → fecha_primer_uso en el mes actual

Segmentos/jovenes_urbanos
  → edad_estimada "18-24" y ciudad en top 5 ciudades

Segmentos/dominantes
  → tipo_consumidor == "dominante"   ← los que siempre quieren ser #1

Segmentos/influencers_musicales
  → influencia > 70

Segmentos/fin_de_semana
  → dia_preferido in ["viernes", "sabado"]

Segmentos/salseros_cali
  → generos_favoritos contiene "salsa" y ciudad == "Cali"
```

Cada segmento tiene:
```
nombre: string
descripcion: string
total_usuarios: number
criterios: map                ← para auditoría
ultima_actualizacion: timestamp
```

---

### Encuestas

#### `Encuestas/{id}`
```
titulo: string
descripcion: string
preguntas: array [{
  id, tipo: "opcion_multiple"|"escala"|"texto_libre",
  texto, opciones: array
}]
segmento_objetivo: string     ← id del segmento o "todos"
establecimiento_id: string    ← null = global
activa: boolean
fecha_inicio, fecha_fin
recompensa: {
  tipo: "cancion_gratis" | "saldo" | "ninguna",
  valor: number
}
total_respuestas: number
```

#### `Encuestas/{id}/Respuestas/{uid}`
```
uid: string
respuestas: map               ← { pregunta_id: respuesta }
timestamp: timestamp
establecimiento_id: string    ← dónde estaba cuando respondió
tiempo_respuesta_seg: number  ← cuánto tardó en responder
```

**Cuándo mostrar encuestas:**
- Al salir de una sesión (máximo 1 encuesta por semana por usuario)
- Al reclamar recompensa (canción gratis a cambio de responder)
- En la pantalla de espera mientras no hay sesión activa

---

### Campañas publicitarias (Empresarios)

#### `Campanas/{id}`
```
empresario_id: string
titulo: string
descripcion: string
tipo: "banner" | "video_corto" | "encuesta_patrocinada" | "cancion_patrocinada"
contenido_url: string         ← imagen o video en Firebase Storage
segmento_objetivo: string     ← id del segmento
ciudades: array               ← filtro geográfico opcional
establecimientos: array       ← establecimientos específicos o vacío = todos
presupuesto: number
costo_por_impresion: number
costo_por_click: number
impresiones: number
clicks: number
ctr: number                   ← click-through rate
gasto_actual: number
activa: boolean
fecha_inicio, fecha_fin
aprobada_por: string          ← uid del superadmin que aprobó
```

**Cuándo mostrar publicidad en la app:**
- Banner entre canciones en la cola (mientras el cliente espera)
- Pantalla de carga al entrar al establecimiento
- Notificación push segmentada (máx 1/día por usuario)
- Canción patrocinada: el empresario paga para que su canción/jingle suene en la sesión

**Cuándo mostrar publicidad en la extensión:**
- Entre canciones (5 segundos antes de la siguiente) — overlay en YouTube
- Como parte del QR flotante: logo del empresario debajo del QR

---

### Eventos de comportamiento en tiempo real

#### `Eventos/{uid}/stream/{auto_id}`
Log de eventos individuales — base para calcular perfiles.

```
tipo: "conexion" | "puja" | "cancion_pedida" | "encuesta_respondida" |
      "publicidad_vista" | "publicidad_click" | "sesion_abandonada" |
      "cancion_reproducida" | "favorito_agregado" | "recarga_realizada"
timestamp: timestamp
establecimiento_id: string
metadata: map                 ← datos específicos del evento
                                ej: { video_id, monto, duracion_vista_seg }
```

> Solo se guardan los últimos 90 días de eventos por usuario. Un job mensual archiva y elimina los más antiguos, actualizando los agregados en `Perfiles`.

---

### Firebase Functions para inteligencia de usuarios

```javascript
// Recalcula el perfil de un usuario cada vez que hace algo relevante
exports.actualizarPerfil = onDocumentCreated('Eventos/{uid}/stream/{id}', ...)

// Recalcula todos los segmentos cada noche a las 3am
exports.recalcularSegmentos = onSchedule('0 3 * * *', ...)

// Detecta usuarios en riesgo de abandono y dispara notificación
exports.deteccionChurn = onSchedule('0 10 * * *', async () => {
  // Busca usuarios con dias_desde_ultimo_uso == 14 o 30
  // Envía push: "¡Te extrañamos! Tienes 3 canciones gratis esperándote"
})

// Cierra encuestas vencidas y calcula resultados
exports.procesarEncuestas = onSchedule('0 0 * * *', ...)

// Descuenta presupuesto de campañas activas
exports.facturarCampanas = onSchedule('0 1 * * *', ...)
```

---

### Consentimiento y privacidad (Ley 1581/2012 Colombia)

Al registrarse, el cliente acepta:

1. **Recolección de datos de uso** para personalización de experiencia
2. **Análisis de comportamiento musical** para recomendaciones
3. **Recepción de publicidad segmentada** de Empresarios VIBRRA
4. **Participación en encuestas** (opcional, con recompensa)

El usuario puede en cualquier momento:
- Ver sus datos en "Mi perfil"
- Desactivar publicidad personalizada (verá publicidad genérica)
- Eliminar su cuenta y todos sus datos (`deleteUser` limpia todas las colecciones)

```
Clientes/{uid}
  acepta_terminos: boolean
  acepta_publicidad: boolean      ← puede desactivar
  acepta_encuestas: boolean       ← puede desactivar
  fecha_aceptacion: timestamp
  version_terminos: string        ← "1.0", "1.1"...
```

---

## Análisis competitivo — TouchTunes vs VIBRRA

### Ventajas de VIBRRA sobre TouchTunes
- **Pujas dinámicas** — más emocionante que el FastPass de precio fijo
- **Sin hardware** — solo PC + Chrome, barrera de entrada casi cero
- **CRM profundo** — segmentos, perfiles de comportamiento, encuestas, campañas
- **Mercado local** — TouchTunes no opera en Colombia

### Brechas identificadas y decisiones

#### 🔴 Críticas — resueltas

**Licenciamiento musical (SAYCO/ACINPRO)**
YouTube Premium NO resuelve esto — es licencia solo para uso personal. La solución: los bares formales en Colombia ya pagan cuota anual de SAYCO/ACINPRO como requisito de funcionamiento. VIBRRA no paga esto — el establecimiento sí. El contrato con el anfitrión debe incluir una cláusula que declare que el bar es responsable de tener sus licencias de música al día. VIBRRA queda blindado legalmente.

**Pagos colombianos — integración única con Wompi**
Una sola API (Wompi de Bancolombia) cubre Nequi, PSE, Botón Bancolombia y tarjetas crédito/débito. La respuesta de procesamiento es automática. Comisión: 2.49% + $900 por transacción. Tiene sandbox completo para pruebas. La reputación de Bancolombia genera confianza en el usuario. Un SDK Flutter lo integra todo.

---

#### 🟡 Features de experiencia social (incluidas)

**Reacciones con emojis a canciones**
Cuando una canción empieza a sonar, todos los conectados pueden enviar reacciones en tiempo real. El que puso la canción las recibe. Viven en Realtime DB (volátiles, no persisten).

```
sesiones/{estId}/reacciones/{cancion_item_id}/
  {auto_id}: { emoji, usuario_id, timestamp }
```

**Leaderboard de la noche**
Visible en la app y opcionalmente en la pantalla del bar. Se calcula en memoria durante la sesión, se persiste en Firestore al cerrar.

```
sesiones/{estId}/leaderboard/
  dj_noche: { usuario_id, canciones_pedidas, total_pujado }
  cancion_mas_pujada: { titulo, artista, monto }
  puja_maxima: { usuario_id, monto, cancion }
```

**Batalla de canciones (votación gratuita)**
El anfitrión puede lanzar una batalla entre 2 canciones. Todos votan gratis. La ganadora entra a la cola con puja = votos × valor_voto (configurable por el anfitrión).

```
sesiones/{estId}/batalla/
  activa: boolean
  cancion_a: { titulo, artista, youtube_video_id, votos }
  cancion_b: { titulo, artista, youtube_video_id, votos }
  expira: timestamp        ← duración configurable (ej. 60 segundos)
  ganadora: null | "a" | "b"
```

**Compartir en redes sociales**
Botón en la app al momento que suena tu canción: genera una tarjeta compartible con el nombre del bar, la canción y el logo VIBRRA para Instagram/WhatsApp Stories. Marketing orgánico gratuito.

```
Stats_Canciones/{vid}
  veces_compartida: number    ← nuevo campo
```

---

#### 🟢 Diferenciadores únicos (nadie los tiene)

**VETO — bloquear una canción**
Pagar para que una canción específica no suene esta noche. Se puede vetar colectivamente (varios usuarios aportan al veto). Si el monto acumulado de vetos supera la puja mayor de esa canción, se elimina de la cola.

```
sesiones/{estId}/cola/{item_id}/
  vetos: { total: number, usuarios: [{ uid, monto }] }
  vetada: boolean           ← si total_vetos > puja_mayor → true → se elimina
```

Reglas:
- El dinero del veto se descuenta del saldo del cliente (igual que una puja)
- Si la canción es vetada, el monto va al anfitrión (incentivo para no bloquear la mecánica)
- El anónimo/cliente que puso la canción NO puede vetar la suya propia

**Canción dedicada con mensaje**
Al agregar una canción a la cola, opción de pagar extra para incluir un mensaje visible en la pantalla del bar y en la app de todos los presentes durante los primeros 15 segundos de reproducción.

```
sesiones/{estId}/cola/{item_id}/
  dedicatoria: {
    mensaje: string           ← máx 80 caracteres
    de: string                ← nombre o alias
    para: string              ← "la mesa 5", "Valentina", etc.
    costo_pagado: number
  }
```

Precio de la dedicatoria: configurable por el anfitrión (`precio_dedicatoria` en `Establecimientos/{id}`).

**DJ set del anfitrión (bloques temáticos)**
El anfitrión puede insertar "bloques" en la cola sin costo. Un bloque es una secuencia de canciones con tema definido que se intercalan respetando las pujas de los clientes.

```
sesiones/{estId}/cola/{item_id}/
  tipo: "anfitrion" | "bono" | "normal" | "bloque"
  bloque_nombre: string     ← "Salsa clásica", "Reggaeton 2020s"
  bloque_id: string         ← agrupa canciones del mismo bloque
```

---

## Playlist previa a llegar (3 fases)

### Fase 1 — Cola personal pendiente ✅ Lanzamiento

El usuario arma su lista desde casa sin saber aún a qué bar va. Al escanear el QR, la app detecta las canciones pendientes y ofrece agregarlas.

**Colección:**
```
Clientes/{uid}/Cola_Pendiente/{id}
  titulo: string
  artista: string
  youtube_video_id: string
  fecha_agregada: timestamp
```

**Flujo:**
```
Casa → busca canciones → "Guardar para después"
    ↓ (llega al bar)
Escanea QR → app detecta cola pendiente
    ↓
"Tienes 4 canciones guardadas ¿las agregas ahora?" [Sí] [No] [Ver lista]
    ↓
Si acepta → puja por cada una (descuenta saldo)
    ↓
Cola_Pendiente se vacía
```

**Reglas:**
- Máximo 10 canciones en cola pendiente
- Al agregar al bar se respeta el `precio_por_cancion` del establecimiento
- Si no tiene saldo suficiente, puede agregar las que alcance y el resto queda pendiente
- Las canciones pendientes no expiran — persisten hasta que las agregue o las elimine

---

### Fase 2 — Playlist por establecimiento favorito

Requiere: establecimientos en favoritos del cliente.

**Colección:**
```
Clientes/{uid}/Playlists/{establecimiento_id}
  nombre: string                    ← "Mi lista del Juernes"
  canciones: [{
    titulo, artista, youtube_video_id, orden
  }]
  ultima_modificacion: timestamp
```

**Flujo:**
```
Casa → abre establecimiento favorito → pestaña "Mi playlist"
    ↓
Agrega canciones, define el orden
    ↓
Llega al bar → escanea QR del mismo establecimiento
    ↓
App detecta playlist para ese bar específico
    ↓
"Tienes tu playlist de 5 canciones lista ¿la enviamos?" [Sí] [No] [Editar]
```

**Ventaja:** genera recurrencia — el cliente vuelve al mismo bar porque ya tiene su lista lista.

---

### Fase 3 — Explorador + playlist antes de conocer el bar

Requiere: mapa de establecimientos VIBRRA (ver siguiente sección).

**Flujo:**
```
Casa → abre mapa → descubre "Bar Vintage Chapinero"
    ↓
Ve perfil del bar: géneros populares, canciones trending, precio de puja
    ↓
Agrega canciones a "Quiero ir aquí"
    ↓
Llega → escanea → playlist lista
```

**Perfil público del establecimiento** (visible sin estar conectado):
```
Establecimientos/{id}/Perfil_Publico
  nombre, ciudad, barrio
  generos_populares: array       ← top 3 de Stats_Canciones
  cancion_trending: string       ← la más pedida esta semana
  precio_conexion_display: string ← "Gratis" | "$X"
  horario: string
  foto_portada_url: string
  total_sesiones_mes: number     ← "activo X noches este mes"
  rating_vibrra: number          ← promedio de NPS de encuestas en ese bar
```

---

## Mapa de establecimientos VIBRRA

Pantalla dentro de la app accesible sin estar en ningún bar.

**Funcionalidades:**
- Mapa interactivo con todos los establecimientos VIBRRA activos
- Filtros: ciudad, barrio, género musical, precio de conexión, activo ahora
- Guardar establecimientos favoritos
- Ver perfil público del bar (géneros, precio, trending)
- Crear playlist antes de ir (Fase 3)
- "Activo ahora" — indicador en tiempo real si hay sesión abierta

**Implementación:**
```
Establecimientos/{id}
  lat: number              ← nuevo campo
  lng: number              ← nuevo campo
  sesion_activa: boolean   ← actualizado por la extensión al abrir/cerrar
  visible_en_mapa: boolean ← el anfitrión puede ocultarse
```

El mapa usa **Google Maps Flutter plugin** — sin backend adicional, consulta Firestore directamente con un query geoespacial o carga todos los establecimientos activos (volumen manejable al inicio).

---

## Campos y colecciones nuevas — resumen de esta sección

**Campos completos en `Establecimientos/{id}`** (versión definitiva con documentación legal):
```
── Identidad ──
barrio, direccion, telefono, qr_imagen_url (nuevos)

── Precios ──
precio_dedicatoria (nuevo)

── Suscripción VIBRRA ──
suscripcion_estado, suscripcion_inicio, suscripcion_proximo_cobro, suscripcion_meses_pagados (nuevos)

── Documentación legal Art. 87 Ley 1801/2016 ──
doc_rut_nit (nuevo)
doc_uso_suelo_estado, doc_licencia_funcionamiento (nuevos)
doc_matricula_mercantil_vigente, doc_matricula_mercantil_vence (nuevos)
doc_bomberos_vigente, doc_bomberos_vence (nuevos)
doc_sanitario_vigente, doc_sanitario_vence (nuevos)
doc_sayco_acinpro_vigente, doc_sayco_acinpro_vence (nuevos — BLOQUEA sesión si false)
doc_licor_vigente, doc_licor_vence (nuevos)
doc_horario_extendido, doc_horario_maxima (nuevos)
docs_estado_general, docs_ultima_verificacion (nuevos)

── Mapa ──
lat, lng, sesion_activa, visible_en_mapa (nuevos)
```

**Nuevos campos en `Sesiones/{id}` (estadísticas):**
```
canciones_compartidas: number
batallas_realizadas: number
canciones_vetadas: number
dedicatorias_enviadas: number
```

**Nuevas colecciones:**
```
Clientes/{uid}/Cola_Pendiente/{id}
Clientes/{uid}/Playlists/{establecimiento_id}
Establecimientos/{id}/Perfil_Publico
Segmentos/{nombre}
Campanas/{id}
Perfiles/{uid}
Eventos/{uid}/stream/{id}
Encuestas/{id}
Encuestas/{id}/Respuestas/{uid}
```

**Nuevos nodos Realtime DB (por sesión):**
```
sesiones/{estId}/reacciones/{item_id}/{auto_id}
sesiones/{estId}/leaderboard/
sesiones/{estId}/batalla/
```
