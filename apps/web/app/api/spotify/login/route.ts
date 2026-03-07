import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createHmac, randomBytes } from "crypto";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const SECRET = process.env.SPOTIFY_CLIENT_SECRET!;

function signState(data: string): string {
  return createHmac("sha256", SECRET).update(data).digest("hex");
}

export async function GET(req: NextRequest) {
  const visitorId = req.nextUrl.searchParams.get("visitorId");
  const returnUrl = req.nextUrl.searchParams.get("returnUrl") || "/";

  if (!visitorId) {
    return NextResponse.json({ error: "visitorId requerido" }, { status: 400 });
  }

  if (!CLIENT_ID || !SECRET) {
    return NextResponse.json({ error: "Spotify no configurado" }, { status: 500 });
  }

  // Build state with CSRF token
  const csrf = randomBytes(16).toString("hex");
  const statePayload = JSON.stringify({ visitorId, returnUrl, csrf });
  const signature = signState(statePayload);
  const state = Buffer.from(statePayload).toString("base64url") + "." + signature;

  // Determine redirect URI based on environment
  const host = req.headers.get("host") || "localhost:3000";
  const isDev = host.includes("localhost") || host.includes("127.0.0.1");
  const redirectUri = isDev
    ? "http://127.0.0.1:3000/api/spotify/callback"
    : `https://${host}/api/spotify/callback`;

  const scopes = "user-top-read playlist-read-private";
  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.searchParams.set("client_id", CLIENT_ID);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("show_dialog", "false");

  return NextResponse.redirect(authUrl.toString());
}
