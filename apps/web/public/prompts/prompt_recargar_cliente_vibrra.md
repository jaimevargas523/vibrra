# Prompt — Pantalla de recarga del anfitrión · VIBRRA

## Contexto

Implementa la pantalla `RecargarClientePage` en React. El anfitrión escanea el
QR del cliente, selecciona el monto y el modo de generosidad, y recarga su saldo.

Lee `prompt_modelo_negocio_vibrra.md` antes de implementar.

**Punto clave del modelo:** el anfitrión NO paga de su bolsillo — cobra efectivo
al cliente en el bar y VIBRRA emite el saldo digital. La pantalla debe transmitir
esa lógica: el anfitrión está *regalando experiencia*, no gastando dinero propio.

---

## Lo que el anfitrión ve en esta pantalla

```
Tu recaudo del mes: $1.200.000    ← lo que ha cobrado en efectivo
Tu comisión (10%):    $120.000    ← lo que ha ganado digitalmente

[Selecciona monto]  [Selecciona modo]  [Escanear QR]
```

La métrica principal es **su comisión acumulada**, no un saldo que se agota.

---

## Estructura del layout

```
<RecargarClientePage>
  │
  ├── Topbar sticky
  │     ← Volver   |   "Recargar cliente"   |   Comisión: $120.000 ←
  │
  ├── Card estado del mes (compacta)
  │     Recaudo mes: $1.200.000  ·  Comisión acumulada: $120.000
  │     Bono disponible: $0 (si hay bono de arranque, mostrarlo)
  │
  ├── Sección 1 — "① Monto a recargar"
  │     Grid 3 cols · TarjetaMonto × 5
  │
  ├── Sección 2 — "② ¿Qué tan generoso?"
  │     Row de 3 · TarjetaModo
  │     Nota naranja si modo === 'generosa' (+$332)
  │
  ├── TablaBonificacion (colapsable)
  │     Tabla monto × modo · canciones y conexiones
  │
  ├── ResumenRecarga (siempre visible, reactivo)
  │     Monto al cliente · Canciones · Conexiones · Tu comisión por esta recarga
  │
  └── [espacio para botón sticky]

  ── Sticky bottom ──────────────────────────────
  "📷 Escanear QR del cliente"
  deshabilitado si !montoSeleccionado || !modoSeleccionado

<ModalEscanerQR open={status === 'scanning'} />
<ModalExito     open={status === 'success'}  />
```

---

## Diferencias clave vs. el modelo anterior

| Antes | Ahora |
|---|---|
| Topbar mostraba "Tu saldo: $X" | Topbar muestra "Comisión: $X" |
| Tarjetas deshabilitadas si no hay saldo | Tarjetas **siempre habilitadas** (crédito ilimitado) |
| Lógica de mínimo bloqueado | No existe — el anfitrión opera con crédito VIBRRA |
| El anfitrión "gastaba" | El anfitrión "recauda" |

---

## ResumenRecarga — lo que cambia

```jsx
/**
 * El resumen ahora muestra la GANANCIA del anfitrión, no lo que "gasta".
 */
function ResumenRecarga({ monto, modo, comisionAcumulada }) {
  if (!monto || !modo) return null;

  const extra         = modo.id === 'generosa' ? 332 : 0;
  const montoTotal    = monto.valor + extra;
  const comisionEsta  = Math.round(montoTotal * 0.10);
  const bonos         = TABLA_BONOS[monto.id][modo.id];

  return (
    <div className="card">
      <Row label="Saldo que recibe el cliente" value={formatCOP(monto.valor)} color="blue" />
      <Row label="🎵 Canciones gratis"         value={`×${bonos.canciones}`}  color="blue" />
      <Row label="🔌 Conexiones gratis"        value={`×${bonos.conexiones}`} color="blue" hide={bonos.conexiones === 0} />
      {extra > 0 && <Row label="Extra modo Generosa" value={formatCOP(extra)} color="orange" />}
      <hr />
      {/* La métrica más importante para el anfitrión */}
      <Row label="💵 Tu comisión por esta recarga" value={`+ ${formatCOP(comisionEsta)}`} color="green" bold />
      <Row label="Total comisión acumulada"         value={formatCOP(comisionAcumulada + comisionEsta)} color="muted" />
    </div>
  );
}
```

---

## ModalExito — también cambia el mensaje

```
ANTES: "💰 Saldo acreditado: $10.000"
AHORA: 
  ✓ Recarga exitosa
  Cliente ···4827 recibió $10.000 + 🎵×3 🔌×1
  ─────────────────────────────────────────────
  💵 Tu comisión: + $1.000
  📊 Comisión acumulada: $121.000
  📦 Recaudo del mes: $1.210.000
```

---

## Hook — `useRecargarCliente`

```js
/**
 * Estado y lógica de la pantalla de recarga.
 * Ya no maneja saldo — maneja recaudo y comisión.
 *
 * @param {object} anfitrion - Datos del anfitrión desde Firestore (onSnapshot)
 */
function useRecargarCliente(anfitrion) {
  const [montoSeleccionado, setMontoSeleccionado] = useState(null);
  const [modoSeleccionado,  setModoSeleccionado]  = useState(null);
  const [status,  setStatus]  = useState('idle'); // 'idle'|'scanning'|'processing'|'success'|'error'
  const [resultado, setResultado] = useState(null);

  // Derivados
  const extra        = modoSeleccionado?.id === 'generosa' ? 332 : 0;
  const montoTotal   = (montoSeleccionado?.valor || 0) + extra;
  const comisionEsta = Math.round(montoTotal * 0.10);
  const bonosActuales = montoSeleccionado && modoSeleccionado
    ? TABLA_BONOS[montoSeleccionado.id][modoSeleccionado.id]
    : null;

  // Las tarjetas NUNCA se deshabilitan — crédito ilimitado
  const puedeEscanear = montoSeleccionado !== null && modoSeleccionado !== null;

  const onQrDecodificado = async (clienteId) => {
    setStatus('processing');
    try {
      const result = await recargarClienteFn({ // Cloud Function
        anfitrionId: anfitrion.uid,
        clienteId,
        montoId: montoSeleccionado.id,
        modoId:  modoSeleccionado.id,
      });
      setResultado({ clienteId, comisionAcreditada: result.comisionAcumulada });
      setStatus('success');
    } catch (e) {
      setStatus('error');
    }
  };

  const reiniciar = () => {
    setMontoSeleccionado(null);
    setModoSeleccionado(null);
    setStatus('idle');
    setResultado(null);
  };

  return {
    montoSeleccionado, modoSeleccionado, status, resultado,
    comisionEsta, bonosActuales, puedeEscanear,
    seleccionarMonto: setMontoSeleccionado,
    seleccionarModo:  setModoSeleccionado,
    iniciarEscaneo:   () => setStatus('scanning'),
    cancelarEscaneo:  () => setStatus('idle'),
    onQrDecodificado,
    reiniciar,
  };
}
```

---

## Estructura de archivos

```
src/features/recarga-cliente/
├── constants/
│   └── tablaBonos.js
├── hooks/
│   └── useRecargarCliente.js
├── components/
│   ├── CardEstadoMes.jsx       // recaudo + comisión acumulada
│   ├── TarjetaMonto.jsx        // siempre habilitada
│   ├── TarjetaModo.jsx
│   ├── TablaBonificacion.jsx
│   ├── ResumenRecarga.jsx      // muestra comisión, no "gasto"
│   ├── ModalEscanerQR.jsx
│   └── ModalExito.jsx          // muestra comisión ganada
└── pages/
    └── RecargarClientePage.jsx
```

---

## Paleta

```css
--color-bg:      #070707;
--color-surface: #131313;
--color-gold:    #D4A017;
--color-gold-lt: #FFE566;
--color-green:   #00D9A3;
--color-blue:    #60A5FA;
--color-orange:  #FF8F00;
--color-muted:   #555555;
--color-border:  rgba(255,255,255,0.07);
```

## Notas de implementación

- **Las tarjetas de monto siempre están activas** — el anfitrión opera con crédito ilimitado de VIBRRA. Elimina toda lógica de saldo mínimo o tarjetas deshabilitadas.
- **El topbar muestra la comisión acumulada**, no un saldo. Es la métrica que motiva al anfitrión a seguir recargando.
- **El saldo del anfitrión no se toca** — la recarga crea una deuda en `recaudo_mes` que se liquida a fin de mes.
- Formato COP: `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })`.
- Documenta todo con JSDoc.
