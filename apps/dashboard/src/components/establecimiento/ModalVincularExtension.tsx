import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import jsQR from "jsqr";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { apiPost } from "@/lib/api-client";

type Estado = "idle" | "scanning" | "processing" | "success" | "error";

interface Props {
  open: boolean;
  onClose: () => void;
  establecimientoId: string;
  establecimientoName: string;
}

export function ModalVincularExtension({
  open,
  onClose,
  establecimientoId,
  establecimientoName,
}: Props) {
  const { t } = useTranslation("vincular");

  const [estado, setEstado] = useState<Estado>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [successName, setSuccessName] = useState("");
  const [cameraError, setCameraError] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const vincular = useCallback(
    async (extensionId: string) => {
      if (!establecimientoId || !extensionId.trim()) return;

      setEstado("processing");
      setErrorMsg("");

      try {
        const res = await apiPost<{ ok: boolean; establecimiento: string }>(
          "/api/extension/vincular-qr",
          { extensionId: extensionId.trim(), establecimientoId },
        );
        setSuccessName(res.establecimiento || establecimientoName);
        setEstado("success");
        stopCamera();
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : t("errorGenerico");
        setErrorMsg(msg);
        setEstado("error");
      }
    },
    [establecimientoId, establecimientoName, stopCamera, t],
  );

  const startScanning = useCallback(() => {
    setEstado("scanning");
    setCameraError(false);

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .catch(() => navigator.mediaDevices.getUserMedia({ video: true }))
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      })
      .catch(() => {
        setCameraError(true);
      });
  }, []);

  // QR scanning loop
  useEffect(() => {
    if (estado !== "scanning" || cameraError) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let active = true;

    const scan = () => {
      if (!active || video.readyState < video.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(scan);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && code.data) {
        const raw = code.data;
        // Extract UUID from known formats:
        // https://vibrra.live/vincular/UUID  or  vibrra://ext/UUID  or raw UUID
        const match = raw.match(
          /(?:vibrra\.live\/vincular\/|vibrra:\/\/ext\/)([0-9a-f-]{36})/i,
        );
        const extensionId = match ? match[1] : raw;
        vincular(extensionId);
        return;
      }

      rafRef.current = requestAnimationFrame(scan);
    };

    rafRef.current = requestAnimationFrame(scan);

    return () => {
      active = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
  }, [estado, cameraError, vincular]);

  // Auto-start scanning when modal opens; reset on close
  useEffect(() => {
    if (open) {
      startScanning();
    } else {
      stopCamera();
      setEstado("idle");
      setErrorMsg("");
      setSuccessName("");
      setCameraError(false);
    }
  }, [open, stopCamera, startScanning]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <Modal open={open} onClose={onClose} title={t("title")} size="md">
      <div className="space-y-4">
        <p className="text-xs text-text-muted text-center">
          {establecimientoName}
        </p>

        {/* Estado: idle — opciones para escanear */}
        {estado === "idle" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center">
              <Camera className="w-7 h-7 text-gold" />
            </div>
            <p className="text-sm text-text-secondary text-center max-w-xs">
              {t("subtitle")}
            </p>
            <Button onClick={startScanning} className="w-full max-w-xs">
              <Camera className="w-4 h-4" />
              {t("escanear")}
            </Button>
          </div>
        )}

        {/* Estado: scanning — cámara activa */}
        {estado === "scanning" && (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="relative aspect-square bg-black max-h-[300px]">
              {!cameraError ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  {/* Scan frame overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-40 h-40 relative">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-gold rounded-tl" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-gold rounded-tr" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-gold rounded-bl" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-gold rounded-br" />
                      <div className="absolute left-2 right-2 h-0.5 bg-gold/60 animate-pulse top-1/2" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 p-4">
                  <Camera className="w-10 h-10 text-text-muted" />
                  <p className="text-xs text-text-muted text-center">
                    {t("errorCamara")}
                  </p>
                  <Button variant="ghost" size="sm" onClick={startScanning}>
                    {t("reintentar")}
                  </Button>
                </div>
              )}
            </div>
            <p className="text-xs text-text-muted text-center py-3">
              {t("instruccion")}
            </p>
          </div>
        )}

        {/* Estado: processing */}
        {estado === "processing" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="w-10 h-10 text-gold animate-spin" />
            <p className="text-sm text-text-secondary">{t("procesando")}</p>
          </div>
        )}

        {/* Estado: success */}
        {estado === "success" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-14 h-14 rounded-full bg-green/10 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-green" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-text-primary">
                {t("exito")}
              </p>
              <p className="text-sm text-text-secondary mt-1">
                {t("exitoDesc", { nombre: successName })}
              </p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              {t("common:buttons.confirmar")}
            </Button>
          </div>
        )}

        {/* Estado: error */}
        {estado === "error" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-error" />
            </div>
            <p className="text-sm text-error text-center">
              {errorMsg || t("errorGenerico")}
            </p>
            <Button variant="ghost" onClick={startScanning}>
              {t("volverEscanear")}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
