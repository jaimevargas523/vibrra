import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminDb } from "@/lib/api/firebase-admin";
import { verifyAuth } from "@/lib/api/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const snap = await adminDb().collection("Negocios").doc(id).get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: "Negocio no encontrado." },
        { status: 404 },
      );
    }

    const d = snap.data()!;
    return NextResponse.json({
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
      createdAt:
        d.createdAt?.toDate?.()?.toISOString?.() ?? d.createdAt ?? null,
    });
  } catch (err) {
    console.error("GET /api/negocios/[id] error:", err);
    return NextResponse.json(
      { error: "Error al obtener negocio." },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const docRef = adminDb().collection("Negocios").doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: "Negocio no encontrado." },
        { status: 404 },
      );
    }

    const body = (await req.json()) as Record<string, unknown>;
    delete body.id;
    delete body.anfitrionId;

    await docRef.update(body);
    const updated = await docRef.get();
    return NextResponse.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error("PUT /api/negocios/[id] error:", err);
    return NextResponse.json(
      { error: "Error al actualizar negocio." },
      { status: 500 },
    );
  }
}
