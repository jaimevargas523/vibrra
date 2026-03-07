import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import YTMusic from "ytmusic-api";

let ytmusic: YTMusic | null = null;

/** Inicializa la instancia una sola vez (singleton). */
async function getYTMusic(): Promise<YTMusic> {
  if (!ytmusic) {
    ytmusic = new YTMusic();
    await ytmusic.initialize({ GL: "CO", HL: "es" });
  }
  return ytmusic;
}

/** Convierte segundos a "M:SS". */
function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const yt = await getYTMusic();
    const raw = await yt.searchSongs(q);
    const results = raw.slice(0, 15).map((song) => ({
      videoId: song.videoId,
      titulo: song.name,
      artista: song.artist?.name ?? "",
      duracion: formatDuration(song.duration ?? 0),
      duracionSeg: song.duration ?? 0,
      imagen: song.thumbnails?.[song.thumbnails.length - 1]?.url ?? "",
      album: song.album?.name ?? "",
    }));

    return NextResponse.json({ results });
  } catch {
    // Si la instancia se corrompió, reiniciar
    ytmusic = null;
    return NextResponse.json({ results: [], error: "Error buscando canciones" }, { status: 500 });
  }
}
