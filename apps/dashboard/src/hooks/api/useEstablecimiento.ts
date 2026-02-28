import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export interface EstablecimientoDetail {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  departamento: string;
  zona: string;
  slug: string;
  type: string;
  isActive: boolean;
  imageUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  horarios: Record<string, { open: string; close: string }>;
  qrCodes: { id: string; label: string; url: string }[];
  precioConexion: number;
  precioNominacion: number;
  precioPujaMin: number;
  precioDedicatoria: number;
  modoMusica: boolean;
  visibleMapa: boolean;
  stats: {
    totalSesiones: number;
    totalRecaudado: number;
    totalCanciones: number;
    promedioSesion: number;
  };
  createdAt: string;
}

export function useEstablecimiento(id: string | null) {
  return useQuery<EstablecimientoDetail>({
    queryKey: ["establecimiento", id],
    queryFn: () => apiGet<EstablecimientoDetail>(`/api/negocios/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}
