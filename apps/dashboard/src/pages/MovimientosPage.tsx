import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Wallet, Download, BarChart3 } from "lucide-react";
import clsx from "clsx";

import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

import { useMovimientos, type Movimiento } from "@/hooks/api/useMovimientos";
import { useMovimientosResumen } from "@/hooks/api/useMovimientosResumen";
import { formatShortDate, formatTime } from "@/lib/format";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { useAuthStore } from "@/stores/auth.store";
import {
  TIPOS_MOVIMIENTO,
  FILTROS_MOVIMIENTO,
  esIngreso,
  type TipoMovimiento,
  type CategoriaMovimiento,
} from "@/types/movimiento";

/* ── Helpers ─────────────────────────────────────────────────── */

function TipoIcon({ tipo }: { tipo: string }) {
  const meta = TIPOS_MOVIMIENTO[tipo as TipoMovimiento];
  if (!meta) return <span className="text-base">{"\u2022"}</span>;

  const bgClass: Record<string, string> = {
    green: "bg-green/10",
    blue: "bg-blue/10",
    gold: "bg-gold/10",
    red: "bg-error/10",
    muted: "bg-surface",
  };

  return (
    <div
      className={clsx(
        "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
        bgClass[meta.color] ?? "bg-surface",
      )}
    >
      <span className="text-sm leading-none">{meta.icon}</span>
    </div>
  );
}

function calcularDiasParaCierre(): number {
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  return Math.ceil((nextMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/* ── Page ─────────────────────────────────────────────────────── */

export default function MovimientosPage() {
  const { t } = useTranslation("movimientos");
  const fmt = useCurrencyFormatter();
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"movimientos" | "liquidacion">("movimientos");
  const [filtroActivo, setFiltroActivo] = useState("todos");

  const { data: resumen, isLoading: resumenLoading } = useMovimientosResumen();

  // Build categoria filter for the API
  const filtro = FILTROS_MOVIMIENTO.find((f) => f.id === filtroActivo);
  const categoriaFilter = filtro?.categorias?.[0]; // Send first categoria for API filter

  const { data, isLoading } = useMovimientos({
    page,
    categoria: categoriaFilter,
  });

  const res = resumen ?? {
    recaudoMes: 0,
    comisionesMes: 0,
    participacionMes: 0,
    gananciaDigital: 0,
    gananciaNeta: 0,
    suscripcionMonto: 15000,
    deudaBruta: 0,
    efectivoAEntregar: 0,
    efectivoAQuedarse: 0,
    bonoArranqueSaldo: 0,
    bonoArranqueUsado: 0,
    liquidacionEstado: "pendiente" as const,
    liquidacionDeuda: 0,
    liquidacionFecha: null,
  };

  const items: Movimiento[] = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const diasParaCierre = calcularDiasParaCierre();

  async function handleExportCsv() {
    const token = useAuthStore.getState().token;
    const resp = await fetch("/api/movimientos/exportar", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "movimientos.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const columns: Column<Movimiento>[] = [
    {
      key: "tipo",
      header: t("table.tipo"),
      render: (m) => {
        const tipoLabel = t(`tipos.${m.tipo}`, { defaultValue: m.tipo });
        return (
          <div className="flex items-center gap-3">
            <TipoIcon tipo={m.tipo} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {tipoLabel}
              </p>
              <p className="text-xs text-text-muted truncate max-w-[220px]">
                {m.descripcion}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: "timestamp",
      header: t("table.fecha"),
      render: (m) => {
        const d = m.timestamp ? new Date(m.timestamp) : new Date();
        return (
          <div>
            <p className="text-sm text-text-secondary">{formatShortDate(d)}</p>
            <p className="text-xs text-text-muted">{formatTime(d)}</p>
          </div>
        );
      },
    },
    {
      key: "monto",
      header: t("table.monto"),
      align: "right",
      render: (m) => {
        const income = esIngreso(m.categoria as CategoriaMovimiento);
        return (
          <span className={clsx("font-mono text-sm font-semibold", income ? "text-green" : "text-text-primary")}>
            {income ? "+" : ""}{fmt(m.monto)}
          </span>
        );
      },
    },
    {
      key: "recaudo_post",
      header: t("table.acumulados"),
      align: "right",
      render: (m) => (
        <div className="text-right">
          <p className="font-mono text-xs text-text-muted">
            R: {fmt(m.recaudo_post)}
          </p>
          <p className="font-mono text-xs text-text-muted">
            C: {fmt(m.comisiones_post)}
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      {/* ── Card resumen del mes ─────────────────────── */}
      {resumenLoading ? (
        <Skeleton variant="card" className="h-48" />
      ) : (
        <div className="bg-surface rounded-xl border border-border p-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">{t("resumenMes.recaudoMes")}</span>
            <span className="font-mono text-text-secondary">{fmt(res.recaudoMes)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">{t("resumenMes.comisionesMes")}</span>
            <span className="font-mono text-green">+ {fmt(res.comisionesMes)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">{t("resumenMes.participacionMes")}</span>
            <span className="font-mono text-green">+ {fmt(res.participacionMes)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">{t("resumenMes.suscripcion")}</span>
            <span className="font-mono text-error">&minus; {fmt(res.suscripcionMonto)}</span>
          </div>
          <hr className="border-border" />
          <div className="flex justify-between text-base font-bold">
            <span className="text-text-primary">{t("resumenMes.teQuedas")}</span>
            <span className={clsx("font-mono", res.gananciaNeta >= 0 ? "text-gold" : "text-error")}>
              {fmt(res.gananciaNeta)}
            </span>
          </div>
          <p className="text-xs text-text-muted text-center">
            {t("resumenMes.liquidacionEn", { dias: diasParaCierre })}
          </p>
        </div>
      )}

      {/* ── TabBar ──────────────────────────────────────── */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("movimientos")}
          className={clsx(
            "flex-1 py-3 text-sm font-semibold text-center transition-colors",
            activeTab === "movimientos"
              ? "text-gold border-b-2 border-gold"
              : "text-text-muted hover:text-text-secondary",
          )}
        >
          {t("tabs.movimientos")}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("liquidacion")}
          className={clsx(
            "flex-1 py-3 text-sm font-semibold text-center transition-colors",
            activeTab === "liquidacion"
              ? "text-gold border-b-2 border-gold"
              : "text-text-muted hover:text-text-secondary",
          )}
        >
          {t("tabs.liquidacion")}
        </button>
      </div>

      {activeTab === "movimientos" ? (
        <>
          {/* ── Chips de filtro ──────────────────────────── */}
          <div className="flex items-center gap-2 flex-wrap">
            {FILTROS_MOVIMIENTO.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => { setFiltroActivo(f.id); setPage(1); }}
                className={clsx(
                  "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                  filtroActivo === f.id
                    ? "bg-gold text-[#0A0A0A]"
                    : "bg-surface border border-border text-text-muted hover:text-text-secondary",
                )}
              >
                {t(`filters.${f.id}`)}
              </button>
            ))}

            <div className="flex-1" />

            <Button variant="secondary" size="sm" onClick={handleExportCsv}>
              <Download className="w-4 h-4" />
              {t("filters.exportar")}
            </Button>
          </div>

          {/* ── Tabla ──────────────────────────────────── */}
          <DataTable<Movimiento>
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
                icon={<Wallet className="w-12 h-12" />}
                title={t("empty.title")}
                description={t("empty.desc")}
              />
            }
          />

          {/* ── FAB ────────────────────────────────────── */}
          <div className="fixed bottom-6 right-6 z-20">
            <button
              type="button"
              onClick={() => setActiveTab("liquidacion")}
              className="flex items-center gap-2 px-4 py-3 rounded-full bg-gold text-[#0A0A0A] font-semibold text-sm shadow-lg hover:bg-gold-light transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              {t("fab")}
            </button>
          </div>
        </>
      ) : (
        /* ── Tab Liquidación ──────────────────────────── */
        <div className="space-y-4">
          <div className="bg-surface rounded-xl border border-border p-5 space-y-3">
            <h3 className="text-sm font-bold text-text-primary">{t("liquidacion.title")}</h3>

            <div className="flex justify-between text-sm">
              <span className="text-text-muted">{t("liquidacion.recaudo")}</span>
              <span className="font-mono text-text-secondary">{fmt(res.recaudoMes)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">{t("liquidacion.suscripcion")}</span>
              <span className="font-mono text-text-secondary">+ {fmt(res.suscripcionMonto)}</span>
            </div>
            {res.liquidacionDeuda > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{t("liquidacion.deudaAnterior")}</span>
                <span className="font-mono text-text-secondary">+ {fmt(res.liquidacionDeuda)}</span>
              </div>
            )}
            <hr className="border-border" />
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-text-muted">{t("liquidacion.deudaBruta")}</span>
              <span className="font-mono text-text-primary">{fmt(res.deudaBruta)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-text-muted">{t("liquidacion.comisiones")}</span>
              <span className="font-mono text-green">&minus; {fmt(res.comisionesMes)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">{t("liquidacion.participacion")}</span>
              <span className="font-mono text-green">&minus; {fmt(res.participacionMes)}</span>
            </div>
            <hr className="border-border" />
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">{t("liquidacion.efectivoEntregas")}</span>
              <span className="font-mono text-text-primary">{fmt(res.efectivoAEntregar)}</span>
            </div>

            <div className="bg-gold/10 border border-gold/30 rounded-lg p-3 mt-2">
              <div className="flex justify-between text-base font-bold">
                <span className="text-gold">{t("liquidacion.teQuedasMes")}</span>
                <span className="font-mono text-gold">{fmt(res.efectivoAQuedarse)}</span>
              </div>
            </div>

            <div className="flex justify-between text-xs text-text-muted mt-2">
              <span>
                {t("liquidacion.estado")}: {t(`liquidacion.${res.liquidacionEstado}`)}
              </span>
              {res.liquidacionFecha && (
                <span>
                  {t("liquidacion.cierreEl", {
                    fecha: new Date(res.liquidacionFecha).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "long",
                    }),
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
