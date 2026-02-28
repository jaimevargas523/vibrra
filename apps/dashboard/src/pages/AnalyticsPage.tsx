import { useTranslation } from "react-i18next";
import {
  BarChart3,
  Users,
  Clock,
  Percent,
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

import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

import { useAnalytics, type HeatmapPoint } from "@/hooks/api/useAnalytics";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

/* ── Heatmap helpers ──────────────────────────────────────── */

const dayOrder = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
const dayLabels = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
const hourSlots = [16, 18, 20, 22, 0, 2];
const hourLabels = ["16h", "18h", "20h", "22h", "00h", "02h"];

function buildHeatGrid(points: HeatmapPoint[]): number[][] {
  const grid: number[][] = dayOrder.map(() => hourSlots.map(() => 0));
  for (const p of points) {
    const dayIdx = dayOrder.indexOf(p.dia);
    const hourIdx = hourSlots.indexOf(p.hora);
    if (dayIdx >= 0 && hourIdx >= 0) {
      grid[dayIdx][hourIdx] = p.valor;
    }
  }
  return grid;
}

function getHeatColor(value: number): string {
  if (value < 5) return "bg-transparent";
  if (value < 20) return "bg-green/10";
  if (value < 40) return "bg-green/20";
  if (value < 60) return "bg-green/40";
  if (value < 80) return "bg-green/60";
  return "bg-green/80";
}

/* ── Chart tooltip ────────────────────────────────────────── */

function GenreTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-elevated border border-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <p className="text-sm font-semibold text-gold">
        {payload[0].value} ({payload[0].payload.porcentaje}%)
      </p>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────── */

export default function AnalyticsPage() {
  const { t } = useTranslation("analytics");
  const { data, isLoading } = useAnalytics();
  const fmt = useCurrencyFormatter();

  const kpis = data?.kpis ?? [];
  const heatGrid = data?.heatmap ? buildHeatGrid(data.heatmap) : [];
  const generos = data?.generos ?? [];
  const perfil = data?.perfilCliente;

  const kpiIcons = [<BarChart3 />, <Percent />, <Clock />, <Users />];
  const kpiColors = ["text-green", "text-gold", "text-warning", "text-info"];

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />


      {/* ── KPI Grid ──────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="card" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((kpi, i) => (
            <KpiCard
              key={kpi.label}
              label={kpi.label}
              value={
                kpi.unidad === "COP"
                  ? fmt(kpi.valor)
                  : kpi.unidad === "h"
                    ? `${kpi.valor}:00`
                    : kpi.unidad === "%"
                      ? `${kpi.valor}%`
                      : String(kpi.valor)
              }
              sublabel={
                kpi.cambio !== 0
                  ? `${kpi.cambio > 0 ? "+" : ""}${kpi.cambio}%`
                  : undefined
              }
              icon={kpiIcons[i] ?? <BarChart3 />}
              accentColor={kpiColors[i] ?? "text-gold"}
              trend={
                kpi.tendencia === "up"
                  ? "up"
                  : kpi.tendencia === "down"
                    ? "down"
                    : undefined
              }
            />
          ))}
        </div>
      )}

      {/* ── Two columns ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Heatmap */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <span className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold block mb-4">
            {t("heatmap.title")}
          </span>

          {isLoading ? (
            <Skeleton variant="chart" />
          ) : heatGrid.length === 0 ? (
            <EmptyState
              icon={<Clock className="w-10 h-10" />}
              title={t("heatmap.empty")}
            />
          ) : (
            <div className="space-y-4">
              {/* Header row */}
              <div className="flex items-center">
                <div className="w-10 shrink-0" />
                {hourLabels.map((h) => (
                  <div
                    key={h}
                    className="flex-1 text-center text-[10px] text-text-muted font-mono"
                  >
                    {h}
                  </div>
                ))}
              </div>

              {/* Data rows */}
              {heatGrid.map((row, dayIdx) => (
                <div key={dayIdx} className="flex items-center gap-1">
                  <div className="w-10 text-[10px] text-text-muted font-mono shrink-0">
                    {dayLabels[dayIdx]}
                  </div>
                  {row.map((value, hourIdx) => (
                    <div
                      key={hourIdx}
                      className={clsx(
                        "flex-1 aspect-square rounded-sm transition-colors",
                        getHeatColor(value)
                      )}
                      title={`${dayLabels[dayIdx]} ${hourLabels[hourIdx]}: ${value}`}
                    />
                  ))}
                </div>
              ))}

              {/* Legend */}
              <div className="flex items-center gap-2 justify-end">
                <span className="text-[10px] text-text-muted">{t("heatmap.bajo")}</span>
                <div className="flex gap-0.5">
                  <div className="w-3 h-3 rounded-sm bg-green/10" />
                  <div className="w-3 h-3 rounded-sm bg-green/20" />
                  <div className="w-3 h-3 rounded-sm bg-green/40" />
                  <div className="w-3 h-3 rounded-sm bg-green/60" />
                </div>
                <span className="text-[10px] text-text-muted">{t("heatmap.alto")}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Genres chart + Client profile */}
        <div className="space-y-4">
          {/* Genre bar chart */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <span className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold block mb-4">
              {t("generos.title")}
            </span>

            {isLoading ? (
              <Skeleton variant="chart" />
            ) : generos.length === 0 ? (
              <EmptyState
                icon={<BarChart3 className="w-10 h-10" />}
                title={t("generos.empty")}
              />
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={generos.slice(0, 5)}
                    layout="vertical"
                    margin={{ left: 0, right: 10, top: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#2A2A2A"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fill: "#5A5A5A", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="genero"
                      tick={{ fill: "#9CA3AF", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      width={100}
                    />
                    <Tooltip content={<GenreTooltip />} cursor={false} />
                    <Bar
                      dataKey="cantidad"
                      fill="#D4A017"
                      radius={[0, 4, 4, 0]}
                      maxBarSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Client profile */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <span className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold block mb-4">
              {t("clientes.title")}
            </span>

            {isLoading ? (
              <Skeleton variant="card" className="h-24" />
            ) : perfil ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card-dark rounded-lg p-3 flex items-center gap-3">
                  <span className="text-xl">📊</span>
                  <div>
                    <p className="text-lg font-bold text-text-primary">
                      {perfil.edadPromedio}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      {t("clientes.avgAge")}
                    </p>
                  </div>
                </div>
                <div className="bg-card-dark rounded-lg p-3 flex items-center gap-3">
                  <span className="text-xl">👥</span>
                  <div>
                    <p className="text-sm font-bold text-text-primary">
                      {perfil.generoPredominante}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      {t("clientes.gender")}
                    </p>
                  </div>
                </div>
                <div className="bg-card-dark rounded-lg p-3 flex items-center gap-3">
                  <span className="text-xl">💰</span>
                  <div>
                    <p className="text-lg font-bold text-gold">
                      {fmt(perfil.ticketPromedio)}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      {t("clientes.avgTicket")}
                    </p>
                  </div>
                </div>
                <div className="bg-card-dark rounded-lg p-3 flex items-center gap-3">
                  <span className="text-xl">🔁</span>
                  <div>
                    <p className="text-lg font-bold text-green">
                      {perfil.frecuenciaVisita}x
                    </p>
                    <p className="text-[10px] text-text-muted">
                      {t("clientes.visitFreq")}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={<Users className="w-10 h-10" />}
                title={t("clientes.empty")}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
