import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/api/auth";

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (auth instanceof NextResponse) return auth;

  const period = req.nextUrl.searchParams.get("period") ?? "7d";
  return NextResponse.json({ data: [], period });
}
