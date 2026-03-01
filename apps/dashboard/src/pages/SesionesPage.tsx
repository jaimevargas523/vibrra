import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Info, Clock, Music, ArrowRight } from "lucide-react";
import clsx from "clsx";

import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { StatusDot } from "@/components/ui/StatusDot";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";

import { useSesiones, type Sesion } from "@/hooks/api/useSesiones";
import { useActiveSession } from "@/hooks/api/useActiveSession";
import { useEstablishmentStore } from "@/stores/establishment.store";
import { formatDuration, formatShortDate, formatTime } from "@/lib/format";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

export default function SesionesPage() {
  const { t } = useTranslation("sesiones");
  const fmt = useCurrencyFormatter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "ended">("all");
  const [estFilter, setEstFilter] = useState<string>("");

  const establishments = useEstablishmentStore((s) => s.establishments);
  const { data: activeSession } = useActiveSession();
  const { data, isLoading } = useSesiones({
    page,
    status: statusFilter,
    establishmentId: estFilter || undefined,
  });

  const items: Sesion[] = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const filters: { key: typeof statusFilter; label: string }[] = [
    { key: "all", label: t("filters.todas") },
    { key: "active", label: t("filters.activas") },
    { key: "ended", label: t("filters.cerradas") },
  ];

  const columns: Column<Sesion>[] = [
    {
      key: "establishmentName",
      header: t("table.establecimiento"),
      render: (s) => (
        <span className="font-medium text-text-primary">{s.establishmentName}</span>
      ),
    },
    {
      key: "startedAt",
      header: t("table.fecha"),
      render: (s) => {
        const d = new Date(s.startedAt);
        return (
          <span className="text-text-secondary">
            {formatShortDate(d)} {formatTime(d)}
          </span>
        );
      },
    },
    {
      key: "duracionMinutos",
      header: t("table.duracion"),
      render: (s) => (
        <span className="text-text-secondary">{formatDuration(s.duracionMinutos)}</span>
      ),
    },
    {
      key: "totalCanciones",
      header: t("table.canciones"),
      align: "center",
      render: (s) => (
        <span className="text-text-secondary">{s.totalCanciones}</span>
      ),
    },
    {
      key: "totalRecaudado",
      header: t("table.ingresos"),
      align: "right",
      render: (s) => (
        <span className="font-mono font-semibold text-gold">
          {fmt(s.totalRecaudado)}
        </span>
      ),
    },
    {
      key: "status",
      header: t("table.estado"),
      align: "center",
      render: (s) => (
        <Badge
          variant={s.status === "active" ? "live" : "neutral"}
          size="sm"
          pulsing={s.status === "active"}
        >
          {s.status === "active" ? t("table.estadoActiva") : t("table.estadoFinalizada")}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      {/* Info banner */}
      <div className="bg-info/10 border border-info/30 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-info shrink-0 mt-0.5" />
        <p className="text-sm text-text-secondary">
          {t("infoBanner")}
        </p>
      </div>

      {/* Active session card */}
      {activeSession && (
        <div className="bg-surface rounded-xl border-2 border-green/30 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <StatusDot status="live" />
              <div>
                <p className="text-sm font-bold text-green">
                  {t("active.title")} &mdash; {activeSession.establishmentName}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  {activeSession.connectedUsers} {t("active.usuarios")} &middot;{" "}
                  {activeSession.totalCanciones} {t("active.canciones")} &middot;{" "}
                  {fmt(activeSession.totalRecaudado)}
                </p>
              </div>
            </div>
            <Link to="/anfitrion/envivo">
              <Button size="sm" className="bg-green text-black hover:bg-green/90">
                {t("active.goTo")}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {establishments.length > 1 && (
          <select
            value={estFilter}
            onChange={(e) => {
              setEstFilter(e.target.value);
              setPage(1);
            }}
            className="bg-card-dark border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-gold outline-none"
          >
            <option value="">{t("filters.establecimiento")}</option>
            {establishments.map((est) => (
              <option key={est.id} value={est.id}>
                {est.name}
              </option>
            ))}
          </select>
        )}

        <div className="flex gap-1">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => {
                setStatusFilter(f.key);
                setPage(1);
              }}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                statusFilter === f.key
                  ? "bg-gold/15 text-gold"
                  : "text-text-secondary hover:bg-surface-hover"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <DataTable<Sesion>
        columns={columns}
        data={items}
        loading={isLoading}
        pagination={{
          page,
          total: totalPages,
          onPageChange: setPage,
        }}
        emptyState={
          <EmptyState
            icon={<Clock className="w-12 h-12" />}
            title={t("empty.title")}
            description={t("empty.desc")}
          />
        }
      />
    </div>
  );
}
