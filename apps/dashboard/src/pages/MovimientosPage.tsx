import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  Percent,
  Download,
  Wallet,
} from "lucide-react";
import clsx from "clsx";

import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

import { useMovimientos, type Movimiento } from "@/hooks/api/useMovimientos";
import { useMovimientosResumen } from "@/hooks/api/useMovimientosResumen";
import { useEstablishmentStore } from "@/stores/establishment.store";
import { formatCOP, formatShortDate, formatTime } from "@/lib/format";

/* ── Fallback data ───────────────────────────────────────────── */

const fallbackResumen = {
  saldoDisponible: 247500,
  totalIngresos: 1850000,
  totalRetiros: 1200000,
  totalBonificaciones: 85000,
  totalComisiones: 487500,
  pendientePago: 0,
  ultimoRetiro: null,
};

const fallbackMovimientos: Movimiento[] = [
  {
    id: "m1",
    type: "ingreso",
    amount: 185000,
    description: "Sesion La Terraza Rooftop",
    sessionId: "s1",
    establishmentName: "La Terraza Rooftop",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    status: "completed",
    reference: null,
  },
  {
    id: "m2",
    type: "comision",
    amount: -27750,
    description: "Comision VIBRRA 15%",
    sessionId: "s1",
    establishmentName: "La Terraza Rooftop",
    createdAt: new Date(Date.now() - 3500000).toISOString(),
    status: "completed",
    reference: null,
  },
  {
    id: "m3",
    type: "ingreso",
    amount: 142000,
    description: "Sesion Bar El Dorado",
    sessionId: "s2",
    establishmentName: "Bar El Dorado",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    status: "completed",
    reference: null,
  },
  {
    id: "m4",
    type: "retiro",
    amount: -300000,
    description: "Retiro a Bancolombia ****4521",
    sessionId: null,
    establishmentName: null,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    status: "completed",
    reference: "RET-2026-0042",
  },
  {
    id: "m5",
    type: "bonificacion",
    amount: 15000,
    description: "Bono por recarga $100.000",
    sessionId: null,
    establishmentName: null,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    status: "completed",
    reference: null,
  },
];

/* ── Helpers ─────────────────────────────────────────────────── */

function TypeIcon({ type }: { type: Movimiento["type"] }) {
  switch (type) {
    case "ingreso":
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-success/10 shrink-0">
          <ArrowDownLeft className="w-4 h-4 text-success" />
        </div>
      );
    case "retiro":
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-error/10 shrink-0">
          <ArrowUpRight className="w-4 h-4 text-error" />
        </div>
      );
    case "bonificacion":
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple/10 shrink-0">
          <Gift className="w-4 h-4 text-purple" />
        </div>
      );
    case "comision":
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-warning/10 shrink-0">
          <Percent className="w-4 h-4 text-warning" />
        </div>
      );
  }
}

const typeLabels: Record<string, string> = {
  ingreso: "Ingreso",
  retiro: "Retiro",
  bonificacion: "Bonificacion",
  comision: "Comision",
};

/* ── Page ─────────────────────────────────────────────────────── */

export default function MovimientosPage() {
  const { t } = useTranslation("movimientos");
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [estFilter, setEstFilter] = useState<string>("");

  const establishments = useEstablishmentStore((s) => s.establishments);
  const { data: resumen, isLoading: resumenLoading } = useMovimientosResumen();
  const { data, isLoading } = useMovimientos({
    page,
    type: typeFilter || undefined,
  });

  const res = resumen ?? fallbackResumen;
  const items: Movimiento[] = data?.items ?? fallbackMovimientos;
  const totalPages = data?.totalPages ?? 1;

  const summaryCards = [
    {
      label: "INGRESOS BRUTOS",
      value: formatCOP(res.totalIngresos),
      color: "text-success",
    },
    {
      label: "DEDUCCIONES",
      value: formatCOP(res.totalComisiones),
      color: "text-error",
    },
    {
      label: "RETIRADO",
      value: formatCOP(res.totalRetiros),
      color: "text-info",
    },
    {
      label: "SALDO",
      value: formatCOP(res.saldoDisponible),
      color: "text-gold",
    },
  ];

  const columns: Column<Movimiento>[] = [
    {
      key: "type",
      header: "TIPO",
      render: (m) => (
        <div className="flex items-center gap-3">
          <TypeIcon type={m.type} />
          <div>
            <p className="text-sm font-medium text-text-primary">
              {typeLabels[m.type] ?? m.type}
            </p>
            <p className="text-xs text-text-muted truncate max-w-[200px]">
              {m.description}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "establishmentName",
      header: "ESTABLECIMIENTO",
      render: (m) => {
        const d = new Date(m.createdAt);
        return (
          <div>
            <p className="text-sm text-text-secondary">
              {m.establishmentName ?? "General"}
            </p>
            <p className="text-xs text-text-muted">
              {formatShortDate(d)} {formatTime(d)}
            </p>
          </div>
        );
      },
    },
    {
      key: "reference",
      header: "REFERENCIA",
      render: (m) =>
        m.reference ? (
          <span className="font-mono text-xs text-text-muted">{m.reference}</span>
        ) : (
          <span className="text-xs text-text-disabled">&mdash;</span>
        ),
    },
    {
      key: "amount",
      header: "MONTO NETO",
      align: "right",
      render: (m) => {
        const isPositive = m.type === "ingreso" || m.type === "bonificacion";
        return (
          <div className="text-right">
            <p
              className={clsx(
                "font-mono text-sm font-semibold",
                isPositive ? "text-success" : "text-error"
              )}
            >
              {isPositive ? "+" : ""}
              {formatCOP(m.amount)}
            </p>
            <Badge
              variant={
                m.status === "completed"
                  ? "success"
                  : m.status === "pending"
                    ? "warning"
                    : "error"
              }
              size="sm"
            >
              {m.status === "completed"
                ? "Completado"
                : m.status === "pending"
                  ? "Pendiente"
                  : "Fallido"}
            </Badge>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Movimientos"
        subtitle="Historial de transacciones y balance"
      />

      {/* Sticky filter bar */}
      <div className="sticky top-0 z-10 bg-bg -mx-4 lg:-mx-6 px-4 lg:px-6 py-3 border-b border-border flex items-center gap-3 flex-wrap">
        {establishments.length > 1 && (
          <select
            value={estFilter}
            onChange={(e) => {
              setEstFilter(e.target.value);
              setPage(1);
            }}
            className="bg-card-dark border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-gold outline-none"
          >
            <option value="">Todos</option>
            {establishments.map((est) => (
              <option key={est.id} value={est.id}>
                {est.name}
              </option>
            ))}
          </select>
        )}

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="bg-card-dark border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-gold outline-none"
        >
          <option value="">Todos los tipos</option>
          <option value="ingreso">Ingresos</option>
          <option value="retiro">Retiros</option>
          <option value="bonificacion">Bonificaciones</option>
          <option value="comision">Comisiones</option>
        </select>

        <div className="flex-1" />

        <Button variant="secondary" size="sm">
          <Download className="w-4 h-4" />
          Exportar CSV
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
            </div>
          ))}
        </div>
      )}

      {/* Section label */}
      <span className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold block">
        TRANSACCIONES
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
            title="Sin movimientos"
            description="Los movimientos de tus sesiones y retiros apareceran aqui."
          />
        }
      />
    </div>
  );
}
