import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export interface HostProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  phone: string | null;
  role: string;
  plan: string;
  pais: string;
  createdAt: string;
  establishmentCount: number;
  saldoBono: number;
  registroCompleto: boolean;
  bonoDisponible: boolean;
  // Bank account
  banco: string | null;
  tipoCuenta: string | null;
  numeroCuenta: string | null;
  titularCuenta: string | null;
  // Tax info
  tipoPersona: string | null;
  nit: string | null;
  regimen: string | null;
  responsableIva: boolean | null;
}

export function useHostProfile() {
  return useQuery<HostProfile>({
    queryKey: ["host-profile"],
    queryFn: () => apiGet<HostProfile>("/api/perfil"),
    staleTime: 5 * 60 * 1000,
  });
}
