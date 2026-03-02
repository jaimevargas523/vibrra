import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminDb } from "@/lib/api/firebase-admin";
import { verifyAuth } from "@/lib/api/auth";

/**
 * Map a Firestore movement doc (old or new format) to the
 * Movimiento shape the dashboard expects.
 */
function mapMovimiento(
  id: string,
  d: Record<string, unknown>,
): Record<string, unknown> {
  // New format: has "categoria" field
  if (d.categoria) {
    return {
      id,
      anfitrion_id: d.anfitrion_id ?? d.anfitrion_uid ?? "",
      cliente_id: d.cliente_id ?? null,
      sesion_id: d.sesion_id ?? null,
      tipo: d.tipo,
      categoria: d.categoria,
      monto: d.monto ?? 0,
      comision: d.comision ?? 0,
      participacion: d.participacion ?? 0,
      recaudo_post: d.recaudo_post ?? 0,
      comisiones_post: d.comisiones_post ?? 0,
      participacion_post: d.participacion_post ?? 0,
      descripcion: d.descripcion ?? "",
      timestamp: d.timestamp ?? d.fecha ?? new Date().toISOString(),
      creado_por: d.creado_por ?? "sistema",
    };
  }

  // Old format: map legacy fields
  return {
    id,
    anfitrion_id: (d.anfitrion_uid ?? d.anfitrion_id ?? "") as string,
    cliente_id: null,
    sesion_id: null,
    tipo: (d.tipo as string) ?? "AJUSTE_ADMIN",
    categoria: "BONO",
    monto: (d.bruto ?? d.neto ?? d.monto ?? 0) as number,
    comision: 0,
    participacion: 0,
    recaudo_post: 0,
    comisiones_post: 0,
    participacion_post: 0,
    descripcion: (d.subtitulo ?? d.titulo ?? d.descripcion ?? "") as string,
    timestamp: (d.fecha ?? d.timestamp ?? new Date().toISOString()) as string,
    creado_por: "sistema",
  };
}

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  try {
    const params = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(params.get("page") ?? "1"));
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(params.get("pageSize") ?? "20")),
    );
    const categoria = params.get("categoria");

    // Try new field name first, fall back to old
    let snap: FirebaseFirestore.QuerySnapshot;
    try {
      snap = await adminDb()
        .collection("Movimientos")
        .where("anfitrion_id", "==", uid)
        .orderBy("timestamp", "desc")
        .get();
    } catch {
      snap = await adminDb()
        .collection("Movimientos")
        .where("anfitrion_uid", "==", uid)
        .orderBy("fecha", "desc")
        .get();
    }

    // Also fetch old-format docs if new query returned nothing
    if (snap.empty) {
      try {
        snap = await adminDb()
          .collection("Movimientos")
          .where("anfitrion_uid", "==", uid)
          .orderBy("fecha", "desc")
          .get();
      } catch {
        // No old docs either
      }
    }

    let all = snap.docs.map((doc) =>
      mapMovimiento(doc.id, doc.data() as Record<string, unknown>),
    );

    if (categoria) {
      all = all.filter((m) => m.categoria === categoria);
    }

    const total = all.length;
    const start = (page - 1) * pageSize;
    const items = all.slice(start, start + pageSize);

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    });
  } catch {
    return NextResponse.json({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    });
  }
}
