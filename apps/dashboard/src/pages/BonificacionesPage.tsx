import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Banknote, Zap } from "lucide-react";

import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

import { useMovimientosResumen } from "@/hooks/api/useMovimientosResumen";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

const BONO_TOTAL = 30_000;

export default function BonificacionesPage() {
  const { t } = useTranslation("bonificaciones");
  const { data: resumen } = useMovimientosResumen();
  const fmt = useCurrencyFormatter();

  const saldo = resumen?.bonoArranqueSaldo ?? 0;
  const usado = resumen?.bonoArranqueUsado ?? 0;
  const agotado = saldo <= 0;
  const usedPercent = BONO_TOTAL > 0 ? Math.min(100, (usado / BONO_TOTAL) * 100) : 0;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle", { total: fmt(BONO_TOTAL) })}
      />

      {/* ── Info banner ───────────────────────────────── */}
      <div className="bg-gold/5 border border-gold/20 rounded-xl p-4 flex items-start gap-3">
        <Zap className="w-5 h-5 text-gold shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-gold">
            {t("banner.titulo")}
          </p>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed">
            {t("banner.desc")}
          </p>
        </div>
      </div>

      {/* ── Bonus card ──────────────────────────────── */}
      <div className="bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/20 rounded-xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold">
              {t("card.label")}
            </span>
            <p className="text-[30px] font-bold text-gold-light mt-1 leading-tight">
              {fmt(saldo)}
            </p>
          </div>
          <Badge variant={agotado ? "neutral" : "gold"}>
            {agotado ? t("card.agotado") : t("card.activo")}
          </Badge>
        </div>

        <div className="border-t border-gold/15 mt-4 pt-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-text-muted">{t("card.disponible")}</p>
              <p className="font-mono font-semibold text-gold">
                {fmt(saldo)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted">{t("card.usado")}</p>
              <p className="font-mono font-semibold text-success">
                {fmt(usado)}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1 bg-gold-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-gold-light rounded-full transition-all duration-500"
              style={{ width: `${Math.min(usedPercent, 100)}%` }}
            />
          </div>

          <p className="text-[10px] text-text-muted mt-3">
            {t("card.total", { total: fmt(BONO_TOTAL) })}
          </p>
        </div>
      </div>

      {/* ── How it works ────────────────────────────── */}
      <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
        <span className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold">
          {t("como.title")}
        </span>

        {(["paso1", "paso2", "paso3", "paso4"] as const).map((paso, i) => (
          <div key={paso} className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gold/10 text-gold text-xs font-bold shrink-0 mt-0.5">
              {i + 1}
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              {t(`como.${paso}`)}
            </p>
          </div>
        ))}
      </div>

      {/* ── CTA ───────────────────────────────────────── */}
      <Link to="/anfitrion/recargar-cliente" className="block">
        <Button className="w-full" size="lg">
          <Banknote className="w-5 h-5" />
          {t("cta")}
        </Button>
      </Link>
    </div>
  );
}
