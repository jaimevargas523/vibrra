import { Router } from "express";
import { adminDb, adminRtdb } from "../config/firebase-admin.js";
import { FieldValue } from "firebase-admin/firestore";
import { getPaisConfig } from "./mi-pais.js";
const router = Router();
function parseClienteId(raw) {
    if (raw.startsWith("anon:"))
        return { tipo: "anon", id: raw.slice(5) };
    if (raw.startsWith("client:"))
        return { tipo: "client", id: raw.slice(7) };
    return null;
}
/**
 * POST /recarga-cliente/transferir
 *
 * Recarga saldo a un cliente (anónimo o registrado).
 * El QR del cliente incluye un prefijo:
 *   - "anon:{visitorId}"   → saldo en RTDB  Anonimos/{visitorId}
 *   - "client:{clienteId}" → saldo en Firestore Clientes/{clienteId}
 */
router.post("/transferir", async (req, res) => {
    try {
        const anfitrionId = req.uid;
        const { clienteId: rawClienteId, montoId, modoId } = req.body;
        if (!rawClienteId || !montoId || !modoId) {
            res.status(400).json({ error: "Faltan campos requeridos: clienteId, montoId, modoId." });
            return;
        }
        const parsed = parseClienteId(rawClienteId);
        if (!parsed) {
            res.status(400).json({ error: "Formato de clienteId inválido. Use anon:{id} o client:{id}." });
            return;
        }
        const { tipo: clienteTipo, id: clienteId } = parsed;
        const db = adminDb();
        const anfitrionRef = db.collection("Anfitriones").doc(anfitrionId);
        const anfitrionPreSnap = await anfitrionRef.get();
        if (!anfitrionPreSnap.exists) {
            res.status(404).json({ error: "Anfitrion no encontrado." });
            return;
        }
        const paisCode = anfitrionPreSnap.data().pais ?? "CO";
        const paisConfig = await getPaisConfig(paisCode);
        if (!paisConfig) {
            res.status(500).json({ error: `Configuracion de pais no encontrada: ${paisCode}` });
            return;
        }
        const { recarga } = paisConfig;
        const monto = recarga.montos.find((m) => m.id === montoId);
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
        const comision = Math.round(costoTotal * 0.10);
        /* ── Acreditar saldo según tipo de cliente ─────────── */
        let clienteNombre = "Cliente";
        if (clienteTipo === "anon") {
            const rtdb = adminRtdb();
            const anonRef = rtdb.ref(`Anonimos/${clienteId}`);
            const anonSnap = await anonRef.get();
            if (!anonSnap.exists()) {
                res.status(404).json({ error: "Cliente anónimo no encontrado." });
                return;
            }
            const anonData = anonSnap.val();
            clienteNombre = anonData.alias ?? "Anónimo";
            const saldoActual = anonData.saldo ?? 0;
            await anonRef.update({
                saldo: saldoActual + monto.valor,
                "bonos/nominacionesGratis": (anonData.bonos?.nominacionesGratis ?? 0) + (bonos.canciones ?? 0),
                "bonos/conexionesGratis": (anonData.bonos?.conexionesGratis ?? 0) + (bonos.conexiones ?? 0),
            });
        }
        else {
            const clienteRef = db.collection("Clientes").doc(clienteId);
            const cliSnap = await clienteRef.get();
            const cliData = cliSnap.exists ? cliSnap.data() : {};
            clienteNombre = cliData.nombre ?? cliData.displayName ?? "Cliente";
            await clienteRef.set({
                saldo: FieldValue.increment(monto.valor),
                bonos_canciones: FieldValue.increment(bonos.canciones),
                bonos_conexiones: FieldValue.increment(bonos.conexiones),
            }, { merge: true });
        }
        /* ── Actualizar anfitrión + movimientos (Firestore tx) */
        const resultado = await db.runTransaction(async (tx) => {
            const anfitrionSnap = await tx.get(anfitrionRef);
            if (!anfitrionSnap.exists)
                throw new Error("Anfitrion no encontrado.");
            const anfitrionData = anfitrionSnap.data();
            const saldoActual = (anfitrionData.saldoReal ?? 0) + (anfitrionData.saldoBono ?? 0);
            if (saldoActual - recarga.minimoBloqueado < costoTotal) {
                const symbol = paisConfig.moneda.symbol;
                const min = recarga.minimoBloqueado.toLocaleString();
                throw new Error(`Saldo insuficiente. Debes mantener un minimo de ${symbol}${min} en tu cuenta.`);
            }
            const saldoReal = anfitrionData.saldoReal ?? 0;
            const descuentoReal = Math.min(saldoReal, costoTotal);
            const descuentoBono = costoTotal - descuentoReal;
            const nuevoRecaudo = (anfitrionData.recaudo_mes ?? 0) + costoTotal;
            const nuevasComisiones = (anfitrionData.comisiones_mes ?? 0) + comision;
            tx.update(anfitrionRef, {
                saldoReal: FieldValue.increment(-descuentoReal),
                saldoBono: FieldValue.increment(-descuentoBono),
                recaudo_mes: nuevoRecaudo,
                comisiones_mes: nuevasComisiones,
            });
            // Movimiento
            const movRef = db.collection("Movimientos").doc();
            tx.set(movRef, {
                tipo: "recarga_anfitrion",
                anfitrion_uid: anfitrionId,
                clienteId: rawClienteId,
                cliente_tipo: clienteTipo,
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
                comisionAcumulada: nuevasComisiones,
                recaudoMes: nuevoRecaudo,
                clienteNombre,
                montoAcreditado: monto.valor,
                bonos,
                comisionEsta: comision,
            };
        });
        res.json(resultado);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Error al transferir saldo.";
        console.error("POST /recarga-cliente/transferir error:", err);
        res.status(400).json({ error: message });
    }
});
export default router;
