import { useState } from "react";
import { useParams, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Settings, FileText, CreditCard } from "lucide-react";
import clsx from "clsx";

import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";

import { useEstablecimiento } from "@/hooks/api/useEstablecimiento";

import { TabConfiguracion } from "@/components/establecimiento/TabConfiguracion";
import { TabDocumentos } from "@/components/establecimiento/TabDocumentos";
import { TabSuscripcion } from "@/components/establecimiento/TabSuscripcion";

/* ── Tab definitions ─────────────────────────────────────────── */

type TabKey = "configuracion" | "documentos" | "suscripcion";

const TABS: { key: TabKey; labelKey: string; icon: typeof Settings }[] = [
  { key: "configuracion", labelKey: "tabs.configuracion", icon: Settings },
  { key: "documentos", labelKey: "tabs.documentos", icon: FileText },
  { key: "suscripcion", labelKey: "tabs.suscripcion", icon: CreditCard },
];

/* ── Page ─────────────────────────────────────────────────────── */

export default function EstablecimientoDetallePage() {
  const { t } = useTranslation("establecimientos");
  const { id } = useParams<{ id: string }>();
  const { data: est, isLoading } = useEstablecimiento(id ?? null);

  const [activeTab, setActiveTab] = useState<TabKey>("configuracion");

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton variant="card" className="h-12" />
        <Skeleton variant="card" className="h-64" />
      </div>
    );
  }

  if (!est) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          to="/anfitrion/establecimientos"
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Establecimientos
        </Link>
        <p className="text-text-muted text-sm">Establecimiento no encontrado.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        to="/anfitrion/establecimientos"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Establecimientos
      </Link>

      <PageHeader title={est.name} />

      {/* ── Horizontal tabs ──────────────────────────────── */}
      <div className="flex border-b border-border">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px",
                isActive
                  ? "border-gold text-gold"
                  : "border-transparent text-text-muted hover:text-text-secondary"
              )}
            >
              <Icon className="w-4 h-4" />
              {t(tab.labelKey)}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ──────────────────────────────────── */}
      {activeTab === "configuracion" && <TabConfiguracion establecimiento={est} />}
      {activeTab === "documentos" && (
        <TabDocumentos establecimientoId={est.id} establecimientoName={est.name} />
      )}
      {activeTab === "suscripcion" && <TabSuscripcion establecimiento={est} />}
    </div>
  );
}
