import { useRef, useEffect, useCallback, useState } from "react";
import { X, Camera, Loader2 } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import type { RecargaStatus } from "@/hooks/useRecargaCliente";

interface Props {
  open: boolean;
  status: RecargaStatus;
  onQrDecodificado: (clienteId: string) => void;
  onCancelar: () => void;
}

export function ModalEscanerQR({ open, status, onQrDecodificado, onCancelar }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const decodedRef = useRef(false);
  const [cameraError, setCameraError] = useState(false);
  const containerId = "qr-reader";

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2 /* SCANNING */) {
          await scannerRef.current.stop();
        }
      } catch {
        // ignore
      }
      scannerRef.current.clear();
      scannerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!open || status === "processing") {
      stopScanner();
      if (!open) {
        setCameraError(false);
        decodedRef.current = false;
      }
      return;
    }

    decodedRef.current = false;

    // Pequeño delay para que el DOM monte el contenedor
    const timer = setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: (vw: number, vh: number) => {
              const size = Math.min(vw, vh) * 0.7;
              return { width: size, height: size };
            },
          },
          (decodedText) => {
            if (decodedRef.current) return;
            decodedRef.current = true;
            stopScanner();
            onQrDecodificado(decodedText);
          },
          () => {
            // frame sin QR detectado — ignorar
          },
        );
      } catch {
        setCameraError(true);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [open, status, onQrDecodificado, stopScanner]);

  if (!open) return null;

  const isProcessing = status === "processing";

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
        <div className="p-4">
          {isProcessing ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-10 h-10 text-gold animate-spin" />
              <p className="text-sm text-text-secondary">Procesando recarga...</p>
            </div>
          ) : cameraError ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Camera className="w-10 h-10 text-text-muted" />
              <p className="text-xs text-text-muted text-center">
                No se pudo acceder a la cámara.
              </p>
            </div>
          ) : (
            <>
              <div
                id={containerId}
                className="rounded-xl overflow-hidden"
              />
              <p className="text-center text-xs text-text-muted mt-3">
                Apunta al QR del cliente
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
