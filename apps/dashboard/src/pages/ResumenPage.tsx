import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Wallet,
  TrendingUp,
  Music,
  Users,
  Play,
  Share2,
  QrCode,
  ArrowRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { KpiCard } from "@/components/ui/KpiCard";
import { SaldoBox } from "@/components/ui/SaldoBox";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatusDot } from "@/components/ui/StatusDot";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

import { useHostProfile } from "@/hooks/api/useHostProfile";
import { useResumenKpis } from "@/hooks/api/useResumenKpis";
import { useResumenChart } from "@/hooks/api/useResumenChart";
import { useResumenSesiones } from "@/hooks/api/useResumenSesiones";
import { useSessionStore } from "@/stores/session.store";
import { useEstablishmentStore } from "@/stores/establishment.store";
import {
  formatCOP,
  formatDate,
  formatDuration,
  getGreeting,
  formatRelativeTime,
} from "@/lib/format";

/* ── Fallback data ───────────────────────────────────────────── */

const fallbackChart = [
  { date: "Lun", recaudado: 45000 },
  { date: "Mar", recaudado: 72000 },
  { date: "Mie", recaudado: 38000 },
  { date: "Jue", recaudado: 95000 },
  { date: "Vie", recaudado: 120000 },
  { date: "Sab", recaudado: 185000 },
  { date: "Dom", recaudado: 67000 },
];

const fallbackSesiones = [
  {
    id: "s1",
    establishmentName: "La Terraza Rooftop",
    startedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    endedAt: new Date(Date.now() - 1800000).toISOString(),
    totalRecaudado: 185000,
    totalCanciones: 24,
    duracionMinutos: 90,
    status: "ended" as const,
  },
  {
    id: "s2",
    establishmentName: "Bar El Dorado",
    startedAt: new Date(Date.now() - 26 * 3600000).toISOString(),
    endedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    totalRecaudado: 142000,
    totalCanciones: 18,
    duracionMinutos: 120,
    status: "ended" as const,
  },
  {
    id: "s3",
    establishmentName: "La Terraza Rooftop",
    startedAt: new Date(Date.now() - 50 * 3600000).toISOString(),
    endedAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    totalRecaudado: 98000,
    totalCanciones: 12,
    duracionMinutos: 75,
    status: "ended" as const,
  },
];

/* ── Custom chart tooltip ────────────────────────────────────── */

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-elevated border border-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <p className="text-sm font-mono font-semibold text-gold">
        {formatCOP(payload[0].value)}
      </p>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */

export default function ResumenPage() {
  const { t } = useTranslation("resumen");
  const { data: profile, isLoading: profileLoading } = useHostProfile();
  const { data: kpis, isLoading: kpisLoading } = useResumenKpis();
  const { data: chartData, isLoading: chartLoading } = useResumenChart("7d");
  const { data: sesiones, isLoading: sesionesLoading } = useResumenSesiones();

  const isLive = useSessionStore((s) => s.isLive);
  const connectedUsers = useSessionStore((s) => s.connectedUsers);
  const startedAt = useSessionStore((s) => s.startedAt);
  const selectedEst = useEstablishmentStore((s) => s.getSelected());

  const displayName = profile?.displayName ?? "Anfitrion";
  const recentSesiones = sesiones ?? fallbackSesiones;
  const chart = chartData?.data ?? fallbackChart;

  return (
    <div className="space-y-6">
      {/* ── Greeting ──────────────────────────────────────── */}
      <div>
        {profileLoading ? (
          <Skeleton className="h-8 w-64" />
        ) : (
          <h1 className="text-[28px] font-bold font-display text-text-primary leading-tight">
            {getGreeting()}, {displayName}
          </h1>
        )}
        <p className="text-sm text-text-secondary mt-1">
          {formatDate(new Date())}
        </p>
      </div>

      {/* ── Session banner ────────────────────────────────── */}
      {isLive ? (
        <div className="bg-surface rounded-xl border-2 border-green/40 p-4 bg-gradient-to-r from-green/5 to-transparent">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <StatusDot status="live" />
              <div>
                <p className="text-sm font-bold text-green uppercase tracking-wide">
                  SESION ACTIVA
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {selectedEst?.name ?? "Establecimiento"}
                  {startedAt && (
                    <span className="ml-2 font-mono text-text-muted">
                      {formatDuration(
                        (Date.now() - new Date(startedAt).getTime()) / 60000
                      )}
                    </span>
                  )}
                  <span className="ml-2">
                    <Users className="inline w-3 h-3 mr-0.5" />
                    {connectedUsers}
                  </span>
                </p>
              </div>
            </div>
            <Link to="/anfitrion/envivo">
              <Button size="sm" className="bg-green text-black hover:bg-green/90">
                Ir a sesion en vivo
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <StatusDot status="offline" />
              <div>
                <p className="text-sm font-semibold text-text-secondary">
                  Sin sesion activa
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  Abre una sesion para empezar a recibir pujas
                </p>
              </div>
            </div>
            <Link to="/anfitrion/envivo">
              <Button variant="secondary" size="sm">
                <Play className="w-4 h-4" />
                Abrir sesion
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ── KPI Grid ──────────────────────────────────────── */}
      {kpisLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="card" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="Saldo Disponible"
            value={formatCOP(kpis?.totalRecaudado ?? 247500)}
            sublabel="Disponible para retirar"
            icon={<Wallet />}
            accentColor="text-gold"
          />
          <KpiCard
            label="Generado este mes"
            value={formatCOP(kpis?.totalRecaudado ?? 1250000)}
            sublabel={`+${kpis?.comparacionMesAnterior?.recaudado ?? 12}% vs mes anterior`}
            icon={<TrendingUp />}
            trend="up"
            accentColor="text-success"
          />
          <KpiCard
            label="Sesiones del mes"
            value={String(kpis?.totalSesiones ?? 18)}
            sublabel={`+${kpis?.comparacionMesAnterior?.sesiones ?? 5}% vs mes anterior`}
            icon={<Music />}
            trend="up"
            accentColor="text-info"
          />
          <KpiCard
            label="Usuarios unicos"
            value={String(kpis?.totalCanciones ?? 342)}
            sublabel="Este mes"
            icon={<Users />}
            accentColor="text-warning"
          />
        </div>
      )}

      {/* ── Two columns: Saldo + Chart ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SaldoBox
          saldoReal={kpis?.totalRecaudado ?? 247500}
          saldoBono={30000}
          establecimientos={[
            { name: "La Terraza Rooftop", saldo: 180000 },
            { name: "Bar El Dorado", saldo: 67500 },
          ]}
          ventanaAbierta={false}
          proximaVentana="Lunes 3 de marzo"
        />

        <div className="bg-surface rounded-xl border border-border p-5">
          <span className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold">
            INGRESOS ULTIMOS 7 DIAS
          </span>
          {chartLoading ? (
            <Skeleton variant="chart" className="mt-4" />
          ) : chart.length === 0 ? (
            <EmptyState
              icon={<TrendingUp className="w-12 h-12" />}
              title="Sin datos"
              description="Los datos de ingresos apareceran aqui"
            />
          ) : (
            <div className="mt-4 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#2A2A2A"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#5A5A5A", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#5A5A5A", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={false} />
                  <Bar
                    dataKey="recaudado"
                    fill="#D4A017"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── Sesiones recientes ────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold">
            SESIONES RECIENTES
          </span>
          <Link
            to="/anfitrion/sesiones"
            className="text-xs text-gold hover:text-gold-light transition-colors"
          >
            Ver todas &rarr;
          </Link>
        </div>

        {sesionesLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : recentSesiones.length === 0 ? (
          <EmptyState
            icon={<Music className="w-12 h-12" />}
            title="Sin sesiones"
            description="Tus sesiones recientes apareceran aqui"
          />
        ) : (
          <div className="space-y-2">
            {recentSesiones.slice(0, 3).map((sesion) => (
              <Link
                key={sesion.id}
                to="/anfitrion/sesiones"
                className="block bg-surface rounded-xl border border-border p-4 hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-info/10 shrink-0">
                      <Music className="w-4 h-4 text-info" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {sesion.establishmentName}
                      </p>
                      <p className="text-xs text-text-muted">
                        {formatRelativeTime(new Date(sesion.startedAt))} &middot;{" "}
                        {formatDuration(sesion.duracionMinutos)} &middot;{" "}
                        {sesion.totalCanciones} canciones
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-sm font-semibold text-gold">
                      {formatCOP(sesion.totalRecaudado)}
                    </span>
                    <Badge
                      variant={sesion.status === "active" ? "live" : "neutral"}
                      size="sm"
                      pulsing={sesion.status === "active"}
                    >
                      {sesion.status === "active" ? "EN VIVO" : "FINALIZADA"}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick actions ─────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <Link to="/anfitrion/envivo" className="block">
          <button
            type="button"
            className="w-full flex flex-col items-center gap-2 p-4 rounded-xl bg-green/10 border border-green/20 hover:bg-green/15 transition-colors cursor-pointer"
          >
            <Play className="w-5 h-5 text-green" />
            <span className="text-xs font-semibold text-green">
              Abrir sesion
            </span>
          </button>
        </Link>
        <button
          type="button"
          className="w-full flex flex-col items-center gap-2 p-4 rounded-xl bg-surface border border-border hover:bg-surface-hover transition-colors cursor-pointer"
        >
          <Share2 className="w-5 h-5 text-text-secondary" />
          <span className="text-xs font-semibold text-text-secondary">
            Compartir link
          </span>
        </button>
        <Link to="/anfitrion/qrs" className="block">
          <button
            type="button"
            className="w-full flex flex-col items-center gap-2 p-4 rounded-xl bg-surface border border-border hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <QrCode className="w-5 h-5 text-text-secondary" />
            <span className="text-xs font-semibold text-text-secondary">
              Ver QRs
            </span>
          </button>
        </Link>
      </div>
    </div>
  );
}
