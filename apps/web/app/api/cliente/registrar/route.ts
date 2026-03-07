import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminAuth, adminDb, adminRtdb } from "@/lib/api/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const BONO_REGISTRO_CANCIONES = 3;
const BONO_REGISTRO_CONEXIONES = 1;

/**
 * POST /api/cliente/registrar
 * Called after Firebase Auth sign-in on the client side.
 * Creates Clientes/{uid} in Firestore and migrates data from Anonimos/{visitorId}.
 *
 * Headers: Authorization: Bearer <idToken>
 * Body: { visitorId?: string, estId: string, displayName: string, phone?: string, email?: string, photoURL?: string }
 */
export async function POST(req: NextRequest) {
  try {
    // Verify ID token
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await adminAuth().verifyIdToken(token);
    const uid = decoded.uid;

    const body = await req.json();
    const { visitorId, estId, displayName, phone, email, photoURL } = body;

    if (!estId || typeof estId !== "string") {
      return NextResponse.json({ error: "estId requerido" }, { status: 400 });
    }

    const db = adminDb();
    const clienteRef = db.collection("Clientes").doc(uid);
    const existingSnap = await clienteRef.get();

    // Returning registered user
    if (existingSnap.exists) {
      const data = existingSnap.data()!;
      return NextResponse.json({
        uid,
        saldo: data.saldo ?? 0,
        bonos: {
          conexionesGratis: data.bonos_conexiones ?? 0,
          nominacionesGratis: data.bonos_canciones ?? 0,
        },
        isNew: false,
      });
    }

    // New registration — migrate from anonymous if visitorId provided
    let migratedSaldo = 0;
    let migratedBonos = { conexionesGratis: 0, nominacionesGratis: 0 };
    let spotifyData: Record<string, unknown> | null = null;

    if (visitorId && typeof visitorId === "string") {
      const rtdb = adminRtdb();
      const anonRef = rtdb.ref(`Anonimos/${visitorId}`);
      const anonSnap = await anonRef.get();

      if (anonSnap.exists()) {
        const anonData = anonSnap.val();
        migratedSaldo = anonData.saldo ?? 0;
        migratedBonos = {
          conexionesGratis: anonData.bonos?.conexionesGratis ?? 0,
          nominacionesGratis: anonData.bonos?.nominacionesGratis ?? 0,
        };
        if (anonData.spotify?.connected) {
          spotifyData = anonData.spotify;
        }

        // Mark anonymous profile as migrated
        await anonRef.update({ migrated_to: uid });
      }
    }

    // Build providers list from decoded token
    const providers = decoded.firebase?.sign_in_provider
      ? [decoded.firebase.sign_in_provider]
      : [];

    // Create Clientes/{uid}
    const clienteData: Record<string, unknown> = {
      uid,
      displayName: displayName || decoded.name || "Cliente",
      alias: displayName || decoded.name || "",
      saldo: migratedSaldo,
      bonos_canciones: migratedBonos.nominacionesGratis + BONO_REGISTRO_CANCIONES,
      bonos_conexiones: migratedBonos.conexionesGratis + BONO_REGISTRO_CONEXIONES,
      providers,
      pais: "CO",
      primer_establecimiento: estId,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    };

    if (phone) clienteData.phone = phone;
    if (email) clienteData.email = email;
    if (photoURL) clienteData.photoURL = photoURL;
    if (visitorId) clienteData.migratedFrom = visitorId;
    if (spotifyData) clienteData.spotify = spotifyData;

    await clienteRef.set(clienteData);

    return NextResponse.json({
      uid,
      saldo: migratedSaldo,
      bonos: {
        conexionesGratis: migratedBonos.conexionesGratis + BONO_REGISTRO_CONEXIONES,
        nominacionesGratis: migratedBonos.nominacionesGratis + BONO_REGISTRO_CANCIONES,
      },
      isNew: true,
      migratedSaldo,
    });
  } catch (err: any) {
    console.error("Error registrando cliente:", err);
    if (err?.code === "auth/id-token-expired" || err?.code === "auth/argument-error") {
      return NextResponse.json({ error: "Token invalido o expirado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Error registrando cliente" }, { status: 500 });
  }
}
