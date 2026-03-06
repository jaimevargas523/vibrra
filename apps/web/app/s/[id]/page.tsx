import { adminDb, adminRtdb } from "@/lib/api/firebase-admin";
import { notFound } from "next/navigation";
import { SalaCliente } from "./SalaCliente";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SesionPage({ params }: Props) {
  const { id } = await params;

  // 1. Buscar establecimiento en Firestore
  const doc = await adminDb().collection("Negocios").doc(id).get();
  if (!doc.exists) return notFound();

  const data = doc.data()!;
  const nombre = data.nombre ?? "Establecimiento";
  const tipo = data.tipo ?? "bar";
  const ciudad = data.ciudad ?? "";
  const fotoUrl = data.fotoUrl ?? null;
  const precioConexion = data.precio_conexion ?? 0;
  const precioNominacion = data.precio_nominacion ?? 500;

  // 2. Revisar si hay sesion activa en RTDB
  const rtdb = adminRtdb();
  const sesionSnap = await rtdb.ref(`sesiones/${id}/activa`).get();
  const sesionActiva = sesionSnap.val() === true;

  // 3. Leer cancion actual y playlist si hay sesion
  let cancionActual = null;
  let playlist: Array<{
    videoId: string;
    titulo: string;
    artista: string;
    imagen: string;
    origen: string;
    duracion: string;
    puja: number;
    timestamp: number;
  }> = [];

  if (sesionActiva) {
    const [cancionSnap, playlistSnap] = await Promise.all([
      rtdb.ref(`sesiones/${id}/Cancion_reproduccion`).get(),
      rtdb.ref(`sesiones/${id}/playlist`).get(),
    ]);
    cancionActual = cancionSnap.val();

    // Si hay canción sonando, asegurar que la playlist no esté bloqueada
    if (cancionActual) {
      await rtdb.ref(`sesiones/${id}/playlist/bloqueado`).set(false);
    }

    const plData = playlistSnap.val();
    if (plData?.items && typeof plData.items === "object") {
      playlist = Object.entries(plData.items).map(([videoId, val]: [string, any]) => ({
        videoId,
        titulo: val.titulo ?? "",
        artista: val.artista ?? "",
        imagen: val.imagen ?? "",
        origen: val.origen ?? "youtube",
        duracion: val.duracion ?? "",
        puja: val.puja ?? 0,
        timestamp: val.timestamp ?? 0,
      }));
      // Ordenar: mayor puja primero, misma puja → el que llegó primero
      playlist.sort((a, b) => b.puja - a.puja || a.timestamp - b.timestamp);
    }
  }

  return (
    <SalaCliente
      establecimiento={{
        id,
        nombre,
        tipo,
        ciudad,
        fotoUrl,
        precioConexion,
        precioNominacion,
      }}
      sesionActiva={sesionActiva}
      cancionActual={cancionActual}
      playlist={playlist}
    />
  );
}
