import { Router } from "express";
import {
  getActiveSession,
  getAllSessions,
  startSession,
  endSession,
} from "../services/sesion.service.js";
import { getPendingQueue } from "../services/cola.service.js";

const router = Router();

// ---- GET /sesiones ----
router.get("/", (req, res) => {
  const page = Math.max(1, parseInt(req.query["page"] as string) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(req.query["pageSize"] as string) || 10));
  const result = getAllSessions(page, pageSize);
  res.json(result);
});

// ---- GET /sesiones/active ----
router.get("/active", (_req, res) => {
  const session = getActiveSession();
  if (!session) {
    res.json(null);
    return;
  }
  // Attach live queue
  const cola = getPendingQueue(session.id);
  res.json({ ...session, cola });
});

// ---- POST /sesiones/abrir ----
router.post("/abrir", (req, res) => {
  const { negocioId } = req.body as { negocioId?: string };
  if (!negocioId) {
    res.status(400).json({ error: "negocioId es requerido." });
    return;
  }
  const session = startSession(negocioId);
  res.status(201).json(session);
});

// ---- POST /sesiones/cerrar ----
router.post("/cerrar", (_req, res) => {
  const session = endSession();
  if (!session) {
    res.status(404).json({ error: "No hay sesion activa para finalizar." });
    return;
  }
  res.json(session);
});

// ---- GET /sesiones/:id/detalle ----
router.get("/:id/detalle", (req, res) => {
  const sessionId = req.params["id"];
  // Mock: return top 5 songs for any session
  const topSongs = [
    { cancion: "Despacito", artista: "Luis Fonsi ft. Daddy Yankee", monto: 15000, clienteId: "cli-001", timestamp: "2026-02-27T22:10:00.000Z" },
    { cancion: "Felices los 4", artista: "Maluma", monto: 12000, clienteId: "cli-002", timestamp: "2026-02-27T22:25:00.000Z" },
    { cancion: "Vivir Mi Vida", artista: "Marc Anthony", monto: 10000, clienteId: "cli-003", timestamp: "2026-02-27T22:40:00.000Z" },
    { cancion: "La Bicicleta", artista: "Carlos Vives ft. Shakira", monto: 8000, clienteId: "cli-004", timestamp: "2026-02-27T23:00:00.000Z" },
    { cancion: "Chantaje", artista: "Shakira ft. Maluma", monto: 7000, clienteId: "cli-005", timestamp: "2026-02-27T23:15:00.000Z" },
  ];
  res.json({ sesionId: sessionId, topCanciones: topSongs });
});

export default router;
