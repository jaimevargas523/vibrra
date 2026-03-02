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
  X,
  Gift,
  Info,
  AlertTriangle,
  Megaphone,
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
import clsx from "clsx";

import { KpiCard } from "@/components/ui/KpiCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatusDot } from "@/components/ui/StatusDot";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

import { useHostProfile } from "@/hooks/api/useHostProfile";
import { useAuthStore } from "@/stores/auth.store";
import { useResumenKpis } from "@/hooks/api/useResumenKpis";
import { useResumenChart } from "@/hooks/api/useResumenChart";
import { useResumenSesiones } from "@/hooks/api/useResumenSesiones";
import { useEstablecimientos } from "@/hooks/api/useEstablecimientos";
import { useMovimientosResumen } from "@/hooks/api/useMovimientosResumen";
import { useSessionStore } from "@/stores/session.store";
import { useEstablishmentStore } from "@/stores/establishment.store";
import { useMensajes, useMensajeActions } from "@/hooks/api/useMensajes";
import type { Mensaje } from "@/hooks/api/useMensajes";
import {
  formatDate,
  formatDuration,
  getGreeting,
  formatRelativeTime,
} from "@/lib/format";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

/* ── Custom chart tooltip ────────────────────────────────────── */

function ChartTooltip({ active, payload, label, fmt }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-elevated border border-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <p className="text-sm font-mono font-semibold text-gold">
        {fmt?.(payload[0].value) ?? payload[0].value}
      </p>
    </div>
  );
}

/* ── Style & icon maps for dynamic messages ──────────────────── */

const ESTILO_CLASSES: Record<string, { border: string; bg: string; accent: string }> = {
  gold:    { border: "border-gold/30",    bg: "from-gold/10 via-gold-dark/5 to-transparent",      accent: "text-gold" },
  info:    { border: "border-info/30",    bg: "from-info/10 via-info/5 to-transparent",            accent: "text-info" },
  success: { border: "border-green/30",   bg: "from-green/10 via-green/5 to-transparent",          accent: "text-green" },
  warning: { border: "border-warning/30", bg: "from-warning/10 via-warning/5 to-transparent",      accent: "text-warning" },
};

const ICONO_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  gift: Gift,
  info: Info,
  alert: AlertTriangle,
  megaphone: Megaphone,
};

function MensajeBanner({ mensaje, onDismiss }: { mensaje: Mensaje; onDismiss: () => void }) {
  const styles = ESTILO_CLASSES[mensaje.estilo] ?? ESTILO_CLASSES.info;
  const Icon = ICONO_MAP[mensaje.icono] ?? Info;

  return (
    <div className={`relative border ${styles.border} rounded-xl overflow-hidden`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${styles.bg}`} />
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      <button
        type="button"
        onClick={onDismiss}
        className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-text-muted hover:text-gold hover:bg-gold/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="relative p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-gold/15 border border-gold/25 shrink-0`}>
              <Icon className={`w-5 h-5 ${styles.accent}`} />
            </div>
            <div className="pr-8">
              <p className={`text-sm font-bold ${styles.accent}`}>
                {mensaje.titulo}
              </p>
              {mensaje.descripcion && (
                <p className="text-xs text-text-muted mt-0.5">
                  {mensaje.descripcion}
                </p>
              )}
            </div>
          </div>
          {mensaje.cta && (
            <Link to={mensaje.cta.ruta}>
              <button
                type="button"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-gold/15 border border-gold/25 ${styles.accent} text-sm font-semibold hover:bg-gold/25 transition-colors`}
              >
                {mensaje.cta.texto}
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Helper: days until next month ───────────────────────────── */

function calcularDiasParaCierre(): number {
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  return Math.ceil((nextMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/* ── Page ─────────────────────────────────────────────────────── */

export default function ResumenPage() {
  const { t } = useTranslation("resumen");
  const fmt = useCurrencyFormatter();
  const { data: profile, isLoading: profileLoading } = useHostProfile();
  const { data: kpis, isLoading: kpisLoading } = useResumenKpis();
  const { data: chartData, isLoading: chartLoading } = useResumenChart("7d");
  const { data: sesiones, isLoading: sesionesLoading } = useResumenSesiones();
  const { data: movResumen } = useMovimientosResumen();

  const authUser = useAuthStore((s) => s.user);
  const isLive = useSessionStore((s) => s.isLive);
  const connectedUsers = useSessionStore((s) => s.connectedUsers);
  const startedAt = useSessionStore((s) => s.startedAt);
  const selectedEst = useEstablishmentStore((s) => s.getSelected());

  // Unified: show first name only in greeting
  const fullName = profile?.displayName || authUser?.displayName || authUser?.email || "Anfitrion";
  const displayName = fullName.split(" ")[0];
  const recentSesiones = sesiones ?? [];
  const chart = chartData?.data ?? [];

  // Credit model data
  const recaudoMes = movResumen?.recaudoMes ?? 0;
  const comisionesMes = movResumen?.comisionesMes ?? 0;
  const participacionMes = movResumen?.participacionMes ?? 0;
  const gananciaNeta = movResumen?.gananciaNeta ?? 0;
  const diasParaCierre = calcularDiasParaCierre();

  // Dynamic messages from Firestore
  const { data: mensajes } = useMensajes();
  const { marcarLeido, eliminar } = useMensajeActions();

  // Bonus info
  const bonoArranqueSaldo = movResumen?.bonoArranqueSaldo ?? 0;

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

      {/* ── Dynamic messages from Firestore ────────────────── */}
      {(mensajes ?? []).map((msg) => (
        <MensajeBanner
          key={msg.id}
          mensaje={msg}
          onDismiss={() =>
            msg.tipo === "global" ? marcarLeido(msg.id) : eliminar(msg.id)
          }
        />
      ))}

      {/* ── Bonus banner ────────────────────────────────────── */}
      {bonoArranqueSaldo > 0 && (
        <div className="bg-gold/5 border border-gold/20 rounded-xl p-4 flex items-start gap-3">
          <Gift className="w-5 h-5 text-gold shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-gold">
              {t("bonus.title", { amount: fmt(bonoArranqueSaldo) })}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              {t("bonus.subtitle")}
            </p>
          </div>
        </div>
      )}

      {/* ── Session banner ────────────────────────────────── */}
      {isLive ? (
        <div className="bg-surface rounded-xl border-2 border-green/40 p-4 bg-gradient-to-r from-green/5 to-transparent">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <StatusDot status="live" />
              <div>
                <p className="text-sm font-bold text-green uppercase tracking-wide">
                  {t("sessionBanner.active")}
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {selectedEst?.name ?? t("sessionBanner.establishment")}
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
                {t("sessionBanner.goTo")}
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
                  {t("sessionBanner.inactive")}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  {t("sessionBanner.openDescription")}
                </p>
              </div>
            </div>
            <Link to="/anfitrion/envivo">
              <Button variant="secondary" size="sm">
                <Play className="w-4 h-4" />
                {t("sessionBanner.open")}
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
            label={t("kpi.recaudo")}
            value={fmt(recaudoMes)}
            sublabel={t("kpi.recaudoSub")}
            icon={<Wallet />}
            accentColor="text-gold"
          />
          <KpiCard
            label={t("kpi.comision")}
            value={fmt(comisionesMes)}
            sublabel={t("kpi.comisionSub")}
            icon={<TrendingUp />}
            accentColor="text-green"
          />
          <KpiCard
            label={t("kpi.sesiones")}
            value={String(kpis?.totalSesiones ?? 0)}
            sublabel={kpis?.comparacionMesAnterior?.sesiones
              ? t("kpi.vsMesAnterior", { percent: kpis.comparacionMesAnterior.sesiones })
              : t("kpi.sinDatosMes")}
            icon={<Music />}
            trend={kpis?.comparacionMesAnterior?.sesiones && kpis.comparacionMesAnterior.sesiones > 0 ? "up" : undefined}
            accentColor="text-info"
          />
          <KpiCard
            label={t("kpi.canciones")}
            value={String(kpis?.totalCanciones ?? 0)}
            sublabel={t("kpi.esteMes")}
            icon={<Users />}
            accentColor="text-warning"
          />
        </div>
      )}

      {/* ── Two columns: Estado del mes + Chart ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Estado del mes (replaces SaldoBox) */}
        <div className="bg-surface rounded-xl border border-border p-5 space-y-3">
          <span className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold">
            {t("saldo.title")}
          </span>

          <div className="flex justify-between text-sm">
            <span className="text-text-muted">{t("saldo.recaudo")}</span>
            <span className="font-mono text-text-secondary">{fmt(recaudoMes)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">{t("saldo.comision")}</span>
            <span className="font-mono text-green">+ {fmt(comisionesMes)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">{t("saldo.participacion")}</span>
            <span className="font-mono text-green">+ {fmt(participacionMes)}</span>
          </div>
          <hr className="border-border" />
          <div className="flex justify-between text-base font-bold">
            <span className="text-text-primary">{t("saldo.gananciaNeta")}</span>
            <span className={clsx("font-mono", gananciaNeta >= 0 ? "text-gold" : "text-error")}>
              {fmt(gananciaNeta)}
            </span>
          </div>
          <p className="text-xs text-text-muted text-center">
            {t("saldo.liquidacionEn", { dias: diasParaCierre })}
          </p>
        </div>

        <div className="bg-surface rounded-xl border border-border p-5">
          <span className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold">
            {t("chart.title")}
          </span>
          {chartLoading ? (
            <Skeleton variant="chart" className="mt-4" />
          ) : chart.length === 0 ? (
            <EmptyState
              icon={<TrendingUp className="w-12 h-12" />}
              title={t("chart.sinDatos")}
              description={t("chart.empty")}
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
                  <Tooltip content={<ChartTooltip fmt={fmt} />} cursor={false} />
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
            {t("sesiones.title")}
          </span>
          <Link
            to="/anfitrion/sesiones"
            className="text-xs text-gold hover:text-gold-light transition-colors"
          >
            {t("sesiones.verTodas")}
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
            title={t("sesiones.sinSesiones")}
            description={t("sesiones.empty")}
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
                        {sesion.totalCanciones} {t("sesiones.canciones")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-sm font-semibold text-gold">
                      {fmt(sesion.totalRecaudado)}
                    </span>
                    <Badge
                      variant={sesion.status === "active" ? "live" : "neutral"}
                      size="sm"
                      pulsing={sesion.status === "active"}
                    >
                      {sesion.status === "active" ? t("sesiones.enVivo") : t("sesiones.finalizada")}
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
              {t("acciones.abrir")}
            </span>
          </button>
        </Link>
        <button
          type="button"
          className="w-full flex flex-col items-center gap-2 p-4 rounded-xl bg-surface border border-border hover:bg-surface-hover transition-colors cursor-pointer"
        >
          <Share2 className="w-5 h-5 text-text-secondary" />
          <span className="text-xs font-semibold text-text-secondary">
            {t("acciones.compartir")}
          </span>
        </button>
        <Link to="/anfitrion/qrs" className="block">
          <button
            type="button"
            className="w-full flex flex-col items-center gap-2 p-4 rounded-xl bg-surface border border-border hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <QrCode className="w-5 h-5 text-text-secondary" />
            <span className="text-xs font-semibold text-text-secondary">
              {t("acciones.qrs")}
            </span>
          </button>
        </Link>
      </div>
    </div>
  );
}
