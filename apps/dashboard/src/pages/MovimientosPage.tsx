import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Wallet, Download } from "lucide-react";
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
  CATEGORIAS,
  esEgreso,
  type TipoMovimiento,
  type CategoriaMovimiento,
} from "@/types/movimiento";

/* ── Helpers ─────────────────────────────────────────────────── */

function TipoIcon({ tipo }: { tipo: string }) {
  const meta = TIPOS_MOVIMIENTO[tipo as TipoMovimiento];
  if (!meta) return <span className="text-base">{"\u2022"}</span>;

  const bgClass: Record<string, string> = {
    success: "bg-success/10",
    error: "bg-error/10",
    warning: "bg-warning/10",
    info: "bg-info/10",
    gold: "bg-gold/10",
    purple: "bg-purple/10",
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

const CATEGORIA_LABELS: Record<string, string> = {
  "": "Todos",
  INGRESO_REAL: "Ingresos reales",
  INGRESO_BONO: "Ingresos bono",
  EGRESO_REAL: "Egresos reales",
  EGRESO_BONO: "Egresos bono",
  EGRESO_MIXTO: "Egresos mixtos",
};

/* ── Page ─────────────────────────────────────────────────────── */

export default function MovimientosPage() {
  const { t } = useTranslation("movimientos");
  const fmt = useCurrencyFormatter();
  const [page, setPage] = useState(1);
  const [catFilter, setCatFilter] = useState<string>("");

  const { data: resumen, isLoading: resumenLoading } = useMovimientosResumen();
  const { data, isLoading } = useMovimientos({
    page,
    categoria: catFilter || undefined,
  });

  const res = resumen ?? {
    saldoReal: 0,
    saldoBono: 0,
    saldoTotal: 0,
    totalIngresosReal: 0,
    totalIngresosBono: 0,
    totalEgresosReal: 0,
    totalEgresosBono: 0,
    totalRetiros: 0,
    totalComisiones: 0,
    pendientePago: 0,
    ultimoRetiro: null,
  };
  const items: Movimiento[] = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const summaryCards = [
    {
      label: t("resumen.saldoReal"),
      value: fmt(res.saldoReal),
      sub: t("resumen.disponibleRetiro"),
      color: "text-gold",
    },
    {
      label: t("resumen.saldoBono"),
      value: fmt(res.saldoBono),
      sub: t("resumen.creditoInterno"),
      color: "text-purple",
    },
    {
      label: t("resumen.ingresos"),
      value: fmt(res.totalIngresosReal + res.totalIngresosBono),
      sub: `${t("resumen.real")} ${fmt(res.totalIngresosReal)} + ${t("resumen.bono")} ${fmt(res.totalIngresosBono)}`,
      color: "text-success",
    },
    {
      label: t("resumen.egresos"),
      value: fmt(res.totalEgresosReal + res.totalEgresosBono),
      sub: `${t("resumen.real")} ${fmt(res.totalEgresosReal)} + ${t("resumen.bono")} ${fmt(res.totalEgresosBono)}`,
      color: "text-error",
    },
  ];

  async function handleExportCsv() {
    const token = useAuthStore.getState().token;
    const res = await fetch("/api/movimientos/exportar", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const blob = await res.blob();
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
        const d = new Date(m.timestamp);
        return (
          <div>
            <p className="text-sm text-text-secondary">{formatShortDate(d)}</p>
            <p className="text-xs text-text-muted">{formatTime(d)}</p>
          </div>
        );
      },
    },
    {
      key: "monto_real",
      header: t("table.real"),
      align: "right",
      render: (m) => {
        if (m.monto_real === 0) return <span className="text-xs text-text-disabled">&mdash;</span>;
        const neg = esEgreso(m.categoria as CategoriaMovimiento);
        return (
          <span className={clsx("font-mono text-sm font-semibold", neg ? "text-error" : "text-success")}>
            {neg ? "-" : "+"}{fmt(m.monto_real)}
          </span>
        );
      },
    },
    {
      key: "monto_bono",
      header: t("table.bono"),
      align: "right",
      render: (m) => {
        if (m.monto_bono === 0) return <span className="text-xs text-text-disabled">&mdash;</span>;
        const neg = esEgreso(m.categoria as CategoriaMovimiento);
        return (
          <span className={clsx("font-mono text-sm font-semibold", neg ? "text-purple" : "text-gold")}>
            {neg ? "-" : "+"}{fmt(m.monto_bono)}
          </span>
        );
      },
    },
    {
      key: "saldo_real_post",
      header: t("table.saldo"),
      align: "right",
      render: (m) => (
        <div className="text-right">
          <p className="font-mono text-sm text-text-primary">
            {fmt(m.saldo_real_post)}
          </p>
          <p className="font-mono text-[10px] text-text-muted">
            +{fmt(m.saldo_bono_post)} {t("table.bono").toLowerCase()}
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      {/* Sticky filter bar */}
      <div className="sticky top-0 z-10 bg-bg -mx-4 lg:-mx-6 px-4 lg:px-6 py-3 border-b border-border flex items-center gap-3 flex-wrap">
        <select
          value={catFilter}
          onChange={(e) => {
            setCatFilter(e.target.value);
            setPage(1);
          }}
          className="bg-card-dark border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-gold outline-none"
        >
          {Object.entries(CATEGORIA_LABELS).map(([val, label]) => (
            <option key={val} value={val}>
              {t(`categorias.${val || "todos"}`, { defaultValue: label })}
            </option>
          ))}
        </select>

        <div className="flex-1" />

        <Button variant="secondary" size="sm" onClick={handleExportCsv}>
          <Download className="w-4 h-4" />
          {t("filters.exportar")}
        </Button>
      </div>

      {/* Summary cards */}
      {resumenLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="bg-surface rounded-xl border border-border p-4"
            >
              <span className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold">
                {card.label}
              </span>
              <p className={clsx("text-xl font-mono font-bold mt-2", card.color)}>
                {card.value}
              </p>
              <p className="text-[10px] text-text-muted mt-1">{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Section label */}
      <span className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold block">
        {t("table.titulo")}
      </span>

      {/* Table */}
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
    </div>
  );
}
