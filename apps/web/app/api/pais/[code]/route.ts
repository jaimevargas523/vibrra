import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPaisConfig } from "@/lib/api/pais-config";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code: rawCode } = await params;
    const code = (rawCode ?? "").toUpperCase();

    if (!code || code.length !== 2) {
      return NextResponse.json(
        {
          error:
            "Codigo de pais invalido. Usa ISO 3166-1 alpha-2 (e.g. CO).",
        },
        { status: 400 },
      );
    }

    const config = await getPaisConfig(code);
    if (!config || !config.activo) {
      return NextResponse.json(
        { error: `Pais no encontrado o no activo: ${code}` },
        { status: 404 },
      );
    }

    return NextResponse.json(config);
  } catch (err) {
    console.error("GET /api/pais/[code] error:", err);
    return NextResponse.json(
      { error: "Error al obtener configuracion del pais." },
      { status: 500 },
    );
  }
}
