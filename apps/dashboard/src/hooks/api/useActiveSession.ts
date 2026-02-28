import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export interface ActiveSession {
  id: string;
  establishmentId: string;
  establishmentName: string;
  startedAt: string;
  totalRecaudado: number;
  totalCanciones: number;
  connectedUsers: number;
  queueLength: number;
  currentSong: {
    id: string;
    title: string;
    artist: string;
    requestedBy: string;
    amount: number;
    startedAt: string;
  } | null;
}

export function useActiveSession() {
  return useQuery<ActiveSession | null>({
    queryKey: ["active-session"],
    queryFn: () => apiGet<ActiveSession | null>("/api/sesiones/active"),
    staleTime: 10 * 1000,
    refetchInterval: 30 * 1000,
  });
}
