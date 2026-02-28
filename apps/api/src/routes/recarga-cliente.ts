import { Router } from "express";
import { adminDb } from "../config/firebase-admin.js";
import { FieldValue } from "firebase-admin/firestore";
import { getPaisConfig } from "./mi-pais.js";

const router = Router();

/**
 * POST /recarga-cliente/transferir
 * Transfiere saldo del anfitrion al cliente dentro de una Firestore transaction.
 * Reads montos, bonos, fees from Paises/{code} config.
 */
router.post("/transferir", async (req, res) => {
  try {
    const anfitrionId = req.uid!;
    const { clienteId, montoId, modoId } = req.body as {
      clienteId: string;
      montoId: string;
      modoId: string;
    };

    // Validate inputs
    if (!clienteId || !montoId || !modoId) {
      res.status(400).json({ error: "Faltan campos requeridos: clienteId, montoId, modoId." });
      return;
    }

    // Get host's country config
    const db = adminDb();
    const anfitrionRef = db.collection("Anfitriones").doc(anfitrionId);
    const anfitrionPreSnap = await anfitrionRef.get();
    if (!anfitrionPreSnap.exists) {
      res.status(404).json({ error: "Anfitrion no encontrado." });
      return;
    }

    const paisCode = anfitrionPreSnap.data()!.pais ?? "CO";
    const paisConfig = await getPaisConfig(paisCode);
    if (!paisConfig) {
      res.status(500).json({ error: `Configuracion de pais no encontrada: ${paisCode}` });
      return;
    }

    const { recarga } = paisConfig;

    // Find monto by id
    const monto = recarga.montos.find((m: { id: string; valor: number; etiqueta: string }) => m.id === montoId);
    if (!monto) {
      res.status(400).json({ error: `Monto invalido: ${montoId}` });
      return;
    }

    const bonos = recarga.tablaBonos[montoId]?.[modoId];
    if (!bonos) {
      res.status(400).json({ error: `Modo invalido: ${modoId}` });
      return;
    }

    const costoTotal = monto.valor + (modoId === "generosa" ? recarga.costoExtraGenerosa : 0);
    const clienteRef = db.collection("Usuarios").doc(clienteId);

    const resultado = await db.runTransaction(async (tx) => {
      const anfitrionSnap = await tx.get(anfitrionRef);
      if (!anfitrionSnap.exists) {
        throw new Error("Anfitrion no encontrado.");
      }

      const anfitrionData = anfitrionSnap.data()!;
      const saldoActual = (anfitrionData.saldoReal ?? 0) + (anfitrionData.saldoBono ?? 0);

      if (saldoActual - recarga.minimoBloqueado < costoTotal) {
        const symbol = paisConfig.moneda.symbol;
        const min = recarga.minimoBloqueado.toLocaleString();
        throw new Error(`Saldo insuficiente. Debes mantener un minimo de ${symbol}${min} en tu cuenta.`);
      }

      const clienteSnap = await tx.get(clienteRef);
      const clienteData = clienteSnap.exists ? clienteSnap.data()! : {};
      const clienteNombre = clienteData.nombre ?? clienteData.displayName ?? "Cliente";

      // Deduct from host (prefer saldoReal first)
      const saldoReal = anfitrionData.saldoReal ?? 0;
      let descuentoReal = Math.min(saldoReal, costoTotal);
      let descuentoBono = costoTotal - descuentoReal;

      tx.update(anfitrionRef, {
        saldoReal: FieldValue.increment(-descuentoReal),
        saldoBono: FieldValue.increment(-descuentoBono),
      });

      // Credit client
      tx.set(
        clienteRef,
        {
          saldo: FieldValue.increment(monto.valor),
          bonos_canciones: FieldValue.increment(bonos.canciones),
          bonos_conexiones: FieldValue.increment(bonos.conexiones),
        },
        { merge: true },
      );

      // Record movement
      const movRef = db.collection("Movimientos").doc();
      tx.set(movRef, {
        tipo: "recarga_anfitrion",
        anfitrion_uid: anfitrionId,
        clienteId,
        clienteNombre,
        montoId,
        modoId,
        monto: monto.valor,
        costoTotal,
        bonos,
        moneda: paisConfig.moneda.code,
        fecha: new Date().toISOString(),
      });

      return {
        nuevoSaldoAnfitrion: saldoActual - costoTotal,
        clienteNombre,
        montoAcreditado: monto.valor,
        bonos,
      };
    });

    res.json(resultado);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al transferir saldo.";
    console.error("POST /recarga-cliente/transferir error:", err);
    res.status(400).json({ error: message });
  }
});

export default router;
