import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminDb } from "@/lib/api/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { verifyAuth } from "@/lib/api/auth";
import { getPaisConfig } from "@/lib/api/pais-config";

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (auth instanceof NextResponse) return auth;
  const anfitrionId = auth;

  try {
    const { clienteId, montoId, modoId } = (await req.json()) as {
      clienteId: string;
      montoId: string;
      modoId: string;
    };

    if (!clienteId || !montoId || !modoId) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: clienteId, montoId, modoId." },
        { status: 400 },
      );
    }

    const db = adminDb();
    const anfitrionRef = db.collection("Anfitriones").doc(anfitrionId);
    const anfitrionPreSnap = await anfitrionRef.get();
    if (!anfitrionPreSnap.exists) {
      return NextResponse.json(
        { error: "Anfitrion no encontrado." },
        { status: 404 },
      );
    }

    const paisCode = anfitrionPreSnap.data()!.pais ?? "CO";
    const paisConfig = await getPaisConfig(paisCode);
    if (!paisConfig) {
      return NextResponse.json(
        { error: `Configuracion de pais no encontrada: ${paisCode}` },
        { status: 500 },
      );
    }

    const { recarga } = paisConfig;

    const monto = recarga.montos.find((m) => m.id === montoId);
    if (!monto) {
      return NextResponse.json(
        { error: `Monto invalido: ${montoId}` },
        { status: 400 },
      );
    }

    const bonos = recarga.tablaBonos[montoId]?.[modoId];
    if (!bonos) {
      return NextResponse.json(
        { error: `Modo invalido: ${modoId}` },
        { status: 400 },
      );
    }

    const costoTotal =
      monto.valor + (modoId === "generosa" ? recarga.costoExtraGenerosa : 0);
    const clienteRef = db.collection("Usuarios").doc(clienteId);

    const resultado = await db.runTransaction(async (tx) => {
      const anfitrionSnap = await tx.get(anfitrionRef);
      if (!anfitrionSnap.exists) {
        throw new Error("Anfitrion no encontrado.");
      }

      const anfitrionData = anfitrionSnap.data()!;
      const saldoActual =
        (anfitrionData.saldoReal ?? 0) + (anfitrionData.saldoBono ?? 0);

      if (saldoActual - recarga.minimoBloqueado < costoTotal) {
        const symbol = paisConfig.moneda.symbol;
        const min = recarga.minimoBloqueado.toLocaleString();
        throw new Error(
          `Saldo insuficiente. Debes mantener un minimo de ${symbol}${min} en tu cuenta.`,
        );
      }

      const clienteSnap = await tx.get(clienteRef);
      const clienteData = clienteSnap.exists ? clienteSnap.data()! : {};
      const clienteNombre =
        clienteData.nombre ?? clienteData.displayName ?? "Cliente";

      const saldoReal = anfitrionData.saldoReal ?? 0;
      const descuentoReal = Math.min(saldoReal, costoTotal);
      const descuentoBono = costoTotal - descuentoReal;

      tx.update(anfitrionRef, {
        saldoReal: FieldValue.increment(-descuentoReal),
        saldoBono: FieldValue.increment(-descuentoBono),
      });

      tx.set(
        clienteRef,
        {
          saldo: FieldValue.increment(monto.valor),
          bonos_canciones: FieldValue.increment(bonos.canciones),
          bonos_conexiones: FieldValue.increment(bonos.conexiones),
        },
        { merge: true },
      );

      const movRef = db.collection("Movimientos").doc();
      tx.set(movRef, {
        tipo: "recarga_anfitrion",
        anfitrion_uid: anfitrionId,
        clienteId,
        clienteNombre,
        montoId,
        modoId,
        monto: monto.valor,
        costoTotal,
        bonos,
        moneda: paisConfig.moneda.code,
        fecha: new Date().toISOString(),
      });

      return {
        nuevoSaldoAnfitrion: saldoActual - costoTotal,
        clienteNombre,
        montoAcreditado: monto.valor,
        bonos,
      };
    });

    return NextResponse.json(resultado);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al transferir saldo.";
    console.error("POST /api/recarga-cliente/transferir error:", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
