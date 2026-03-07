import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminRtdb } from "@/lib/api/firebase-admin";
import YTMusic from "ytmusic-api";

let ytmusic: YTMusic | null = null;

async function getYTMusic(): Promise<YTMusic> {
  if (!ytmusic) {
    ytmusic = new YTMusic();
    await ytmusic.initialize({ GL: "CO", HL: "es" });
  }
  return ytmusic;
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// In-memory cache: visitorId -> { data, expiry }
const cache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function GET(req: NextRequest) {
  const visitorId = req.nextUrl.searchParams.get("visitorId");
  if (!visitorId) {
    return NextResponse.json({ error: "visitorId requerido" }, { status: 400 });
  }

  // Check cache
  const cached = cache.get(visitorId);
  if (cached && cached.expiry > Date.now()) {
    return NextResponse.json(cached.data);
  }

  try {
    const rtdb = adminRtdb();
    const snap = await rtdb.ref(`Anonimos/${visitorId}/spotify`).get();
    const spotify = snap.val();

    if (!spotify?.connected) {
      return NextResponse.json({ suggestions: [] });
    }

    const yt = await getYTMusic();
    const suggestions: { category: string; items: any[] }[] = [];
    const seenVideoIds = new Set<string>();

    // Search for top artists (pick first 5, get 3 songs each)
    const topArtists = (spotify.topArtists || []).slice(0, 5);
    if (topArtists.length > 0) {
      const artistResults: any[] = [];
      const artistSearches = topArtists.map(async (artist: any) => {
        try {
          const raw = await yt.searchSongs(artist.name);
          return raw.slice(0, 3).map((song) => ({
            videoId: song.videoId,
            titulo: song.name,
            artista: song.artist?.name ?? "",
            duracion: formatDuration(song.duration ?? 0),
            duracionSeg: song.duration ?? 0,
            imagen: song.thumbnails?.[song.thumbnails.length - 1]?.url ?? "",
            album: song.album?.name ?? "",
          }));
        } catch {
          return [];
        }
      });

      const results = await Promise.all(artistSearches);
      for (const songs of results) {
        for (const song of songs) {
          if (!seenVideoIds.has(song.videoId)) {
            seenVideoIds.add(song.videoId);
            artistResults.push(song);
          }
        }
      }

      if (artistResults.length > 0) {
        suggestions.push({ category: "Tus artistas", items: artistResults });
      }
    }

    // Search for top tracks (pick first 10)
    const topTracks = (spotify.topTracks || []).slice(0, 10);
    if (topTracks.length > 0) {
      const trackResults: any[] = [];
      const trackSearches = topTracks.map(async (track: any) => {
        try {
          const query = `${track.name} ${track.artist}`;
          const raw = await yt.searchSongs(query);
          if (raw.length > 0) {
            const song = raw[0];
            return {
              videoId: song.videoId,
              titulo: song.name,
              artista: song.artist?.name ?? "",
              duracion: formatDuration(song.duration ?? 0),
              duracionSeg: song.duration ?? 0,
              imagen: song.thumbnails?.[song.thumbnails.length - 1]?.url ?? "",
              album: song.album?.name ?? "",
            };
          }
          return null;
        } catch {
          return null;
        }
      });

      const results = await Promise.all(trackSearches);
      for (const song of results) {
        if (song && !seenVideoIds.has(song.videoId)) {
          seenVideoIds.add(song.videoId);
          trackResults.push(song);
        }
      }

      if (trackResults.length > 0) {
        suggestions.push({ category: "Tus canciones", items: trackResults });
      }
    }

    const responseData = { suggestions };

    // Cache result
    cache.set(visitorId, { data: responseData, expiry: Date.now() + CACHE_TTL });

    return NextResponse.json(responseData);
  } catch (err) {
    console.error("Spotify suggestions error:", err);
    ytmusic = null;
    return NextResponse.json({ suggestions: [], error: "Error generando sugerencias" }, { status: 500 });
  }
}
