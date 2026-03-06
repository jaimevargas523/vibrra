# Prompt — Modelo de negocio y esquema de datos · VIBRRA

## Visión del modelo

VIBRRA es una plataforma de jukebox digital para bares. El anfitrión (dueño
o administrador del bar) opera como socio comercial de VIBRRA — no como cliente.
Su éxito depende directamente del empeño que le ponga a la herramienta.

---

## Los tres actores y su rol

```
VIBRRA
  └── Emite saldo digital a los clientes del bar
  └── Registra todas las operaciones en Firestore
  └── Cobra a fin de mes

ANFITRIÓN
  └── Recarga clientes (cobra efectivo, entrega saldo digital)
  └── Gana comisión por cada recarga
  └── Gana 70% de lo que sus clientes gasten en sesión
  └── Paga a VIBRRA a fin de mes: recaudo + suscripción

CLIENTE
  └── Paga efectivo al anfitrión
  └── Recibe saldo digital universal (válido en cualquier bar VIBRRA)
  └── Usa ese saldo para pujar, nominar, conectarse, vetar canciones
```

---

## Fuentes de ingreso del anfitrión

```
1. COMISIÓN POR RECARGA — 10% sobre cada recarga que hace a clientes
   Ejemplo: recarga $10.000 → gana $1.000 digital

2. PARTICIPACIÓN EN SESIÓN — 70% de lo que sus clientes gasten en su bar
   Ejemplo: clientes gastan $50.000 en pujas → gana $35.000 digital

Ambos ingresos se acumulan digitalmente en su cuenta VIBRRA durante el mes.
```

---

## Liquidación a fin de mes

```
Lo que el anfitrión debe a VIBRRA:
  Recaudo total (efectivo cobrado a clientes)     variable
  Suscripción mensual                            + $15.000
  ─────────────────────────────────────────────────────────
  Total deuda bruta                               variable

Lo que se descuenta automáticamente:
  Comisiones acumuladas (10% recargas)           − variable
  Participación sesión (70% gasto clientes)      − variable
  ─────────────────────────────────────────────────────────
  Efectivo neto que entrega al mensajero VIBRRA   variable

Lo que el anfitrión se queda en efectivo:
  = Recaudo cobrado − Efectivo neto entregado
  = Sus ganancias digitales − $15.000 suscripción
```

### Ejemplo concreto — bar medio

```
Recargó a 240 clientes × $5.000 = $1.200.000 recaudado

Ganancias digitales:
  Comisión 10%:                   $120.000
  70% gasto sesión (240×$3.000):  $504.000
  Total digital:                  $624.000

Liquidación:
  Debe a VIBRRA:    $1.200.000 + $15.000 = $1.215.000
  Descuenta:                              − $624.000
  ─────────────────────────────────────────────────────
  Entrega en cash:                          $591.000
  Se queda en cash:   $1.200.000 − $591.000 = $609.000 ✅
```

---

## Bono de arranque

```
Al registrarse como anfitrión VIBRRA otorga $30.000 de crédito inicial.
Este crédito cubre las primeras recargas a clientes.
No es retirable. Se descuenta en la primera liquidación.
Permite que el anfitrión opere desde el día 1 sin poner capital propio.
```

---

## El saldo del cliente es universal

```
El saldo digital que recibe el cliente NO está atado al bar donde recargó.
Puede gastarlo en cualquier bar de la red VIBRRA.

Esto es una decisión de producto deliberada:
  ✅ Mejor experiencia para el cliente
  ✅ El anfitrión igual gana su 10% de comisión al recargar
  ✅ El 70% de sesión protege que el gasto en su bar le beneficie
  ✅ Incentiva al anfitrión a tener el bar con la mejor sesión posible
```

---

## Control del recaudo — por qué el sistema es auditable

```
El anfitrión no puede declarar menos de lo que cobró porque:

  VIBRRA emite saldo digital por cada recarga → queda en Firestore ✅
  recaudo_mes = Σ(todas las recargas del anfitrión en el mes)

  Este número lo calcula el sistema, no el anfitrión.
  Es imposible técnicamente recargar sin que VIBRRA lo registre.
```

---

## Esquema Firestore

### `Usuarios/{anfitrionId}` — documento del anfitrión

```js
{
  tipo: 'anfitrion',

  // ── Acumulados del mes en curso ────────────────────────
  recaudo_mes:           1200000,  // Σ recargas que hizo a clientes (lo que debe)
  comisiones_mes:         120000,  // 10% de recaudo_mes (se acumula en tiempo real)
  participacion_mes:      504000,  // 70% del gasto de clientes en su sesión
  credito_bono_usado:      30000,  // bono inicial consumido (solo mes 1)

  // ── Suscripción ─────────────────────────────────────────
  suscripcion_activa:       true,
  suscripcion_monto:       15000,

  // ── Liquidación ─────────────────────────────────────────
  liquidacion_estado:  'pendiente', // 'pendiente' | 'pagado' | 'mora'
  liquidacion_fecha:    Timestamp,  // fecha del próximo cierre
  liquidacion_deuda:         0,     // arrastre de meses anteriores

  // ── Bono de arranque ────────────────────────────────────
  bono_arranque_saldo:    30000,    // crédito disponible para recargas
  bono_arranque_usado:        0,    // acumulado consumido

  // ── Metadatos ───────────────────────────────────────────
  nombre_bar:        'Bar El Parche',
  ciudad:            'Manizales',
  fecha_registro:     Timestamp,
  ultimo_acceso:      Timestamp,
}
```

### `Usuarios/{clienteId}` — documento del cliente

```js
{
  tipo: 'cliente',

  // Saldo universal — válido en cualquier bar VIBRRA
  saldo:              25000,   // saldo gastable en pujas/nominaciones/conexiones

  // Bonos de acción (otorgados por anfitriones al recargar)
  bonos_canciones:        3,   // nominaciones gratuitas disponibles
  bonos_conexiones:       1,   // accesos gratuitos a sesión

  // Trazabilidad
  ultima_sesion_id:  'sesion_abc',
  fecha_registro:     Timestamp,
}
```

### `Movimientos/{movimientoId}` — libro mayor

```js
{
  // Identificación
  anfitrion_id:   'uid',           // siempre presente
  cliente_id:     'uid' | null,    // si aplica
  sesion_id:      'id'  | null,    // si aplica
  tipo:           'RECARGA_CLIENTE',  // ver catálogo abajo
  categoria:      'RECAUDO',          // ver categorías abajo

  // Montos
  monto:          10000,   // valor de la operación en COP
  comision:        1000,   // 10% si es recarga, 0 si no aplica
  participacion:      0,   // 70% si es gasto de sesión, 0 si no aplica

  // Snapshot de acumulados del anfitrión DESPUÉS de esta operación
  recaudo_post:        1200000,
  comisiones_post:      120000,
  participacion_post:   504000,

  // Trazabilidad
  descripcion:    'Recarga cliente V·4827 · Modo Moderada',
  timestamp:       Timestamp,
  creado_por:     'cloud_function' | 'sistema' | 'admin',
}
```

---

## Catálogo de tipos de movimiento

### Operaciones de recarga

| `tipo` | `categoria` | Descripción |
|---|---|---|
| `RECARGA_CLIENTE` | `RECAUDO` | Anfitrión recargó saldo a un cliente |
| `RECARGA_CLIENTE_BONO` | `RECAUDO_BONO` | Recarga cubierta con bono de arranque |

### Ingresos del anfitrión (digitales)

| `tipo` | `categoria` | Descripción |
|---|---|---|
| `COMISION_RECARGA` | `INGRESO` | 10% automático sobre cada recarga |
| `PARTICIPACION_SESION` | `INGRESO` | 70% del gasto de clientes en sesión |

### Liquidación mensual

| `tipo` | `categoria` | Descripción |
|---|---|---|
| `LIQUIDACION_COBRO` | `LIQUIDACION` | Cobro mensual a VIBRRA (efectivo) |
| `LIQUIDACION_DESCUENTO` | `LIQUIDACION` | Descuento de ganancias digitales |
| `LIQUIDACION_SUSCRIPCION` | `LIQUIDACION` | $15.000 de suscripción |
| `LIQUIDACION_DEUDA` | `LIQUIDACION` | Deuda generada por cobro parcial |
| `LIQUIDACION_MORA` | `INFORMATIVO` | Registro de mora |

### Ajustes y bonos

| `tipo` | `categoria` | Descripción |
|---|---|---|
| `BONO_ARRANQUE` | `BONO` | $30.000 crédito inicial al registrarse |
| `AJUSTE_ADMIN` | `AJUSTE` | Corrección manual por equipo VIBRRA |

---

## Valores derivados — calcular en tiempo real, nunca guardar

```js
// Estos valores se calculan en el frontend o en la Cloud Function
// NUNCA se almacenan en Firestore como campos independientes

const gananciaDigital    = comisiones_mes + participacion_mes;
const deudaBruta         = recaudo_mes + suscripcion_monto + liquidacion_deuda;
const efectivoAEntregar  = Math.max(0, deudaBruta - gananciaDigital);
const efectivoAQuedarse  = recaudo_mes - efectivoAEntregar;
const gananciaNeta       = gananciaDigital - suscripcion_monto - liquidacion_deuda;
```

---

## Proyección de ganancias por escenario

```
                    PEQUEÑO      MEDIO        GRANDE
Noches/mes:            8           12            20
Clientes/noche:       10           20            30
Recarga promedio:  $3.000       $5.000        $8.000
Gasto sesión:      $2.000       $3.000        $5.000
─────────────────────────────────────────────────────
Ganancia mes 1:   $121.000     $609.000    $2.565.000
Ganancia 6 meses: $605.000   $3.045.000   $12.825.000
Ganancia año 1: $1.440.000   $7.263.300   $30.573.900
(con crecimiento orgánico 15% a partir del mes 7)
```

---

## Reglas de seguridad Firestore

```
Los siguientes campos son de escritura exclusiva para Cloud Functions:
  - recaudo_mes
  - comisiones_mes
  - participacion_mes
  - bono_arranque_saldo
  - liquidacion_estado
  - liquidacion_deuda
  - suscripcion_activa
  - saldo (en documentos de clientes)

El cliente nunca puede modificar estos campos directamente.
```
