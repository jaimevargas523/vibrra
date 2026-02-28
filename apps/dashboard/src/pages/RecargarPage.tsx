import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Wallet, Check, Heart } from "lucide-react";
import clsx from "clsx";

import { Badge } from "@/components/ui/Badge";
import { useMovimientosResumen } from "@/hooks/api/useMovimientosResumen";
import { usePais } from "@/hooks/api/usePais";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

export default function RecargarPage() {
  const { t } = useTranslation("recargar");
  const { data: resumen } = useMovimientosResumen();
  const { data: pais } = usePais();
  const fmt = useCurrencyFormatter();
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);

  const balance = resumen?.saldoDisponible ?? 0;
  const plans = pais?.recargaAnfitrion?.planes ?? [];
  const pasarela = pais?.recargaAnfitrion?.pasarela;
  const selected = plans.find((p) => p.amount === selectedPlan);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* ── Balance card ──────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-green/10 to-green/5 border border-green/20 rounded-xl p-6 text-center overflow-hidden">
        <Wallet className="absolute right-4 top-4 w-12 h-12 text-green/10" />
        <span className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold">
          SALDO ACTUAL
        </span>
        <p className="text-[36px] font-mono font-bold text-green mt-2 leading-tight">
          {fmt(balance)}
        </p>
        <p className="text-xs text-text-secondary mt-1">
          Recarga para empezar a operar
        </p>
      </div>

      {/* ── Plan selector ─────────────────────────────── */}
      <div>
        <span className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold block mb-3">
          SELECCIONA UN MONTO
        </span>
        <div className="space-y-3">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.amount;
            return (
              <button
                key={plan.amount}
                type="button"
                onClick={() => setSelectedPlan(plan.amount)}
                className={clsx(
                  "w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all cursor-pointer",
                  isSelected
                    ? "border-gold bg-gold/5"
                    : "border-border bg-surface hover:bg-surface-hover"
                )}
              >
                {/* Radio */}
                <div
                  className={clsx(
                    "flex items-center justify-center w-5 h-5 rounded-full border-2 shrink-0",
                    isSelected ? "border-gold bg-gold" : "border-text-muted"
                  )}
                >
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-[#0A0A0A]" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-lg font-bold text-text-primary">
                      {fmt(plan.amount)}
                    </span>
                    <span className="text-xs text-success font-semibold">
                      Bono +{plan.bonusPercent}%
                    </span>
                    {plan.recommended && (
                      <Badge variant="gold" size="sm">RECOMENDADO</Badge>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Recibes {fmt(plan.total)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Purchase summary ──────────────────────────── */}
      {selected && (
        <div className="bg-success/5 border border-success/20 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Pagas:</span>
            <span className="font-mono font-semibold text-text-primary">
              {fmt(selected.amount)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Bono acreditado:</span>
            <span className="font-mono font-semibold text-gold">
              +{fmt(selected.bonus)}
            </span>
          </div>
          <div className="border-t border-success/20 pt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-text-primary">Total en saldo:</span>
              <span className="font-mono text-lg font-bold text-green">
                {fmt(selected.total)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment method ────────────────────────────── */}
      {pasarela && (
        <div className="bg-gradient-to-r from-purple/10 to-purple/5 border border-purple/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple/15 shrink-0">
              <Heart className="w-5 h-5 text-purple" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-text-primary">
                  {pasarela.nombre} &middot; {pasarela.proveedores.join(", ")}
                </p>
                <Badge variant="purple" size="sm">UNICO METODO</Badge>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {pasarela.metodos.join(" \u00B7 ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Disclaimer ────────────────────────────────── */}
      <p className="text-[10px] text-text-disabled leading-relaxed">
        Al realizar el pago, aceptas los terminos y condiciones de VIBRRA y de
        la pasarela de pago. Los bonos no son dinero real ni retirable.
        El saldo recargado se acredita inmediatamente despues de la confirmacion
        del pago. Las recargas no son reembolsables.
      </p>

      {/* ── Pay button ────────────────────────────────── */}
      <button
        type="button"
        disabled={!selectedPlan}
        className={clsx(
          "w-full flex items-center justify-center gap-2 h-14 rounded-xl text-base font-bold transition-all",
          selectedPlan
            ? "bg-gold text-[#0A0A0A] hover:bg-gold-light cursor-pointer"
            : "bg-border text-text-disabled cursor-not-allowed"
        )}
      >
        <Wallet className="w-5 h-5" />
        {selectedPlan && pasarela
          ? `Pagar con ${pasarela.nombre}`
          : "Selecciona un plan para continuar"}
      </button>
    </div>
  );
}
