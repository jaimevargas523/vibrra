import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminDb } from "@/lib/api/firebase-admin";
import { verifyAuth } from "@/lib/api/auth";

type LangMap = Record<string, string>;

function resolve(field: unknown, lang: string): string {
  if (!field || typeof field !== "object") return String(field ?? "");
  const map = field as LangMap;
  return map[lang] ?? map["es"] ?? Object.values(map)[0] ?? "";
}

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  try {
    const lang = (req.headers.get("accept-language") ?? "es").slice(0, 2);
    const now = new Date();

    // 1. Global messages targeting "Anfitriones"
    const globalSnap = await adminDb()
      .collection("Mensajes")
      .where("destinatarios", "array-contains", "Anfitriones")
      .where("activo", "==", true)
      .get();

    // 2. Already-read global message IDs
    const leidosSnap = await adminDb()
      .collection("Anfitriones")
      .doc(uid)
      .collection("MensajesLeidos")
      .get();
    const leidosSet = new Set(leidosSnap.docs.map((d) => d.id));

    // 3. Personal messages
    const personalSnap = await adminDb()
      .collection("Anfitriones")
      .doc(uid)
      .collection("Mensajes")
      .get();

    const mensajes: Array<Record<string, unknown>> = [];

    for (const doc of globalSnap.docs) {
      if (leidosSet.has(doc.id)) continue;

      const data = doc.data();

      const inicio = data.fechaInicio?.toDate?.() ?? null;
      const fin = data.fechaFin?.toDate?.() ?? null;
      if (inicio && now < inicio) continue;
      if (fin && now > fin) continue;

      mensajes.push({
        id: doc.id,
        tipo: "global",
        titulo: resolve(data.titulo, lang),
        descripcion: resolve(data.descripcion, lang),
        estilo: data.estilo ?? "info",
        icono: data.icono ?? "info",
        cta: data.cta
          ? { texto: resolve(data.cta.texto, lang), ruta: data.cta.ruta }
          : null,
        createdAt:
          data.createdAt?.toDate?.()?.toISOString?.() ??
          new Date().toISOString(),
      });
    }

    for (const doc of personalSnap.docs) {
      const data = doc.data();
      mensajes.push({
        id: doc.id,
        tipo: "personal",
        titulo: resolve(data.titulo, lang),
        descripcion: resolve(data.descripcion, lang),
        estilo: data.estilo ?? "info",
        icono: data.icono ?? "info",
        cta: data.cta
          ? { texto: resolve(data.cta.texto, lang), ruta: data.cta.ruta }
          : null,
        createdAt:
          data.createdAt?.toDate?.()?.toISOString?.() ??
          new Date().toISOString(),
      });
    }

    mensajes.sort(
      (a, b) =>
        new Date(b.createdAt as string).getTime() -
        new Date(a.createdAt as string).getTime(),
    );

    return NextResponse.json(mensajes);
  } catch (err) {
    console.error("GET /api/mensajes error:", err);
    return NextResponse.json(
      { error: "Error al obtener mensajes." },
      { status: 500 },
    );
  }
}
