import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/api/auth";

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({
    kpis: {
      totalSesiones: 0,
      totalCanciones: 0,
      ingresoTotal: 0,
      promedioSesion: 0,
    },
    heatmap: [],
    generos: [],
    perfilCliente: [],
  });
}
