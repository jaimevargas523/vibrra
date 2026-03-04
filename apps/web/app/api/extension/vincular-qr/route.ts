/**
 * POST /api/extension/vincular-qr
 *
 * El dashboard escanea el QR de la extensión Chrome y llama a este endpoint
 * para completar la vinculación. Genera un custom token de Firebase Auth
 * y lo escribe en RTDB para que la extensión pueda autenticarse.
 *
 * Estructura RTDB: sesiones/{estId}/Ext_vincular
 * La extensión busca: orderBy="Ext_vincular/id"&equalTo="{extensionId}"
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminDb, adminAuth, adminRtdb } from "@/lib/api/firebase-admin";
import { verifyAuth } from "@/lib/api/auth";

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  try {
    const { extensionId, establecimientoId } = (await req.json()) as {
      extensionId: string;
      establecimientoId: string;
    };

    if (!extensionId || !establecimientoId) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: extensionId, establecimientoId." },
        { status: 400 },
      );
    }

    // Verificar que el establecimiento pertenece al anfitrión
    const db = adminDb();
    const estDoc = await db.collection("Negocios").doc(establecimientoId).get();

    if (!estDoc.exists) {
      return NextResponse.json(
        { error: "Establecimiento no encontrado." },
        { status: 404 },
      );
    }

    const estData = estDoc.data()!;
    if (estData.anfitrionId !== uid) {
      return NextResponse.json(
        { error: "No tienes permiso sobre este establecimiento." },
        { status: 403 },
      );
    }

    // Generar custom token para que la extensión se autentique
    const customToken = await adminAuth().createCustomToken(uid);

    // Escribir vinculación en sesiones/{estId}/Ext_vincular
    // La extensión busca: orderBy="Ext_vincular/id"&equalTo="{extensionId}"
    const rtdb = adminRtdb();
    await rtdb.ref(`sesiones/${establecimientoId}/Ext_vincular`).set({
      id: extensionId,
      custom_token: customToken,
      expira: Date.now() + 5 * 60 * 1000,
      usado: false,
      nombre: estData.nombre ?? "",
      imagen: estData.fotoUrl ?? null,
    });

    return NextResponse.json({
      ok: true,
      establecimiento: estData.nombre ?? "",
    });
  } catch (err) {
    console.error("POST /api/extension/vincular-qr error:", err);
    return NextResponse.json(
      { error: "Error al vincular extensión." },
      { status: 500 },
    );
  }
}
