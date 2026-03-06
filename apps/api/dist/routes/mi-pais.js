import { Router } from "express";
import { adminDb } from "../config/firebase-admin.js";
const router = Router();
// Simple in-memory cache (5 min TTL)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;
async function getPaisConfig(code) {
    const cached = cache.get(code);
    if (cached && Date.now() < cached.expiresAt)
        return cached.data;
    const snap = await adminDb().collection("Paises").doc(code).get();
    if (!snap.exists)
        return null;
    const data = snap.data();
    cache.set(code, { data, expiresAt: Date.now() + CACHE_TTL });
    return data;
}
/**
 * GET /mi-pais
 * Returns the full PaisConfig for the authenticated host's country.
 */
router.get("/", async (req, res) => {
    try {
        const uid = req.uid;
        const anfitrionSnap = await adminDb().collection("Anfitriones").doc(uid).get();
        const pais = anfitrionSnap.exists ? (anfitrionSnap.data().pais ?? "CO") : "CO";
        const config = await getPaisConfig(pais);
        if (!config) {
            res.status(404).json({ error: `Configuracion de pais no encontrada: ${pais}` });
            return;
        }
        res.json(config);
    }
    catch (err) {
        console.error("GET /mi-pais error:", err);
        res.status(500).json({ error: "Error al obtener configuracion del pais." });
    }
});
export default router;
export { getPaisConfig };
