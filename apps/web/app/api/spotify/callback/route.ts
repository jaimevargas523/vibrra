import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createHmac } from "crypto";
import { adminRtdb } from "@/lib/api/firebase-admin";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const SECRET = process.env.SPOTIFY_CLIENT_SECRET!;

function verifyState(state: string): { visitorId: string; returnUrl: string } | null {
  const [payloadB64, signature] = state.split(".");
  if (!payloadB64 || !signature) return null;

  const payload = Buffer.from(payloadB64, "base64url").toString("utf-8");
  const expected = createHmac("sha256", SECRET).update(payload).digest("hex");
  if (signature !== expected) return null;

  try {
    const data = JSON.parse(payload);
    return { visitorId: data.visitorId, returnUrl: data.returnUrl };
  } catch {
    return null;
  }
}

async function spotifyFetch(url: string, token: string) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);
  return res.json();
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  // User denied access
  if (error) {
    const stateData = state ? verifyState(state) : null;
    const returnUrl = stateData?.returnUrl || "/";
    return NextResponse.redirect(new URL(returnUrl, req.url));
  }

  if (!code || !state) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  // Verify state
  const stateData = verifyState(state);
  if (!stateData) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 403 });
  }

  const { visitorId, returnUrl } = stateData;

  // Build redirect URI (must match login route exactly)
  const host = req.headers.get("host") || "localhost:3000";
  const isDev = host.includes("localhost") || host.includes("127.0.0.1");
  const redirectUri = isDev
    ? "http://127.0.0.1:3000/api/spotify/callback"
    : `https://${host}/api/spotify/callback`;

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${SECRET}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("Spotify token error:", err);
      return NextResponse.redirect(new URL(returnUrl, req.url));
    }

    const { access_token } = await tokenRes.json();

    // Fetch user data from Spotify in parallel
    const [me, topArtists, topTracks, playlists] = await Promise.all([
      spotifyFetch("https://api.spotify.com/v1/me", access_token),
      spotifyFetch("https://api.spotify.com/v1/me/top/artists?limit=20&time_range=medium_term", access_token),
      spotifyFetch("https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=medium_term", access_token),
      spotifyFetch("https://api.spotify.com/v1/me/playlists?limit=20", access_token),
    ]);

    // Transform to lean structure (no Spotify IDs)
    const spotifyData = {
      connected: true,
      importedAt: Date.now(),
      displayName: me.display_name || "Spotify",
      topArtists: topArtists.items.map((a: any) => ({
        name: a.name,
        genres: (a.genres || []).slice(0, 3),
        imageUrl: a.images?.[0]?.url || "",
      })),
      topTracks: topTracks.items.map((t: any) => ({
        name: t.name,
        artist: t.artists?.map((a: any) => a.name).join(", ") || "",
        album: t.album?.name || "",
        imageUrl: t.album?.images?.[0]?.url || "",
      })),
      playlists: playlists.items
        .filter((p: any) => p !== null)
        .map((p: any) => ({
          name: p.name,
          trackCount: p.tracks?.total || 0,
          imageUrl: p.images?.[0]?.url || "",
        })),
    };

    // Write to RTDB
    const rtdb = adminRtdb();
    await rtdb.ref(`Anonimos/${visitorId}/spotify`).set(spotifyData);

    // Redirect back to sala with success param
    const redirectUrl = new URL(returnUrl, req.url);
    redirectUrl.searchParams.set("spotify", "connected");
    return NextResponse.redirect(redirectUrl.toString());
  } catch (err) {
    console.error("Spotify callback error:", err);
    return NextResponse.redirect(new URL(returnUrl, req.url));
  }
}
