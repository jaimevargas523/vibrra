import { useState, useRef, useEffect } from "react";
import { X, Camera, Loader2 } from "lucide-react";
import type { RecargaStatus } from "@/hooks/useRecargaCliente";

interface Props {
  open: boolean;
  status: RecargaStatus;
  onQrDecodificado: (clienteId: string) => void;
  onCancelar: () => void;
}

export function ModalEscanerQR({ open, status, onQrDecodificado, onCancelar }: Props) {
  const [manualId, setManualId] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState(false);

  useEffect(() => {
    if (!open) {
      // Cleanup camera on close
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setCameraError(false);
      setManualId("");
      return;
    }

    // Try to access camera
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        setCameraError(true);
      });

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [open]);

  if (!open) return null;

  const isProcessing = status === "processing";

  const handleManualSubmit = () => {
    const id = manualId.trim();
    if (id) onQrDecodificado(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={!isProcessing ? onCancelar : undefined}
      />

      {/* Modal */}
      <div className="relative bg-surface rounded-2xl border border-border w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-gold" />
            <span className="text-sm font-semibold text-text-primary">Escanear QR</span>
          </div>
          {!isProcessing && (
            <button
              type="button"
              onClick={onCancelar}
              className="p-1 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-text-muted" />
            </button>
          )}
        </div>

        {/* Scanner area */}
        <div className="p-4 space-y-4">
          {isProcessing ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-10 h-10 text-gold animate-spin" />
              <p className="text-sm text-text-secondary">Procesando recarga...</p>
            </div>
          ) : (
            <>
              {/* Camera preview */}
              <div className="relative aspect-square bg-black rounded-xl overflow-hidden">
                {!cameraError ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {/* Scan frame overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 relative">
                        {/* Corners */}
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-gold rounded-tl" />
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-gold rounded-tr" />
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-gold rounded-bl" />
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-gold rounded-br" />
                        {/* Scan line */}
                        <div className="absolute left-2 right-2 h-0.5 bg-gold/60 animate-pulse top-1/2" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2 p-4">
                    <Camera className="w-10 h-10 text-text-muted" />
                    <p className="text-xs text-text-muted text-center">
                      No se pudo acceder a la camara.
                      Ingresa el ID del cliente manualmente.
                    </p>
                  </div>
                )}
              </div>

              {/* Manual input fallback */}
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold">
                  O INGRESA EL CODIGO DEL CLIENTE
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    placeholder="ID o codigo del cliente"
                    className="flex-1 bg-card-dark border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-gold outline-none placeholder-text-muted"
                    onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                  />
                  <button
                    type="button"
                    onClick={handleManualSubmit}
                    disabled={!manualId.trim()}
                    className="px-4 py-2.5 rounded-lg bg-gold text-[#0A0A0A] text-sm font-bold disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
                  >
                    OK
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
