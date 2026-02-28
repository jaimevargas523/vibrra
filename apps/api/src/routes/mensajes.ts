import { Router } from "express";
import { adminDb } from "../config/firebase-admin.js";

const router = Router();

type LangMap = Record<string, string>;

/** Resolve a multilingual field to the requested language, falling back to "es". */
function resolve(field: unknown, lang: string): string {
  if (!field || typeof field !== "object") return String(field ?? "");
  const map = field as LangMap;
  return map[lang] ?? map["es"] ?? Object.values(map)[0] ?? "";
}

// ---- GET /mensajes ----
router.get("/", async (req, res) => {
  try {
    const uid = req.uid!;
    const lang = (req.headers["accept-language"] ?? "es").slice(0, 2);
    const now = new Date();

    // 1. Global messages targeting "Anfitriones"
    const globalSnap = await adminDb()
      .collection("Mensajes")
      .where("destinatarios", "array-contains", "Anfitriones")
      .where("activo", "==", true)
      .get();

    // 2. Already-read global message IDs
    const leidosSnap = await adminDb()
      .collection("Anfitriones")
      .doc(uid)
      .collection("MensajesLeidos")
      .get();
    const leidosSet = new Set(leidosSnap.docs.map((d) => d.id));

    // 3. Personal messages
    const personalSnap = await adminDb()
      .collection("Anfitriones")
      .doc(uid)
      .collection("Mensajes")
      .get();

    // Build response array
    const mensajes: Array<Record<string, unknown>> = [];

    for (const doc of globalSnap.docs) {
      if (leidosSet.has(doc.id)) continue; // already read

      const data = doc.data();

      // Check date range
      const inicio = data.fechaInicio?.toDate?.() ?? null;
      const fin = data.fechaFin?.toDate?.() ?? null;
      if (inicio && now < inicio) continue;
      if (fin && now > fin) continue;

      mensajes.push({
        id: doc.id,
        tipo: "global",
        titulo: resolve(data.titulo, lang),
        descripcion: resolve(data.descripcion, lang),
        estilo: data.estilo ?? "info",
        icono: data.icono ?? "info",
        cta: data.cta
          ? { texto: resolve(data.cta.texto, lang), ruta: data.cta.ruta }
          : null,
        createdAt:
          data.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
      });
    }

    for (const doc of personalSnap.docs) {
      const data = doc.data();
      mensajes.push({
        id: doc.id,
        tipo: "personal",
        titulo: resolve(data.titulo, lang),
        descripcion: resolve(data.descripcion, lang),
        estilo: data.estilo ?? "info",
        icono: data.icono ?? "info",
        cta: data.cta
          ? { texto: resolve(data.cta.texto, lang), ruta: data.cta.ruta }
          : null,
        createdAt:
          data.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
      });
    }

    // Sort newest first
    mensajes.sort(
      (a, b) =>
        new Date(b.createdAt as string).getTime() -
        new Date(a.createdAt as string).getTime(),
    );

    res.json(mensajes);
  } catch (err) {
    console.error("GET /mensajes error:", err);
    res.status(500).json({ error: "Error al obtener mensajes." });
  }
});

// ---- POST /mensajes/:id/leer ----
router.post("/:id/leer", async (req, res) => {
  try {
    const uid = req.uid!;
    const { id } = req.params;

    await adminDb()
      .collection("Anfitriones")
      .doc(uid)
      .collection("MensajesLeidos")
      .doc(id)
      .set({ leidoEn: new Date().toISOString() });

    res.json({ ok: true });
  } catch (err) {
    console.error("POST /mensajes/:id/leer error:", err);
    res.status(500).json({ error: "Error al marcar mensaje como leido." });
  }
});

// ---- DELETE /mensajes/:id ----
router.delete("/:id", async (req, res) => {
  try {
    const uid = req.uid!;
    const { id } = req.params;

    const ref = adminDb()
      .collection("Anfitriones")
      .doc(uid)
      .collection("Mensajes")
      .doc(id);

    const snap = await ref.get();
    if (!snap.exists) {
      res.status(404).json({ error: "Mensaje no encontrado." });
      return;
    }

    await ref.delete();
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /mensajes/:id error:", err);
    res.status(500).json({ error: "Error al eliminar mensaje." });
  }
});

export default router;
