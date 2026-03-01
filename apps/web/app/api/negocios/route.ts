import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminDb } from "@/lib/api/firebase-admin";
import { verifyAuth } from "@/lib/api/auth";

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  try {
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

    return NextResponse.json(negocios);
  } catch (err) {
    console.error("GET /api/negocios error:", err);
    return NextResponse.json(
      { error: "Error al obtener establecimientos." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  try {
    const body = (await req.json()) as Record<string, unknown>;

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
    return NextResponse.json({ id: ref.id, ...newDoc }, { status: 201 });
  } catch (err) {
    console.error("POST /api/negocios error:", err);
    return NextResponse.json(
      { error: "Error al crear negocio." },
      { status: 500 },
    );
  }
}
