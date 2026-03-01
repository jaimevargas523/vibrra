import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminAuth } from "./firebase-admin";

/**
 * Verify Firebase ID token from the Authorization header.
 * Returns the uid string on success, or a 401 NextResponse on failure.
 */
export async function verifyAuth(
  req: NextRequest,
): Promise<string | NextResponse> {
  const header = req.headers.get("authorization");

  if (!header || !header.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Token de autenticacion requerido." },
      { status: 401 },
    );
  }

  const token = header.slice(7);

  // Dev bypass
  if (process.env.NODE_ENV !== "production" && token === "dev-mock-token") {
    return "mock-host-uid-001";
  }

  try {
    const decoded = await adminAuth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return NextResponse.json(
      { error: "Token invalido o expirado." },
      { status: 401 },
    );
  }
}
