import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export interface Documento {
  id: string;
  type: "contrato" | "factura" | "certificado" | "otro";
  name: string;
  description: string | null;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  status: "pending" | "signed" | "expired";
  createdAt: string;
  expiresAt: string | null;
}

export function useDocumentos() {
  return useQuery<Documento[]>({
    queryKey: ["documentos"],
    queryFn: () => apiGet<Documento[]>("/api/documentos"),
    staleTime: 10 * 60 * 1000,
  });
}
