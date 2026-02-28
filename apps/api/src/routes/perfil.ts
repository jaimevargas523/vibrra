import { Router } from "express";
import { adminDb } from "../config/firebase-admin.js";

const router = Router();

// ---- GET /perfil ----
router.get("/", async (req, res) => {
  try {
    const uid = req.uid!;
    const snap = await adminDb().collection("Anfitriones").doc(uid).get();

    if (!snap.exists) {
      res.json({
        id: uid,
        email: "",
        displayName: "Anfitrion",
        photoURL: null,
        phone: null,
        role: "anfitrion",
        plan: "basico",
        createdAt: null,
        establishmentCount: 0,
        saldoBono: 0,
        registroCompleto: false,
        bonoDisponible: false,
      });
      return;
    }

    const data = snap.data()!;

    // Check if registration is complete (all required fields filled)
    const registroCompleto = !!(
      data.nombres &&
      data.apellidos &&
      data.celular &&
      data.banco &&
      data.numero_cuenta
    );

    const saldoBono = data.saldoBono ?? 0;
    const bonoReclamado = data.bonoReclamado === true;

    // Bonus is available only when all conditions are met
    const bonoDisponible = saldoBono > 0 && registroCompleto && !bonoReclamado;

    // Map Firestore fields to the HostProfile shape the dashboard expects
    res.json({
      id: uid,
      email: data.email ?? "",
      displayName: data.nombres || data.email || "Anfitrion",
      photoURL: data.verificacion?.selfieUrl ?? data.foto_selfie_cedula ?? null,
      phone: data.celular ?? null,
      role: data.tipo ?? "anfitrion",
      plan: data.plan ?? "basico",
      pais: data.pais ?? "CO",
      createdAt: data.creadoEn?.toDate?.()?.toISOString?.() ?? data.created_at ?? null,
      establishmentCount: 0,
      saldoBono,
      registroCompleto,
      bonoDisponible,
    });
  } catch (err) {
    console.error("GET /perfil error:", err);
    res.status(500).json({ error: "Error al obtener perfil." });
  }
});

// ---- PUT /perfil ----
router.put("/", async (req, res) => {
  try {
    const uid = req.uid!;
    const body = req.body as Record<string, unknown>;

    const allowed = [
      "nombres", "apellidos", "celular", "banco", "tipoCuenta",
      "numeroCuenta", "titularCuenta", "tipoPersona", "nit", "regimen", "responsableIva",
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    if (Object.keys(updates).length > 0) {
      await adminDb().collection("Anfitriones").doc(uid).update(updates);
    }

    // Return updated profile
    const snap = await adminDb().collection("Anfitriones").doc(uid).get();
    const data = snap.data()!;

    res.json({
      id: uid,
      email: data.email ?? "",
      displayName: `${data.nombres ?? ""} ${data.apellidos ?? ""}`.trim(),
      photoURL: data.verificacion?.selfieUrl ?? null,
      phone: data.celular ?? null,
      role: data.tipo ?? "anfitrion",
      plan: data.plan ?? "basico",
      createdAt: data.creadoEn?.toDate?.()?.toISOString?.() ?? data.creadoEn ?? null,
      establishmentCount: 0,
    });
  } catch (err) {
    console.error("PUT /perfil error:", err);
    res.status(500).json({ error: "Error al actualizar perfil." });
  }
});

// ---- GET /perfil/saldo ----
router.get("/saldo", async (req, res) => {
  try {
    const uid = req.uid!;
    const snap = await adminDb().collection("Anfitriones").doc(uid).get();

    if (!snap.exists) {
      res.json({ saldo: 0, saldoBono: 0 });
      return;
    }

    const data = snap.data()!;
    res.json({
      saldo: data.saldoReal ?? 0,
      saldoBono: data.saldoBono ?? 0,
    });
  } catch (err) {
    console.error("GET /perfil/saldo error:", err);
    res.status(500).json({ error: "Error al obtener saldo." });
  }
});

// ---- POST /perfil/reclamar-bono ----
router.post("/reclamar-bono", async (req, res) => {
  try {
    const uid = req.uid!;
    const snap = await adminDb().collection("Anfitriones").doc(uid).get();

    if (!snap.exists) {
      res.status(404).json({ error: "Perfil no encontrado." });
      return;
    }

    const data = snap.data()!;

    // Validate requirements server-side
    const registroCompleto = !!(
      data.nombres &&
      data.apellidos &&
      data.celular &&
      data.banco &&
      data.numero_cuenta
    );

    const saldoBono = data.saldoBono ?? 0;
    const bonoReclamado = data.bonoReclamado === true;

    if (bonoReclamado) {
      res.status(400).json({ error: "El bono ya fue reclamado." });
      return;
    }

    if (!registroCompleto) {
      res.status(400).json({ error: "Completa tu registro para reclamar el bono." });
      return;
    }

    if (saldoBono <= 0) {
      res.status(400).json({ error: "No tienes bono disponible." });
      return;
    }

    // Mark bonus as claimed
    await adminDb().collection("Anfitriones").doc(uid).update({
      bonoReclamado: true,
      bonoReclamadoEn: new Date().toISOString(),
    });

    res.json({ ok: true, saldoBono });
  } catch (err) {
    console.error("POST /perfil/reclamar-bono error:", err);
    res.status(500).json({ error: "Error al reclamar bono." });
  }
});

export default router;
