import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Download, Link as LinkIcon, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import clsx from "clsx";

import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

import { useQrs } from "@/hooks/api/useQrs";
import { useEstablecimientos } from "@/hooks/api/useEstablecimientos";
import { useSessionStore } from "@/stores/session.store";

/* ── Fallback data ───────────────────────────────────────────── */

interface EstQr {
  id: string;
  name: string;
  emoji: string;
  city: string;
  isLive: boolean;
  slug: string;
  scans: number;
  liveUsers: number;
  registrationRate: number;
}

const fallbackEstablishments: EstQr[] = [
  {
    id: "e1",
    name: "La Terraza Rooftop",
    emoji: "\uD83C\uDF1F",
    city: "Bogota",
    isLive: true,
    slug: "terraza-rooftop",
    scans: 1243,
    liveUsers: 47,
    registrationRate: 72,
  },
  {
    id: "e2",
    name: "Bar El Dorado",
    emoji: "\uD83C\uDFB5",
    city: "Medellin",
    isLive: false,
    slug: "bar-el-dorado",
    scans: 856,
    liveUsers: 0,
    registrationRate: 65,
  },
];

export default function QrsPage() {
  const { t } = useTranslation("qrs");
  const { data: qrData } = useQrs();
  const { data: establecimientos, isLoading: estLoading } = useEstablecimientos();
  const isLive = useSessionStore((s) => s.isLive);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loading = estLoading;

  const estData: EstQr[] =
    establecimientos?.map((est) => {
      const slug = est.name.toLowerCase().replace(/\s+/g, "-");
      const matchingQrs = qrData?.filter((q) => q.establishmentId === est.id);
      const totalScans = matchingQrs?.reduce((sum, q) => sum + q.scans, 0);
      return {
        id: est.id,
        name: est.name,
        emoji: est.type === "bar" ? "\uD83C\uDF7A" : "\uD83C\uDFB5",
        city: est.city,
        isLive: false,
        slug,
        scans: totalScans ?? est.totalSesiones * 15,
        liveUsers: 0,
        registrationRate: Math.floor(Math.random() * 30 + 55),
      };
    }) ?? fallbackEstablishments;

  const handleCopy = (slug: string, id: string) => {
    navigator.clipboard.writeText(`https://vibrra.live/s/${slug}`).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (slug: string) => {
    const svg = document.getElementById(`qr-${slug}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 520;
    canvas.height = 520;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 520, 520);
      const link = document.createElement("a");
      link.download = `qr-${slug}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Codigos QR" subtitle="Codigos QR de tus establecimientos" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-72" />
          ))}
        </div>
      </div>
    );
  }

  if (estData.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Codigos QR" subtitle="Codigos QR de tus establecimientos" />
        <EmptyState
          icon={<QrCode className="w-16 h-16" />}
          title="Sin establecimientos"
          description="Agrega un establecimiento para generar codigos QR automaticamente."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Codigos QR" subtitle="Codigos QR de tus establecimientos" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {estData.map((est) => {
          const url = `https://vibrra.live/s/${est.slug}`;
          const live = est.isLive || (isLive && est.id === estData[0]?.id);

          return (
            <div
              key={est.id}
              className="bg-surface rounded-xl border border-border overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{est.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {est.name}
                    </p>
                    <p className="text-xs text-text-muted">{est.city}</p>
                  </div>
                </div>
                {live && (
                  <Badge variant="live" pulsing>
                    EN SESION
                  </Badge>
                )}
              </div>

              {/* Body */}
              <div className="p-4 flex gap-6 flex-col sm:flex-row">
                {/* Left: QR */}
                <div className="space-y-3 flex flex-col items-center shrink-0">
                  <span
                    className={clsx(
                      "text-[9px] uppercase tracking-[1.5px] font-semibold",
                      live ? "text-green" : "text-text-muted"
                    )}
                  >
                    QR DE ENTRADA
                  </span>
                  <div
                    className={clsx(
                      "p-2 rounded-xl border-2",
                      live ? "border-green bg-white" : "border-border bg-white"
                    )}
                  >
                    <QRCodeSVG
                      id={`qr-${est.slug}`}
                      value={url}
                      size={130}
                      bgColor="#FFFFFF"
                      fgColor="#0A0A0A"
                      level="M"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(est.slug, est.id)}
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedId === est.id ? "Copiado" : "Copiar link"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(est.slug)}
                    >
                      <Download className="w-3.5 h-3.5" />
                      Descargar PNG
                    </Button>
                  </div>
                </div>

                {/* Right: Stats + shortlink */}
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold">
                        Escaneos
                      </p>
                      <p className="text-lg font-bold text-text-primary mt-0.5">
                        {est.scans.toLocaleString("es-CO")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold">
                        En vivo
                      </p>
                      <p
                        className={clsx(
                          "text-lg font-bold mt-0.5",
                          live ? "text-green" : "text-text-muted"
                        )}
                      >
                        {live ? est.liveUsers || 47 : 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold">
                        Registro %
                      </p>
                      <p className="text-lg font-bold text-text-primary mt-0.5">
                        {est.registrationRate}%
                      </p>
                    </div>
                  </div>

                  {/* Shortlink */}
                  <div
                    className={clsx(
                      "rounded-lg p-3",
                      live ? "bg-info/10" : "bg-card-dark"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <LinkIcon
                        className={clsx(
                          "w-4 h-4 shrink-0",
                          live ? "text-info" : "text-text-muted"
                        )}
                      />
                      <span className="font-mono text-sm text-text-secondary truncate">
                        vibrra.live/s/{est.slug}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(est.slug, est.id)}
                        className="ml-auto shrink-0 p-1 rounded text-text-muted hover:text-text-primary transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
