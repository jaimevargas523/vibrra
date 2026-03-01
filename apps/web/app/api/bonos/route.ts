import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/api/auth";

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({
    bonos: [],
    resumen: {
      total: 0,
      activos: 0,
      reclamados: 0,
      expirados: 0,
      valorTotal: 0,
    },
  });
}
