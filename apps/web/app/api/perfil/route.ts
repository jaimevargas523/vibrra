import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminDb, adminAuth } from "@/lib/api/firebase-admin";
import { verifyAuth } from "@/lib/api/auth";

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  try {
    const snap = await adminDb().collection("Anfitriones").doc(uid).get();
    const authUser = await adminAuth().getUser(uid);
    const authEmail = authUser.email ?? "";

    if (!snap.exists) {
      return NextResponse.json({
        id: uid,
        email: authEmail,
        displayName: authUser.displayName || "Anfitrion",
        photoURL: null,
        phone: null,
        role: "anfitrion",
        plan: "basico",
        createdAt: null,
        establishmentCount: 0,
        registroCompleto: false,
        recaudoMes: 0,
        comisionesMes: 0,
        participacionMes: 0,
        bonoArranqueSaldo: 0,
        liquidacionEstado: "pendiente",
      });
    }

    const data = snap.data()!;

    const fullName = [data.nombres, data.apellidos]
      .filter(Boolean)
      .join(" ")
      .trim();
    const displayName =
      fullName ||
      authUser.displayName ||
      data.email ||
      authEmail ||
      "Anfitrion";

    const registroCompleto = !!(
      data.nombres &&
      data.apellidos &&
      data.celular &&
      data.banco &&
      data.numero_cuenta
    );

    const negociosSnap = await adminDb()
      .collection("Negocios")
      .where("anfitrionId", "==", uid)
      .count()
      .get();
    const establishmentCount = negociosSnap.data().count;

    return NextResponse.json({
      id: uid,
      email: data.email || authEmail,
      displayName,
      photoURL:
        data.verificacion?.selfieUrl ?? data.foto_selfie_cedula ?? null,
      phone: data.celular ?? null,
      role: data.tipo ?? "anfitrion",
      plan: data.plan ?? "basico",
      pais: data.pais ?? "CO",
      createdAt:
        data.creadoEn?.toDate?.()?.toISOString?.() ?? data.created_at ?? null,
      establishmentCount,
      registroCompleto,
      recaudoMes: data.recaudo_mes ?? 0,
      comisionesMes: data.comisiones_mes ?? 0,
      participacionMes: data.participacion_mes ?? 0,
      bonoArranqueSaldo: data.bono_arranque_saldo ?? 0,
      liquidacionEstado: data.liquidacion_estado ?? "pendiente",
      banco: data.banco ?? null,
      tipoCuenta: data.tipoCuenta ?? data.tipo_cuenta ?? null,
      numeroCuenta: data.numeroCuenta ?? data.numero_cuenta ?? null,
      titularCuenta: data.titularCuenta ?? data.titular_cuenta ?? null,
      tipoPersona: data.tipoPersona ?? data.tipo_persona ?? null,
      nit: data.nit ?? null,
      regimen: data.regimen ?? null,
      responsableIva: data.responsableIva ?? data.responsable_iva ?? null,
    });
  } catch (err) {
    console.error("GET /api/perfil error:", err);
    return NextResponse.json(
      { error: "Error al obtener perfil." },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  try {
    const body = (await req.json()) as Record<string, unknown>;

    const allowed = [
      "nombres",
      "apellidos",
      "celular",
      "banco",
      "tipoCuenta",
      "numeroCuenta",
      "titularCuenta",
      "tipoPersona",
      "nit",
      "regimen",
      "responsableIva",
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    if (Object.keys(updates).length > 0) {
      await adminDb().collection("Anfitriones").doc(uid).update(updates);
    }

    const snap = await adminDb().collection("Anfitriones").doc(uid).get();
    const data = snap.data()!;

    return NextResponse.json({
      id: uid,
      email: data.email ?? "",
      displayName: `${data.nombres ?? ""} ${data.apellidos ?? ""}`.trim(),
      photoURL: data.verificacion?.selfieUrl ?? null,
      phone: data.celular ?? null,
      role: data.tipo ?? "anfitrion",
      plan: data.plan ?? "basico",
      createdAt:
        data.creadoEn?.toDate?.()?.toISOString?.() ?? data.creadoEn ?? null,
      establishmentCount: 0,
    });
  } catch (err) {
    console.error("PUT /api/perfil error:", err);
    return NextResponse.json(
      { error: "Error al actualizar perfil." },
      { status: 500 },
    );
  }
}
