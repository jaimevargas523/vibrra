import { Router } from "express";
import { adminDb } from "../config/firebase-admin.js";

const router = Router();

// ---- GET /negocios ----
router.get("/", async (req, res) => {
  try {
    const uid = req.uid!;
    const snap = await adminDb()
      .collection("Negocios")
      .where("anfitrionId", "==", uid)
      .get();

    const negocios = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.nombre ?? "",
        address: d.direccion ?? "",
        city: d.ciudad ?? "",
        type: d.icono ?? "bar",
        isActive: d.activo ?? false,
        imageUrl: d.fotoUrl ?? null,
        totalSesiones: d.totalSesiones ?? 0,
        totalRecaudado: d.totalRecaudado ?? 0,
      };
    });

    res.json(negocios);
  } catch (err) {
    console.error("GET /negocios error:", err);
    res.status(500).json({ error: "Error al obtener establecimientos." });
  }
});

// ---- GET /negocios/check-slug ----
router.get("/check-slug", async (req, res) => {
  try {
    const slug = req.query["slug"] as string | undefined;
    if (!slug) {
      res.status(400).json({ error: "Parametro 'slug' es requerido." });
      return;
    }
    const snap = await adminDb()
      .collection("Negocios")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    res.json({ slug, disponible: snap.empty });
  } catch (err) {
    console.error("GET /negocios/check-slug error:", err);
    res.status(500).json({ error: "Error al verificar slug." });
  }
});

// ---- GET /negocios/:id ----
router.get("/:id", async (req, res) => {
  try {
    const snap = await adminDb().collection("Negocios").doc(req.params["id"]!).get();

    if (!snap.exists) {
      res.status(404).json({ error: "Negocio no encontrado." });
      return;
    }

    const d = snap.data()!;
    res.json({
      id: snap.id,
      name: d.nombre ?? "",
      description: d.descripcion ?? "",
      address: d.direccion ?? "",
      city: d.ciudad ?? "",
      departamento: d.departamento ?? "",
      zona: d.zona ?? "",
      slug: d.slug ?? "",
      type: d.icono ?? "bar",
      isActive: d.activo ?? false,
      imageUrl: d.fotoUrl ?? null,
      precioConexion: d.precio_conexion ?? 0,
      precioNominacion: d.precio_nominacion ?? 0,
      precioPujaMin: d.precio_puja_minima ?? 0,
      precioDedicatoria: d.precio_dedicatoria ?? 0,
      modoMusica: d.modo_musica !== false,
      visibleMapa: d.visible_mapa !== false,
      createdAt: d.createdAt?.toDate?.()?.toISOString?.() ?? d.createdAt ?? null,
    });
  } catch (err) {
    console.error("GET /negocios/:id error:", err);
    res.status(500).json({ error: "Error al obtener negocio." });
  }
});

// ---- POST /negocios ----
router.post("/", async (req, res) => {
  try {
    const uid = req.uid!;
    const body = req.body as Record<string, unknown>;

    const newDoc = {
      nombre: body.nombre ?? "Nuevo Negocio",
      descripcion: body.descripcion ?? "",
      anfitrionId: uid,
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
      totalSesiones: 0,
      totalRecaudado: 0,
      createdAt: new Date().toISOString(),
    };

    const ref = await adminDb().collection("Negocios").add(newDoc);
    res.status(201).json({ id: ref.id, ...newDoc });
  } catch (err) {
    console.error("POST /negocios error:", err);
    res.status(500).json({ error: "Error al crear negocio." });
  }
});

// ---- PUT /negocios/:id ----
router.put("/:id", async (req, res) => {
  try {
    const docRef = adminDb().collection("Negocios").doc(req.params["id"]!);
    const snap = await docRef.get();

    if (!snap.exists) {
      res.status(404).json({ error: "Negocio no encontrado." });
      return;
    }

    const body = req.body as Record<string, unknown>;
    // Don't allow changing id or anfitrionId
    delete body.id;
    delete body.anfitrionId;

    await docRef.update(body);
    const updated = await docRef.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error("PUT /negocios/:id error:", err);
    res.status(500).json({ error: "Error al actualizar negocio." });
  }
});

// ---- POST /negocios/:id/foto ----
router.post("/:id/foto", async (req, res) => {
  try {
    const docRef = adminDb().collection("Negocios").doc(req.params["id"]!);
    const snap = await docRef.get();

    if (!snap.exists) {
      res.status(404).json({ error: "Negocio no encontrado." });
      return;
    }

    // Stub: In production this would handle file upload to Cloud Storage
    const fotoUrl = `https://storage.vibrra.co/negocios/${req.params["id"]}/foto.jpg`;
    await docRef.update({ fotoUrl });
    res.json({ fotoUrl });
  } catch (err) {
    console.error("POST /negocios/:id/foto error:", err);
    res.status(500).json({ error: "Error al subir foto." });
  }
});

export default router;
