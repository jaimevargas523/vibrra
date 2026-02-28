import { Router } from "express";

const router = Router();

interface Negocio {
  id: string;
  nombre: string;
  descripcion: string;
  anfitrionId: string;
  direccion: string;
  ciudad: string;
  zona: string;
  icono: string;
  precio_conexion: number;
  precio_nominacion: number;
  precio_puja_minima: number;
  precio_dedicatoria: number;
  modo_musica: string;
  visible_mapa: boolean;
  suscripcion_activa: boolean;
  fotoUrl: string | null;
  slug: string;
  activo: boolean;
  createdAt: string;
}

const mockNegocios: Negocio[] = [
  {
    id: "neg-001",
    nombre: "Bar La Terraza",
    descripcion: "Bar con terraza al aire libre en Chapinero",
    anfitrionId: "mock-host-uid-001",
    direccion: "Cra 7 #45-12, Chapinero",
    ciudad: "Bogota",
    zona: "Chapinero",
    icono: "bar",
    precio_conexion: 3000,
    precio_nominacion: 5000,
    precio_puja_minima: 2000,
    precio_dedicatoria: 10000,
    modo_musica: "dj",
    visible_mapa: true,
    suscripcion_activa: true,
    fotoUrl: null,
    slug: "bar-la-terraza",
    activo: true,
    createdAt: "2025-11-01T10:00:00.000Z",
  },
  {
    id: "neg-002",
    nombre: "Club Nocturno Vibrra",
    descripcion: "Club nocturno en la Zona Rosa de Bogota",
    anfitrionId: "mock-host-uid-001",
    direccion: "Calle 85 #15-30, Zona Rosa",
    ciudad: "Bogota",
    zona: "Zona Rosa",
    icono: "discoteca",
    precio_conexion: 5000,
    precio_nominacion: 7000,
    precio_puja_minima: 3000,
    precio_dedicatoria: 15000,
    modo_musica: "dj",
    visible_mapa: true,
    suscripcion_activa: true,
    fotoUrl: null,
    slug: "club-nocturno-vibrra",
    activo: true,
    createdAt: "2025-12-15T08:00:00.000Z",
  },
  {
    id: "neg-003",
    nombre: "Karaoke Estrella",
    descripcion: "Karaoke familiar en el norte de Bogota",
    anfitrionId: "mock-host-uid-001",
    direccion: "Av 19 #100-20",
    ciudad: "Bogota",
    zona: "Usaquen",
    icono: "karaoke",
    precio_conexion: 2000,
    precio_nominacion: 4000,
    precio_puja_minima: 1500,
    precio_dedicatoria: 8000,
    modo_musica: "karaoke",
    visible_mapa: false,
    suscripcion_activa: false,
    fotoUrl: null,
    slug: "karaoke-estrella",
    activo: false,
    createdAt: "2026-01-10T12:00:00.000Z",
  },
];

// ---- GET /negocios ----
router.get("/", (_req, res) => {
  res.json(mockNegocios);
});

// ---- GET /negocios/check-slug ----
router.get("/check-slug", (req, res) => {
  const slug = req.query["slug"] as string | undefined;
  if (!slug) {
    res.status(400).json({ error: "Parametro 'slug' es requerido." });
    return;
  }
  const exists = mockNegocios.some((n) => n.slug === slug);
  res.json({ slug, disponible: !exists });
});

// ---- GET /negocios/:id ----
router.get("/:id", (req, res) => {
  const negocio = mockNegocios.find((n) => n.id === req.params["id"]);
  if (!negocio) {
    res.status(404).json({ error: "Negocio no encontrado." });
    return;
  }
  res.json(negocio);
});

// ---- POST /negocios ----
router.post("/", (req, res) => {
  const body = req.body as Partial<Negocio>;
  const newNegocio: Negocio = {
    id: `neg-${Date.now()}`,
    nombre: body.nombre ?? "Nuevo Negocio",
    descripcion: body.descripcion ?? "",
    anfitrionId: req.uid ?? "mock-host-uid-001",
    direccion: body.direccion ?? "",
    ciudad: body.ciudad ?? "Bogota",
    zona: body.zona ?? "",
    icono: body.icono ?? "bar",
    precio_conexion: body.precio_conexion ?? 3000,
    precio_nominacion: body.precio_nominacion ?? 5000,
    precio_puja_minima: body.precio_puja_minima ?? 2000,
    precio_dedicatoria: body.precio_dedicatoria ?? 10000,
    modo_musica: body.modo_musica ?? "dj",
    visible_mapa: body.visible_mapa ?? true,
    suscripcion_activa: false,
    fotoUrl: null,
    slug: body.slug ?? `negocio-${Date.now()}`,
    activo: true,
    createdAt: new Date().toISOString(),
  };
  mockNegocios.push(newNegocio);
  res.status(201).json(newNegocio);
});

// ---- PUT /negocios/:id ----
router.put("/:id", (req, res) => {
  const idx = mockNegocios.findIndex((n) => n.id === req.params["id"]);
  if (idx === -1) {
    res.status(404).json({ error: "Negocio no encontrado." });
    return;
  }
  const body = req.body as Partial<Negocio>;
  const updated: Negocio = {
    ...mockNegocios[idx]!,
    ...body,
    id: mockNegocios[idx]!.id,
    anfitrionId: mockNegocios[idx]!.anfitrionId,
  };
  mockNegocios[idx] = updated;
  res.json(updated);
});

// ---- POST /negocios/:id/foto ----
router.post("/:id/foto", (req, res) => {
  const idx = mockNegocios.findIndex((n) => n.id === req.params["id"]);
  if (idx === -1) {
    res.status(404).json({ error: "Negocio no encontrado." });
    return;
  }
  // Stub: In production this would handle file upload to Cloud Storage
  mockNegocios[idx]!.fotoUrl = `https://storage.vibrra.co/negocios/${req.params["id"]}/foto.jpg`;
  res.json({ fotoUrl: mockNegocios[idx]!.fotoUrl });
});

export default router;
