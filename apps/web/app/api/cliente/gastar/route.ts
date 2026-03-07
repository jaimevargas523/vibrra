import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/api/firebase-admin";

/**
 * POST /api/cliente/gastar
 * Atomic saldo deduction for registered clients.
 *
 * Headers: Authorization: Bearer <idToken>
 * Body: { monto: number, tipo: string, estId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await adminAuth().verifyIdToken(token);
    const uid = decoded.uid;

    const body = await req.json();
    const { monto, tipo, estId } = body;

    if (!monto || typeof monto !== "number" || monto <= 0) {
      return NextResponse.json({ error: "Monto invalido" }, { status: 400 });
    }
    if (!tipo || !estId) {
      return NextResponse.json({ error: "tipo y estId requeridos" }, { status: 400 });
    }

    const db = adminDb();
    const clienteRef = db.collection("Clientes").doc(uid);

    const nuevoSaldo = await db.runTransaction(async (tx) => {
      const snap = await tx.get(clienteRef);
      if (!snap.exists) {
        throw new Error("CLIENTE_NOT_FOUND");
      }
      const data = snap.data()!;
      const saldoActual = data.saldo ?? 0;

      if (saldoActual < monto) {
        throw new Error("SALDO_INSUFICIENTE");
      }

      const nuevo = saldoActual - monto;
      tx.update(clienteRef, { saldo: nuevo });
      return nuevo;
    });

    return NextResponse.json({ saldo: nuevoSaldo });
  } catch (err: any) {
    if (err?.message === "CLIENTE_NOT_FOUND") {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }
    if (err?.message === "SALDO_INSUFICIENTE") {
      return NextResponse.json({ error: "Saldo insuficiente" }, { status: 400 });
    }
    if (err?.code === "auth/id-token-expired" || err?.code === "auth/argument-error") {
      return NextResponse.json({ error: "Token invalido" }, { status: 401 });
    }
    console.error("Error en gastar:", err);
    return NextResponse.json({ error: "Error procesando gasto" }, { status: 500 });
  }
}
