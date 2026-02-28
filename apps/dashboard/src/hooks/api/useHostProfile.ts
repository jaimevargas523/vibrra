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
}

export function useHostProfile() {
  return useQuery<HostProfile>({
    queryKey: ["host-profile"],
    queryFn: () => apiGet<HostProfile>("/api/perfil"),
    staleTime: 5 * 60 * 1000,
  });
}
