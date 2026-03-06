# Prompt — UI Movimientos y Liquidación · VIBRRA

## Contexto

Implementa la página de movimientos del anfitrión en React. Esta es su
pantalla financiera principal — donde ve lo que lleva acumulado en el mes,
el preview de su liquidación y el historial completo.

Lee `prompt_modelo_negocio_vibrra.md` antes de implementar.

---

## Lo que el anfitrión necesita ver

```
El anfitrión no tiene saldo para retirar — él PAGA a VIBRRA.
Su métrica principal es cuánto va a QUEDARSE en efectivo este mes.

gananciaEstimada = comisiones_mes + participacion_mes − $15.000
```

---

## Página — `MovimientosPage`

### Estructura del layout

```
<MovimientosPage>
  │
  ├── Topbar sticky
  │     ← Volver  |  "Mi cuenta"
  │
  ├── Card resumen del mes (siempre visible, en tiempo real)
  │     ├── Lo que llevas acumulado este mes
  │     ├── Preview de liquidación
  │     └── Días para el cierre
  │
  ├── TabBar
  │     [Movimientos]  [Liquidación]
  │
  ├── Tab Movimientos
  │     ├── Chips de filtro (Todos · Recargas · Comisiones · Sesión · Liquidación)
  │     └── Lista de MovimientoItem (paginado, 20 por carga)
  │
  └── Tab Liquidación
        └── PantallaLiquidacion (ver spec abajo)

  ── FAB ──────────────────────────────────────────
  "📊 Ver liquidación"
  Solo visible en tab Movimientos
  Al pulsar: activa tab Liquidación
```

---

## Card resumen del mes

```jsx
/**
 * Card siempre visible con el estado financiero del mes en curso.
 * Los datos vienen de onSnapshot en Usuarios/{anfitrionId}.
 * Los valores derivados se calculan en tiempo real, nunca se guardan.
 */
function ResumenMes({ anfitrion }) {
  const gananciaDigital  = anfitrion.comisiones_mes + anfitrion.participacion_mes;
  const gananciaNeta     = gananciaDigital - SUSCRIPCION_MONTO;
  const diasParaCierre   = calcularDiasParaCierre(); // días hasta el día 1

  return (
    <div className="card-resumen">
      <div className="resumen-row">
        <span>Recaudado este mes</span>
        <span className="mono muted">{formatCOP(anfitrion.recaudo_mes)}</span>
      </div>
      <div className="resumen-row">
        <span>Comisiones acumuladas (10%)</span>
        <span className="mono green">+ {formatCOP(anfitrion.comisiones_mes)}</span>
      </div>
      <div className="resumen-row">
        <span>Participación en sesión (70%)</span>
        <span className="mono green">+ {formatCOP(anfitrion.participacion_mes)}</span>
      </div>
      <div className="resumen-row">
        <span>Suscripción</span>
        <span className="mono red">− {formatCOP(SUSCRIPCION_MONTO)}</span>
      </div>
      <hr />
      <div className="resumen-row grande">
        <span>Te quedas este mes</span>
        <span className={`mono ${gananciaNeta >= 0 ? 'gold' : 'red'}`}>
          {formatCOP(gananciaNeta)}
        </span>
      </div>
      <div className="resumen-cierre">
        Liquidación en {diasParaCierre} días
      </div>
    </div>
  );
}
```

---

## Tab Liquidación — `PantallaLiquidacion`

```
┌──────────────────────────────────────────────┐
│  Resumen de liquidación · Marzo 2026         │
│  ──────────────────────────────────────────  │
│  Recaudo (efectivo cobrado)    $1.200.000    │
│  + Suscripción                   + $15.000   │
│  + Deuda mes anterior               + $0     │
│  ──────────────────────────────────────────  │
│  Deuda bruta                   $1.215.000    │
│                                              │
│  Comisiones (10%)              − $120.000    │
│  Participación sesión (70%)    − $504.000    │
│  ──────────────────────────────────────────  │
│  Efectivo que entregas           $591.000    │
│                                              │
│  ══════════════════════════════════════════  │
│  💰 TE QUEDAS ESTE MES          $609.000 ✅  │
│  ══════════════════════════════════════════  │
│                                              │
│  Estado: Pendiente · Cierre el 1 de abril   │
└──────────────────────────────────────────────┘

[Historial de liquidaciones anteriores]
  ✅ Febrero 2026  — te quedaste $510.000
  ✅ Enero 2026    — te quedaste $380.000
  ⚠️ Diciembre 2025 — mora de $45.000
```

```jsx
/**
 * Muestra el preview de liquidación del mes actual y el historial.
 * Los cálculos usan la misma función calcularLiquidacion() del backend.
 * Nunca guardes los valores derivados — calcúlalos en tiempo real.
 */
function PantallaLiquidacion({ anfitrion }) {
  const liq = calcularLiquidacion(anfitrion); // misma lógica que Cloud Function

  return (
    <div>
      <CardLiquidacion liq={liq} anfitrion={anfitrion} />
      <HistorialLiquidaciones anfitrionId={anfitrion.uid} />
    </div>
  );
}
```

---

## Componente MovimientoItem

```jsx
/**
 * Ítem del historial. El chip de categoría es el indicador visual principal.
 * Colores: INGRESO=verde, RECAUDO=azul, LIQUIDACION=dorado, BONO=azul claro
 */
function MovimientoItem({ mov }) {
  const meta = TIPO_META[mov.tipo];

  return (
    <div className="mov-item">
      <div className={`mov-icono bg-${meta.color}`}>{meta.icono}</div>
      <div className="mov-body">
        <span className="mov-titulo">{meta.label}</span>
        <span className="mov-desc">{mov.descripcion}</span>
        <span className="mov-fecha">{formatFecha(mov.timestamp)}</span>
      </div>
      <div className="mov-derecha">
        <span className={`mov-monto ${esIngreso(mov) ? 'plus' : 'minus'}`}>
          {esIngreso(mov) ? '+' : '−'} {formatCOP(mov.monto)}
        </span>
        <span className={`chip-categoria ${mov.categoria.toLowerCase()}`}>
          {labelCategoria(mov.categoria)}
        </span>
      </div>
    </div>
  );
}

function esIngreso(mov) {
  return mov.categoria === 'INGRESO' || mov.categoria === 'BONO';
}
```

---

## Mapa visual de tipos (TIPO_META)

```js
// src/features/movimientos/constants/tipoMeta.js

const TIPO_META = {
  // Recargas
  RECARGA_CLIENTE:        { icono: '🔁', label: 'Recarga a cliente',       color: 'blue'   },
  RECARGA_CLIENTE_BONO:   { icono: '🔁', label: 'Recarga a cliente',       color: 'blue'   },
  // Ingresos
  COMISION_RECARGA:       { icono: '💵', label: 'Comisión de recarga',     color: 'green'  },
  PARTICIPACION_SESION:   { icono: '🎶', label: 'Participación en sesión', color: 'green'  },
  // Bonos
  BONO_ARRANQUE:          { icono: '🎁', label: 'Bono de arranque',        color: 'blue'   },
  AJUSTE_ADMIN:           { icono: '↩️', label: 'Ajuste administrativo',   color: 'muted'  },
  // Liquidación
  LIQUIDACION_COBRO:      { icono: '📋', label: 'Liquidación mensual',     color: 'gold'   },
  LIQUIDACION_SUSCRIPCION:{ icono: '📅', label: 'Suscripción mensual',     color: 'gold'   },
  LIQUIDACION_DEUDA:      { icono: '⚠️', label: 'Deuda generada',          color: 'muted'  },
  LIQUIDACION_MORA:       { icono: '🚨', label: 'Mora',                    color: 'red'    },
};

const LABEL_CATEGORIA = {
  INGRESO:      'ingreso',
  RECAUDO:      'recaudo',
  RECAUDO_BONO: 'bono',
  LIQUIDACION:  'liquidación',
  BONO:         'bono',
  AJUSTE:       'ajuste',
};
```

---

## Chips de filtro

```js
const FILTROS = [
  { id: 'todos',       label: 'Todos',       categorias: null },
  { id: 'recargas',    label: 'Recargas',    categorias: ['RECAUDO', 'RECAUDO_BONO'] },
  { id: 'ingresos',    label: 'Ingresos',    categorias: ['INGRESO'] },
  { id: 'liquidacion', label: 'Liquidación', categorias: ['LIQUIDACION'] },
  { id: 'bonos',       label: 'Bonos',       categorias: ['BONO'] },
];
```

---

## Hook — `useMovimientos`

```js
/**
 * Paginación de movimientos desde Firestore.
 * Carga 20 por vez, ordenados por timestamp DESC.
 * Filtra por categorías si se selecciona un chip.
 *
 * @param {string} anfitrionId
 * @param {string[]} categoriasActivas - null = todos
 */
function useMovimientos(anfitrionId, categoriasActivas) {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ultimo, setUltimo] = useState(null);   // cursor de paginación
  const [hayMas, setHayMas] = useState(true);

  const cargarMas = async () => { ... };  // startAfter(ultimo), limit(20)
  const resetear  = () => { ... };        // limpiar estado al cambiar filtro

  useEffect(() => { resetear(); cargarMas(); }, [categoriasActivas]);

  return { movimientos, loading, hayMas, cargarMas };
}
```

---

## Estructura de archivos

```
src/features/movimientos/
├── constants/
│   └── tipoMeta.js
├── hooks/
│   ├── useMovimientos.js
│   └── useLiquidacion.js        // onSnapshot en Usuarios/{uid}
├── components/
│   ├── ResumenMes.jsx
│   ├── MovimientoItem.jsx
│   ├── FiltrosMovimientos.jsx
│   ├── TabBar.jsx
│   ├── PantallaLiquidacion.jsx
│   ├── CardLiquidacion.jsx
│   └── HistorialLiquidaciones.jsx
└── pages/
    └── MovimientosPage.jsx
```

---

## Paleta de colores

```css
--color-bg:      #070707;
--color-surface: #131313;
--color-gold:    #D4A017;
--color-green:   #00D9A3;
--color-blue:    #60A5FA;
--color-red:     #F87171;
--color-muted:   #555555;
--color-border:  rgba(255,255,255,0.07);
```

---

## Notas de implementación

- **`calcularLiquidacion()`** del backend se duplica en el frontend como helper JS puro. La lógica debe ser idéntica — es la fuente de verdad.
- **El resumen del mes** usa `onSnapshot` para actualizarse en tiempo real cuando el anfitrión recarga un cliente.
- **Formato COP:** `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })`.
- **Paginación Firestore:** `startAfter(ultimoTimestamp)` con `limit(20)`.
- Documenta cada componente y hook con JSDoc.
