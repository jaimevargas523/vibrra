import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export interface QrCode {
  id: string;
  establishmentId: string;
  establishmentName: string;
  label: string;
  url: string;
  scans: number;
  isActive: boolean;
  createdAt: string;
  style: {
    foreground: string;
    background: string;
    logo: boolean;
  };
}

export function useQrs() {
  return useQuery<QrCode[]>({
    queryKey: ["qrs"],
    queryFn: () => apiGet<QrCode[]>("/api/qrs"),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
