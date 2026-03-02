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

export default function QrsPage() {
  const { t } = useTranslation("qrs");
  const { data: qrData } = useQrs();
  const { data: establecimientos, isLoading: estLoading } = useEstablecimientos();
  const isLive = useSessionStore((s) => s.isLive);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loading = estLoading;

  const estData: EstQr[] =
    establecimientos?.map((est) => {
      const matchingQrs = qrData?.filter((q) => q.establishmentId === est.id);
      const totalScans = matchingQrs?.reduce((sum, q) => sum + q.scans, 0);
      return {
        id: est.id,
        name: est.name,
        emoji: est.type === "bar" ? "\uD83C\uDF7A" : "\uD83C\uDFB5",
        city: est.city,
        isLive: false,
        slug: est.slug ?? est.id,
        scans: totalScans ?? est.totalSesiones * 15,
        liveUsers: 0,
        registrationRate: 0,
      };
    }) ?? [];

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
        <PageHeader title={t("title")} subtitle={t("subtitle")} />
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
        <PageHeader title={t("title")} subtitle={t("subtitle")} />
        <EmptyState
          icon={<QrCode className="w-16 h-16" />}
          title={t("empty.title")}
          description={t("empty.desc")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

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
                    {t("enSesion")}
                  </Badge>
                )}
              </div>

              {/* Body */}
              <div className="p-5 flex flex-col items-center">
                {/* QR */}
                <span
                  className={clsx(
                    "text-[9px] uppercase tracking-[1.5px] font-semibold mb-3",
                    live ? "text-green" : "text-text-muted"
                  )}
                >
                  {t("qrLabel")}
                </span>
                <div
                  className={clsx(
                    "p-3 rounded-xl border-2",
                    live ? "border-green bg-[#0A0A0A]" : "border-gold/30 bg-[#0A0A0A]"
                  )}
                >
                  <QRCodeSVG
                    id={`qr-${est.slug}`}
                    value={url}
                    size={160}
                    bgColor="#0A0A0A"
                    fgColor="#D4A843"
                    level="M"
                  />
                </div>

                {/* Shortlink — justo debajo del QR */}
                <button
                  type="button"
                  onClick={() => handleCopy(est.slug, est.id)}
                  className="mt-3 flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 hover:bg-gold/20 transition-colors group"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-gold" />
                  <span className="font-mono text-sm text-gold font-medium">
                    vibrra.live/s/{est.slug}
                  </span>
                  <Copy className="w-3.5 h-3.5 text-gold/50 group-hover:text-gold transition-colors" />
                </button>
                <p className="text-[10px] text-text-muted mt-1">
                  {copiedId === est.id ? t("copiado") : t("copiarLink")}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 mt-5 w-full">
                  <div className="text-center">
                    <p className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold">
                      {t("stats.escaneos")}
                    </p>
                    <p className="text-lg font-bold text-text-primary mt-0.5">
                      {est.scans.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold">
                      {t("stats.enVivo")}
                    </p>
                    <p
                      className={clsx(
                        "text-lg font-bold mt-0.5",
                        live ? "text-green" : "text-text-muted"
                      )}
                    >
                      {live ? est.liveUsers : 0}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold">
                      {t("stats.registro")} %
                    </p>
                    <p className="text-lg font-bold text-text-primary mt-0.5">
                      {est.registrationRate}%
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(est.slug, est.id)}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {t("copiarLink")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(est.slug)}
                  >
                    <Download className="w-3.5 h-3.5" />
                    {t("descargarPng")}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
