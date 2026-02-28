import { useTranslation } from "react-i18next";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  Info,
} from "lucide-react";
import clsx from "clsx";

import { useDocumentos, type Documento } from "@/hooks/api/useDocumentos";
import { usePais } from "@/hooks/api/usePais";
import { formatShortDate } from "@/lib/format";

/* ── Status helpers ─────────────────────────────────────────── */

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "signed":
    case "aprobado":
      return <CheckCircle className="w-5 h-5 text-success" />;
    case "pending":
    case "pendiente":
      return <Clock className="w-5 h-5 text-warning" />;
    case "expired":
    case "rechazado":
      return <XCircle className="w-5 h-5 text-error" />;
    default:
      return <AlertCircle className="w-5 h-5 text-text-muted" />;
  }
}

function statusLabel(status: string, t: (key: string) => string) {
  switch (status) {
    case "signed":
      return t("estados.aprobado");
    case "pending":
      return t("estados.pendiente");
    case "expired":
      return t("estados.rechazado");
    default:
      return t("estados.sinSubir");
  }
}

/* ── Tab ─────────────────────────────────────────────────────── */

interface Props {
  establecimientoId: string;
  establecimientoName: string;
}

export function TabDocumentos({ establecimientoId, establecimientoName }: Props) {
  const { t } = useTranslation("documentos");
  const { data: documentos } = useDocumentos();
  const { data: pais } = usePais();

  const requiredDocs = pais?.documentosEstablecimiento ?? [];

  // Map uploaded docs by type
  const docMap = new Map<string, Documento>();
  documentos?.forEach((d) => {
    docMap.set(d.type, d);
  });

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="bg-info/10 border border-info/30 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-info shrink-0 mt-0.5" />
        <p className="text-sm text-text-secondary">{t("banner")}</p>
      </div>

      {/* Document cards */}
      <div className="space-y-3">
        {requiredDocs.map((reqDoc) => {
          const uploaded = docMap.get(reqDoc.key);
          const status = uploaded?.status ?? "none";

          return (
            <div
              key={reqDoc.key}
              className="rounded-xl border border-border bg-surface p-5 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                <StatusIcon status={status} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-text-primary">
                      {t(reqDoc.labelKey)}
                    </p>
                  </div>
                  {uploaded ? (
                    <p className="text-xs text-text-muted mt-0.5">
                      {uploaded.name} &middot;{" "}
                      {formatShortDate(new Date(uploaded.createdAt))} &middot;{" "}
                      <span
                        className={clsx(
                          "font-medium",
                          status === "signed"
                            ? "text-success"
                            : status === "pending"
                              ? "text-warning"
                              : "text-error"
                        )}
                      >
                        {statusLabel(status, t)}
                      </span>
                    </p>
                  ) : (
                    <p className="text-xs text-text-muted mt-0.5">
                      {t("estados.sinSubir")}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors shrink-0 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                {t("subirArchivo")}
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
}
