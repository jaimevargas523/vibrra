# Prompt — Cloud Functions v2 · VIBRRA

## Contexto

Estás trabajando en **VIBRRA** (React + Node.js + Firebase). Implementa las Cloud
Functions del modelo de negocio. Lee `prompt_modelo_negocio_vibrra.md`
primero para entender el modelo completo antes de escribir código.

Regla crítica: **toda escritura en campos financieros ocurre dentro de una
Firestore transaction.** Sin excepciones.

---

## Constantes del sistema

```js
// functions/constants/negocio.js

/** Comisión que gana el anfitrión por cada recarga que hace a un cliente */
const COMISION_RECARGA = 0.10;          // 10%

/** Participación del anfitrión en el gasto de sus clientes en sesión */
const PARTICIPACION_SESION = 0.70;      // 70%

/** Suscripción mensual fija */
const SUSCRIPCION_MONTO = 15000;

/** Crédito inicial al registrar un anfitrión */
const BONO_ARRANQUE = 30000;

/** Costo extra fijo en modo Generosa */
const COSTO_EXTRA_GENEROSA = 332;

/** Tabla de bonos de acción para clientes por recarga */
const TABLA_BONOS_CLIENTE = {
  minimo:   { pesimista: { canciones: 1, conexiones: 0 }, moderada: { canciones: 1, conexiones: 1 }, generosa: { canciones: 2,  conexiones: 1 } },
  basico:   { pesimista: { canciones: 2, conexiones: 0 }, moderada: { canciones: 2, conexiones: 1 }, generosa: { canciones: 4,  conexiones: 1 } },
  estandar: { pesimista: { canciones: 2, conexiones: 0 }, moderada: { canciones: 3, conexiones: 1 }, generosa: { canciones: 5,  conexiones: 1 } },
  noche:    { pesimista: { canciones: 3, conexiones: 0 }, moderada: { canciones: 4, conexiones: 1 }, generosa: { canciones: 6,  conexiones: 2 } },
  vip:      { pesimista: { canciones: 5, conexiones: 1 }, moderada: { canciones: 8, conexiones: 2 }, generosa: { canciones: 10, conexiones: 3 } },
};

const MONTOS_RECARGA = {
  minimo:   { valor: 2000,  etiqueta: 'Mínimo'   },
  basico:   { valor: 5000,  etiqueta: 'Básico'   },
  estandar: { valor: 10000, etiqueta: 'Estándar' },
  noche:    { valor: 20000, etiqueta: 'Noche'    },
  vip:      { valor: 50000, etiqueta: 'VIP'      },
};
```

---

## Helpers compartidos

```js
// functions/helpers/negocio.js

/**
 * Calcula la comisión del anfitrión por una recarga.
 * @param {number} montoRecarga - Monto recargado al cliente en COP
 * @returns {number} Comisión redondeada
 */
function calcularComision(montoRecarga) {
  return Math.round(montoRecarga * COMISION_RECARGA);
}

/**
 * Calcula la participación del anfitrión en el gasto de un cliente.
 * @param {number} montoGasto - Lo que gastó el cliente en la sesión
 * @returns {number} Participación redondeada
 */
function calcularParticipacion(montoGasto) {
  return Math.round(montoGasto * PARTICIPACION_SESION);
}

/**
 * Calcula el resumen de liquidación mensual del anfitrión.
 * Es la fuente de verdad — se usa en el cron Y en el frontend (preview).
 *
 * @param {object} anf - Datos del anfitrión desde Firestore
 * @returns {{ deudaBruta, gananciaDigital, efectivoAEntregar, efectivoAQuedarse, gananciaNeta, nuevaDeuda }}
 */
function calcularLiquidacion(anf) {
  const gananciaDigital   = anf.comisiones_mes + anf.participacion_mes;
  const deudaBruta        = anf.recaudo_mes + SUSCRIPCION_MONTO + (anf.liquidacion_deuda || 0);
  const efectivoAEntregar = Math.max(0, deudaBruta - gananciaDigital);
  const efectivoAQuedarse = anf.recaudo_mes - efectivoAEntregar;
  const gananciaNeta      = gananciaDigital - SUSCRIPCION_MONTO - (anf.liquidacion_deuda || 0);
  const nuevaDeuda        = Math.max(0, deudaBruta - gananciaDigital - anf.recaudo_mes);

  return { deudaBruta, gananciaDigital, efectivoAEntregar, efectivoAQuedarse, gananciaNeta, nuevaDeuda };
}

/** Retorna el timestamp del próximo día 1 del mes a las 00:00 hora Bogotá */
function proximaLiquidacion() {
  const ahora = new Date();
  return new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1, 0, 0, 0);
}

function formatCOP(valor) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(valor);
}
```

---

## Cloud Function 1 — `registrarAnfitrion`

```js
/**
 * Crea el documento del anfitrión y acredita el bono de arranque ($30.000).
 * Se llama cuando un nuevo anfitrión completa el onboarding.
 *
 * @param {string} anfitrionId - UID de Firebase Auth
 * @param {string} nombreBar   - Nombre del establecimiento
 * @param {string} ciudad      - Ciudad del bar
 */
exports.registrarAnfitrion = functions.https.onCall(async (data, context) => {
  const { anfitrionId, nombreBar, ciudad } = data;

  const refAnf = db.collection('Usuarios').doc(anfitrionId);
  const refMov = db.collection('Movimientos').doc();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(refAnf);
    if (snap.exists) throw new functions.https.HttpsError('already-exists', 'Ya registrado.');

    const ahora = admin.firestore.FieldValue.serverTimestamp();

    tx.set(refAnf, {
      tipo:                'anfitrion',
      nombre_bar:          nombreBar,
      ciudad:              ciudad,
      recaudo_mes:         0,
      comisiones_mes:      0,
      participacion_mes:   0,
      bono_arranque_saldo: BONO_ARRANQUE,
      bono_arranque_usado: 0,
      suscripcion_activa:  true,
      suscripcion_monto:   SUSCRIPCION_MONTO,
      liquidacion_estado:  'pendiente',
      liquidacion_fecha:   proximaLiquidacion(),
      liquidacion_deuda:   0,
      fecha_registro:      ahora,
      ultimo_acceso:       ahora,
    });

    tx.set(refMov, {
      anfitrion_id:       anfitrionId,
      cliente_id:         null, sesion_id: null,
      tipo:               'BONO_ARRANQUE',
      categoria:          'BONO',
      monto:              BONO_ARRANQUE,
      comision:           0, participacion: 0,
      recaudo_post:       0, comisiones_post: 0, participacion_post: 0,
      descripcion:        'Bono de arranque VIBRRA — crédito inicial para operar',
      timestamp:          ahora,
      creado_por:         'sistema',
    });
  });

  return { ok: true, bonoAcreditado: BONO_ARRANQUE };
});
```

---

## Cloud Function 2 — `recargarCliente`

```js
/**
 * Anfitrión recarga saldo digital a un cliente escaneando su QR.
 * El anfitrión cobra el efectivo físicamente en el bar.
 * VIBRRA emite el saldo digital y registra el recaudo y la comisión.
 *
 * Prioridad de cobertura:
 *   1. bono_arranque_saldo (si hay disponible)
 *   2. Crédito VIBRRA (ilimitado — deuda crece en recaudo_mes)
 *
 * @param {string} anfitrionId
 * @param {string} clienteId   - UID leído del QR
 * @param {string} montoId     - 'minimo' | 'basico' | 'estandar' | 'noche' | 'vip'
 * @param {string} modoId      - 'pesimista' | 'moderada' | 'generosa'
 */
exports.recargarCliente = functions.https.onCall(async (data, context) => {
  const { anfitrionId, clienteId, montoId, modoId } = data;

  const montoObj   = MONTOS_RECARGA[montoId];
  const extra      = modoId === 'generosa' ? COSTO_EXTRA_GENEROSA : 0;
  const montoTotal = montoObj.valor + extra;
  const bonos      = TABLA_BONOS_CLIENTE[montoId][modoId];
  const comision   = calcularComision(montoTotal);

  const refAnf      = db.collection('Usuarios').doc(anfitrionId);
  const refCli      = db.collection('Usuarios').doc(clienteId);
  const refMovRec   = db.collection('Movimientos').doc();
  const refMovCom   = db.collection('Movimientos').doc();

  await db.runTransaction(async (tx) => {
    const [snapAnf, snapCli] = await Promise.all([tx.get(refAnf), tx.get(refCli)]);
    const anf = snapAnf.data();
    const cli = snapCli.data() || {};

    // Determinar fuente de cobertura
    const bonoDisponible = anf.bono_arranque_saldo || 0;
    const desdeBono      = Math.min(bonoDisponible, montoTotal);
    const tipoRecarga    = desdeBono === montoTotal ? 'RECARGA_CLIENTE_BONO' : 'RECARGA_CLIENTE';
    const categoriaRec   = desdeBono === montoTotal ? 'RECAUDO_BONO' : 'RECAUDO';

    const nuevoRecaudo     = anf.recaudo_mes + montoTotal;
    const nuevasComisiones = anf.comisiones_mes + comision;
    const nuevoBonoSaldo   = anf.bono_arranque_saldo - desdeBono;
    const nuevoBonoUsado   = anf.bono_arranque_usado + desdeBono;

    const ahora = admin.firestore.FieldValue.serverTimestamp();

    // Actualizar anfitrión
    tx.update(refAnf, {
      recaudo_mes:         nuevoRecaudo,
      comisiones_mes:      nuevasComisiones,
      bono_arranque_saldo: nuevoBonoSaldo,
      bono_arranque_usado: nuevoBonoUsado,
    });

    // Actualizar cliente — saldo universal + bonos de acción
    tx.set(refCli, {
      tipo:             'cliente',
      saldo:            (cli.saldo || 0) + montoObj.valor,
      bonos_canciones:  (cli.bonos_canciones || 0) + bonos.canciones,
      bonos_conexiones: (cli.bonos_conexiones || 0) + bonos.conexiones,
      ultima_sesion_id: null,
      fecha_registro:   cli.fecha_registro || ahora,
    }, { merge: true });

    const base = {
      anfitrion_id:       anfitrionId,
      cliente_id:         clienteId,
      sesion_id:          null,
      timestamp:          ahora,
      creado_por:         'cloud_function',
      recaudo_post:       nuevoRecaudo,
      comisiones_post:    nuevasComisiones,
      participacion_post: anf.participacion_mes,
    };

    // Movimiento — recarga
    tx.set(refMovRec, {
      ...base,
      tipo:         tipoRecarga,
      categoria:    categoriaRec,
      monto:        montoTotal,
      comision:     0,
      participacion: 0,
      descripcion:  `Recarga ···${clienteId.slice(-4).toUpperCase()} · ${montoObj.etiqueta} · Modo ${modoId} · 🎵×${bonos.canciones} 🔌×${bonos.conexiones}`,
    });

    // Movimiento — comisión
    tx.set(refMovCom, {
      ...base,
      tipo:         'COMISION_RECARGA',
      categoria:    'INGRESO',
      monto:        comision,
      comision:     comision,
      participacion: 0,
      descripcion:  `Comisión 10% sobre recarga de ${formatCOP(montoTotal)}`,
    });
  });

  return { ok: true, comisionAcumulada: comision };
});
```

---

## Cloud Function 3 — `registrarGastoSesion`

```js
/**
 * Registra el gasto de un cliente en sesión y acumula la participación del anfitrión.
 * Se dispara en cada puja, nominación, conexión, veto o dedicatoria.
 *
 * @param {string} anfitrionId  - Dueño de la sesión activa
 * @param {string} clienteId    - Cliente que está gastando
 * @param {string} sesionId     - ID de la sesión activa
 * @param {number} monto        - Monto que gasta el cliente
 * @param {string} concepto     - 'PUJA' | 'NOMINACION' | 'CONEXION' | 'VETO' | 'DEDICATORIA'
 */
exports.registrarGastoSesion = functions.https.onCall(async (data, context) => {
  const { anfitrionId, clienteId, sesionId, monto, concepto } = data;

  const participacion = calcularParticipacion(monto);

  const refAnf = db.collection('Usuarios').doc(anfitrionId);
  const refCli = db.collection('Usuarios').doc(clienteId);
  const refMov = db.collection('Movimientos').doc();

  await db.runTransaction(async (tx) => {
    const [snapAnf, snapCli] = await Promise.all([tx.get(refAnf), tx.get(refCli)]);
    const anf = snapAnf.data();
    const cli = snapCli.data();

    if ((cli.saldo || 0) < monto) {
      throw new functions.https.HttpsError('failed-precondition', 'Saldo insuficiente.');
    }

    const nuevaParticipacion = anf.participacion_mes + participacion;
    const ahora = admin.firestore.FieldValue.serverTimestamp();

    tx.update(refCli, { saldo: cli.saldo - monto, ultima_sesion_id: sesionId });
    tx.update(refAnf, { participacion_mes: nuevaParticipacion });

    tx.set(refMov, {
      anfitrion_id:       anfitrionId,
      cliente_id:         clienteId,
      sesion_id:          sesionId,
      tipo:               'PARTICIPACION_SESION',
      categoria:          'INGRESO',
      monto:              monto,
      comision:           0,
      participacion:      participacion,
      recaudo_post:       anf.recaudo_mes,
      comisiones_post:    anf.comisiones_mes,
      participacion_post: nuevaParticipacion,
      descripcion:        `${concepto} · ···${clienteId.slice(-4).toUpperCase()} · sesión ${sesionId}`,
      timestamp:          ahora,
      creado_por:         'cloud_function',
    });
  });

  return { ok: true, participacionAcumulada: participacion };
});
```

---

## Cloud Function 4 — `cerrarLiquidacionMensual` (cron)

```js
/**
 * Cron — día 1 de cada mes · 00:00 hora Bogotá.
 * Por cada anfitrión activo calcula y cierra la liquidación del mes.
 *
 * Lógica por anfitrión:
 *   gananciaDigital   = comisiones_mes + participacion_mes
 *   deudaBruta        = recaudo_mes + $15.000 + deuda_anterior
 *   efectivoAEntregar = deudaBruta − gananciaDigital  (mínimo 0)
 *   efectivoAQuedarse = recaudo_mes − efectivoAEntregar
 *   nuevaDeuda        = max(0, deudaBruta − gananciaDigital − recaudo_mes)
 *
 *   Si nuevaDeuda > 0 → estado 'mora', arrastra al mes siguiente
 *   Si no → estado 'pagado'
 *   Resetea todos los acumulados a 0
 */
exports.cerrarLiquidacionMensual = functions.pubsub
  .schedule('0 0 1 * *')
  .timeZone('America/Bogota')
  .onRun(async () => {
    const anfitriones = await db.collection('Usuarios')
      .where('tipo', '==', 'anfitrion')
      .where('suscripcion_activa', '==', true)
      .get();

    for (const doc of anfitriones.docs) {
      try {
        await procesarLiquidacion(doc);
      } catch (e) {
        console.error(`Error liquidando ${doc.id}:`, e);
      }
    }
  });

async function procesarLiquidacion(doc) {
  const ref = doc.ref;

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const anf  = snap.data();
    const ahora = admin.firestore.FieldValue.serverTimestamp();

    const { deudaBruta, gananciaDigital, efectivoAEntregar, efectivoAQuedarse, gananciaNeta, nuevaDeuda } = calcularLiquidacion(anf);

    // Actualizar anfitrión — resetear mes y registrar estado
    tx.update(ref, {
      recaudo_mes:        0,
      comisiones_mes:     0,
      participacion_mes:  0,
      liquidacion_estado:  nuevaDeuda > 0 ? 'mora' : 'pagado',
      liquidacion_deuda:   nuevaDeuda,
      liquidacion_fecha:   proximaLiquidacion(),
      suscripcion_activa:  nuevaDeuda < SUSCRIPCION_MONTO * 2, // suspender si debe >2 meses
    });

    const base = {
      anfitrion_id:       doc.id,
      cliente_id:         null, sesion_id: null,
      timestamp:          ahora, creado_por: 'sistema',
      recaudo_post:       0, comisiones_post: 0, participacion_post: 0,
    };

    // Movimiento principal — resumen liquidación
    tx.set(db.collection('Movimientos').doc(), {
      ...base,
      tipo:         'LIQUIDACION_COBRO',
      categoria:    'LIQUIDACION',
      monto:        efectivoAEntregar,
      comision:     0, participacion: 0,
      descripcion:  `Liquidación mensual · Recaudo: ${formatCOP(anf.recaudo_mes)} · Ganancias: ${formatCOP(gananciaDigital)} · Entrega: ${formatCOP(efectivoAEntregar)} · Se queda: ${formatCOP(efectivoAQuedarse)}`,
    });

    // Movimiento — suscripción
    tx.set(db.collection('Movimientos').doc(), {
      ...base,
      tipo:         'LIQUIDACION_SUSCRIPCION',
      categoria:    'LIQUIDACION',
      monto:        SUSCRIPCION_MONTO,
      comision:     0, participacion: 0,
      descripcion:  'Suscripción mensual VIBRRA',
    });

    // Movimiento — mora si aplica
    if (nuevaDeuda > 0) {
      tx.set(db.collection('Movimientos').doc(), {
        ...base,
        tipo:         'LIQUIDACION_DEUDA',
        categoria:    'LIQUIDACION',
        monto:        nuevaDeuda,
        comision:     0, participacion: 0,
        descripcion:  `Deuda arrastrada al mes siguiente: ${formatCOP(nuevaDeuda)}`,
      });
    }
  });
}
```

---

## Estructura de archivos

```
functions/
├── constants/
│   └── negocio.js              // todas las constantes del sistema
├── helpers/
│   └── negocio.js              // calcularComision, calcularParticipacion, calcularLiquidacion
├── registrarAnfitrion.js
├── recargarCliente.js
├── registrarGastoSesion.js
├── cerrarLiquidacionMensual.js
└── index.js                    // exporta todas las functions
```

---

## Notas críticas

1. **Toda modificación de campos financieros ocurre en `runTransaction`.**
2. **`calcularLiquidacion()` es la fuente de verdad** — se usa en el cron Y en el frontend para mostrar el preview. Nunca duplicar esa lógica.
3. **Los movimientos son inmutables.** Errores se corrigen con `AJUSTE_ADMIN`.
4. **El cron usa `America/Bogota`** — sin esto corre a las 5am hora Colombia.
5. **`registrarGastoSesion` se llama en cada acción del cliente** — debe ser rápida.
6. **El bono de arranque cubre las primeras recargas** — cuando se agota, el crédito es ilimitado y se acumula en `recaudo_mes`.
7. Documenta todo con JSDoc.
