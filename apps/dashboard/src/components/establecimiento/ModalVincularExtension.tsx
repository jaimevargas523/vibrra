import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

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

const SCANNER_ID = "vincular-qr-reader";

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
  const [debugInfo, setDebugInfo] = useState("");

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const decodedRef = useRef(false);

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
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : t("errorGenerico");
        setErrorMsg(msg);
        setDebugInfo((prev) => `${prev}\nERR: ${msg}\nTYPE: ${(err as Record<string,unknown>)?.constructor?.name}\nSTATUS: ${(err as Record<string,unknown>)?.status ?? "?"}`);
        setEstado("error");
      }
    },
    [establecimientoId, establecimientoName, t],
  );

  const startScanning = useCallback(() => {
    setEstado("scanning");
    setCameraError(false);
    decodedRef.current = false;

    // Delay to let DOM mount the container
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode(SCANNER_ID);
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

            // Extract UUID from known formats
            const match = decodedText.match(
              /(?:vibrra\.live\/vincular\/|vibrra:\/\/ext\/)([0-9a-f-]{36})/i,
            );
            const extensionId = match ? match[1] : decodedText;
            setDebugInfo(`RAW: ${decodedText}\nID: ${extensionId}\nEST: ${establecimientoId}`);
            vincular(extensionId);
          },
          () => {
            // no QR found in frame — ignore
          },
        );
      } catch {
        setCameraError(true);
      }
    }, 100);
  }, [establecimientoId, vincular, stopScanner]);

  // Auto-start scanning when modal opens; reset on close
  useEffect(() => {
    if (open) {
      startScanning();
    } else {
      stopScanner();
      setEstado("idle");
      setErrorMsg("");
      setSuccessName("");
      setCameraError(false);
      decodedRef.current = false;
    }
  }, [open, stopScanner, startScanning]);

  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

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
            {!cameraError ? (
              <>
                <div
                  id={SCANNER_ID}
                  className="max-h-[300px] overflow-hidden"
                />
                <p className="text-xs text-text-muted text-center py-3">
                  {t("instruccion")}
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] gap-3 p-4">
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
            {debugInfo && (
              <pre className="text-[10px] text-text-muted bg-card-dark rounded p-2 w-full overflow-x-auto whitespace-pre-wrap break-all">
                {debugInfo}
              </pre>
            )}
            <Button variant="ghost" onClick={startScanning}>
              {t("volverEscanear")}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
