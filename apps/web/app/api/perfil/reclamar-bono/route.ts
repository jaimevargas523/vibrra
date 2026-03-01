import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminDb } from "@/lib/api/firebase-admin";
import { verifyAuth } from "@/lib/api/auth";
import { getPaisConfig } from "@/lib/api/pais-config";
import { crearMovimiento } from "@/lib/api/movimiento-types";

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  try {
    const db = adminDb();

    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(db.collection("Anfitriones").doc(uid));

      if (!snap.exists) {
        throw new Error("Perfil no encontrado.");
      }

      const data = snap.data()!;

      const registroCompleto = !!(
        data.nombres &&
        data.apellidos &&
        data.celular &&
        data.banco &&
        data.numero_cuenta
      );

      const saldoReal = data.saldoReal ?? 0;
      const saldoBono = data.saldoBono ?? 0;
      const bonoReclamado = data.bonoReclamado === true;

      if (bonoReclamado) {
        throw new Error("El bono ya fue reclamado.");
      }

      if (!registroCompleto) {
        throw new Error("Completa tu registro para reclamar el bono.");
      }

      // Get bonus amount from country config
      const paisCode = data.pais ?? "CO";
      const paisConfig = await getPaisConfig(paisCode);
      const bonoActivacion = paisConfig?.suscripcion?.bonoActivacion ?? 0;

      if (bonoActivacion <= 0) {
        throw new Error("No hay bono de activación configurado para tu país.");
      }

      const nuevoSaldoBono = saldoBono + bonoActivacion;

      tx.update(db.collection("Anfitriones").doc(uid), {
        saldoBono: nuevoSaldoBono,
        bonoReclamado: true,
        bonoReclamadoEn: new Date().toISOString(),
      });

      const movDoc = crearMovimiento(uid, "BONO_ACTIVACION", {
        monto_real: 0,
        monto_bono: bonoActivacion,
        saldo_real_post: saldoReal,
        saldo_bono_post: nuevoSaldoBono,
        descripcion: "Bono de bienvenida reclamado",
        creado_por: "user",
      });

      const movRef = db.collection("Movimientos").doc();
      tx.set(movRef, movDoc);

      return { ok: true, saldoBono: nuevoSaldoBono };
    });

    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al reclamar bono.";
    const status = message.includes("ya fue reclamado") || message.includes("Completa") || message.includes("No hay bono")
      ? 400
      : message.includes("no encontrado") ? 404 : 500;
    console.error("POST /api/perfil/reclamar-bono error:", err);
    return NextResponse.json({ error: message }, { status });
  }
}
