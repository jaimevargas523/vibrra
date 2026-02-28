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
import { formatCOP, formatDuration, formatShortDate, formatTime } from "@/lib/format";

/* ── Mock fallback ───────────────────────────────────────────── */

const fallbackSesiones: Sesion[] = [
  {
    id: "s1",
    establishmentId: "e1",
    establishmentName: "La Terraza Rooftop",
    startedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    endedAt: new Date(Date.now() - 300000).toISOString(),
    totalRecaudado: 185000,
    totalCanciones: 24,
    duracionMinutos: 95,
    status: "ended",
    peakConnectedUsers: 58,
  },
  {
    id: "s2",
    establishmentId: "e2",
    establishmentName: "Bar El Dorado",
    startedAt: new Date(Date.now() - 26 * 3600000).toISOString(),
    endedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    totalRecaudado: 142000,
    totalCanciones: 18,
    duracionMinutos: 120,
    status: "ended",
    peakConnectedUsers: 42,
  },
  {
    id: "s3",
    establishmentId: "e1",
    establishmentName: "La Terraza Rooftop",
    startedAt: new Date(Date.now() - 50 * 3600000).toISOString(),
    endedAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    totalRecaudado: 98000,
    totalCanciones: 12,
    duracionMinutos: 75,
    status: "ended",
    peakConnectedUsers: 35,
  },
  {
    id: "s4",
    establishmentId: "e2",
    establishmentName: "Bar El Dorado",
    startedAt: new Date(Date.now() - 74 * 3600000).toISOString(),
    endedAt: new Date(Date.now() - 72 * 3600000).toISOString(),
    totalRecaudado: 210000,
    totalCanciones: 31,
    duracionMinutos: 150,
    status: "ended",
    peakConnectedUsers: 67,
  },
  {
    id: "s5",
    establishmentId: "e1",
    establishmentName: "La Terraza Rooftop",
    startedAt: new Date(Date.now() - 98 * 3600000).toISOString(),
    endedAt: new Date(Date.now() - 96 * 3600000).toISOString(),
    totalRecaudado: 75000,
    totalCanciones: 9,
    duracionMinutos: 60,
    status: "ended",
    peakConnectedUsers: 28,
  },
];

export default function SesionesPage() {
  const { t } = useTranslation("sesiones");
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

  const items: Sesion[] = data?.items ?? fallbackSesiones;
  const totalPages = data?.totalPages ?? 1;

  const filters: { key: typeof statusFilter; label: string }[] = [
    { key: "all", label: "Todas" },
    { key: "active", label: "Activas" },
    { key: "ended", label: "Cerradas" },
  ];

  const columns: Column<Sesion>[] = [
    {
      key: "establishmentName",
      header: "ESTABLECIMIENTO",
      render: (s) => (
        <span className="font-medium text-text-primary">{s.establishmentName}</span>
      ),
    },
    {
      key: "startedAt",
      header: "FECHA",
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
      header: "DURACION",
      render: (s) => (
        <span className="text-text-secondary">{formatDuration(s.duracionMinutos)}</span>
      ),
    },
    {
      key: "totalCanciones",
      header: "CANCIONES",
      align: "center",
      render: (s) => (
        <span className="text-text-secondary">{s.totalCanciones}</span>
      ),
    },
    {
      key: "totalRecaudado",
      header: "INGRESOS",
      align: "right",
      render: (s) => (
        <span className="font-mono font-semibold text-gold">
          {formatCOP(s.totalRecaudado)}
        </span>
      ),
    },
    {
      key: "status",
      header: "ESTADO",
      align: "center",
      render: (s) => (
        <Badge
          variant={s.status === "active" ? "live" : "neutral"}
          size="sm"
          pulsing={s.status === "active"}
        >
          {s.status === "active" ? "EN VIVO" : "FINALIZADA"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Sesiones" subtitle="Historial de sesiones de todos tus establecimientos" />

      {/* Info banner */}
      <div className="bg-info/10 border border-info/30 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-info shrink-0 mt-0.5" />
        <p className="text-sm text-text-secondary">
          Instala la <span className="font-semibold text-info">extension de Chrome</span> para
          controlar sesiones directamente desde tu navegador mientras pones musica en YouTube o
          Spotify.
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
                  Sesion activa &mdash; {activeSession.establishmentName}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  {activeSession.connectedUsers} usuarios &middot;{" "}
                  {activeSession.totalCanciones} canciones &middot;{" "}
                  {formatCOP(activeSession.totalRecaudado)}
                </p>
              </div>
            </div>
            <Link to="/anfitrion/envivo">
              <Button size="sm" className="bg-green text-black hover:bg-green/90">
                Ir al control
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
            <option value="">Todos los establecimientos</option>
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
            title="El historial de sesiones aparecera aqui"
            description="Cuando abras y cierres sesiones, podras ver el historial completo en esta tabla."
          />
        }
      />
    </div>
  );
}
