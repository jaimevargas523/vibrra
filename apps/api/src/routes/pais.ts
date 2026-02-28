import { Router } from "express";
import { getPaisConfig } from "./mi-pais.js";

const router = Router();

/**
 * GET /pais/:code
 * Public endpoint — returns the PaisConfig for any active country.
 */
router.get("/:code", async (req, res) => {
  try {
    const code = (req.params.code ?? "").toUpperCase();
    if (!code || code.length !== 2) {
      res.status(400).json({ error: "Codigo de pais invalido. Usa ISO 3166-1 alpha-2 (e.g. CO)." });
      return;
    }

    const config = await getPaisConfig(code);
    if (!config || !config.activo) {
      res.status(404).json({ error: `Pais no encontrado o no activo: ${code}` });
      return;
    }

    res.json(config);
  } catch (err) {
    console.error("GET /pais/:code error:", err);
    res.status(500).json({ error: "Error al obtener configuracion del pais." });
  }
});

export default router;
