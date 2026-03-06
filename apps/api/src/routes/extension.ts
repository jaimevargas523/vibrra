import { Router } from "express";
import { adminDb, adminRtdb } from "../config/firebase-admin.js";

const router = Router();

/**
 * POST /api/extension/vincular-qr
 *
 * El dashboard escanea el QR de la extensión Chrome y llama a este endpoint
 * para completar la vinculación.
 *
 * Escribe los datos de vinculación en sesiones/{estId}/Ext_vincular en RTDB
 * para que la extensión los encuentre.
 */
router.post("/vincular-qr", async (req, res) => {
  const uid = req.uid!;

  try {
    const { extensionId, establecimientoId } = req.body as {
      extensionId?: string;
      establecimientoId?: string;
    };

    if (!extensionId || !establecimientoId) {
      res
        .status(400)
        .json({ error: "Faltan campos requeridos: extensionId, establecimientoId." });
      return;
    }

    // Extract UUID from URL formats like https://vibrra.live/vincular/UUID
    const uuidMatch = extensionId.match(
      /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
    );
    const cleanExtensionId = uuidMatch ? uuidMatch[1] : extensionId;
    console.log("[vincular-qr] uid:", uid, "est:", establecimientoId, "ext:", cleanExtensionId);

    // Verificar que el establecimiento pertenece al anfitrión
    const estDoc = await adminDb()
      .collection("Negocios")
      .doc(establecimientoId)
      .get();

    if (!estDoc.exists) {
      res.status(404).json({ error: "Establecimiento no encontrado." });
      return;
    }

    const estData = estDoc.data()!;
    if (estData.anfitrionId !== uid) {
      res
        .status(403)
        .json({ error: "No tienes permiso sobre este establecimiento." });
      return;
    }

    // Escribir vinculación en sesiones/{estId}/Ext_vincular
    await adminRtdb()
      .ref(`sesiones/${establecimientoId}/Ext_vincular`)
      .set({
        id: cleanExtensionId,
        uid,
        expira: Date.now() + 5 * 60 * 1000,
        usado: false,
        nombre: estData.nombre ?? "",
        imagen: estData.fotoUrl ?? null,
      });

    res.json({ ok: true, establecimiento: estData.nombre ?? "" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("POST /api/extension/vincular-qr error:", message, err);
    res.status(500).json({ error: `Error al vincular: ${message}` });
  }
});

export default router;
