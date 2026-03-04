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

  // 2. Revisar si hay sesion activa en RTDB
  const rtdb = adminRtdb();
  const sesionSnap = await rtdb.ref(`sesiones/${id}/activa`).get();
  const sesionActiva = sesionSnap.val() === true;

  // 3. Leer cancion actual, cola y playlist si hay sesion
  let cancionActual = null;
  let cola: Array<{
    id: string;
    titulo: string;
    artista: string;
    fuente: string;
    fuente_id: string;
    duracion_ms: number;
    puja_mayor: number;
    tipo: string;
    timestamp: number;
  }> = [];

  if (sesionActiva) {
    const [cancionSnap, colaSnap] = await Promise.all([
      rtdb.ref(`sesiones/${id}/cancion_actual`).get(),
      rtdb.ref(`sesiones/${id}/cola`).get(),
    ]);
    cancionActual = cancionSnap.val();
    const colaData = colaSnap.val();
    if (colaData) {
      cola = Object.entries(colaData).map(([key, val]: [string, any]) => ({
        id: key,
        titulo: val.titulo ?? "",
        artista: val.artista ?? "",
        fuente: val.fuente ?? "youtube",
        fuente_id: val.fuente_id ?? "",
        duracion_ms: val.duracion_ms ?? 0,
        puja_mayor: val.puja_mayor ?? 0,
        tipo: val.tipo ?? "normal",
        timestamp: val.timestamp ?? 0,
      }));
      // Ordenar: pujas más altas primero, luego por timestamp
      cola.sort((a, b) => {
        if (a.puja_mayor !== b.puja_mayor) return b.puja_mayor - a.puja_mayor;
        return a.timestamp - b.timestamp;
      });
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
      }}
      sesionActiva={sesionActiva}
      cancionActual={cancionActual}
      cola={cola}
    />
  );
}
