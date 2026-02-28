"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { VibrraLogo } from "@/components/ui/VibrraLogo";

interface Plan {
  id: string;
  monto: number;
  bonus: number;
  popular: boolean;
}

const plans: Plan[] = [
  { id: "cli-10k", monto: 10_000, bonus: 0, popular: false },
  { id: "cli-20k", monto: 20_000, bonus: 2_000, popular: false },
  { id: "cli-50k", monto: 50_000, bonus: 7_500, popular: true },
  { id: "cli-100k", monto: 100_000, bonus: 18_000, popular: false },
];

function formatCOP(n: number): string {
  return "$" + Math.round(n).toLocaleString("es-CO");
}

export function RecargaClient() {
  const t = useTranslations("recarga");
  const { user, loading } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);

  const plan = plans.find((p) => p.id === selected);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--ink)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--gold)] border-t-transparent" />
          <VibrraLogo width={120} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--ink)] text-[var(--txt)]">
      {/* Header */}
      <header className="flex items-center justify-center py-6 border-b border-[var(--edge)]">
        <VibrraLogo width={140} />
      </header>

      <main className="max-w-md mx-auto px-4 py-8 space-y-8">
        {/* Title */}
        <div className="text-center space-y-3">
          <span className="text-[10px] uppercase tracking-[2px] font-bold text-[var(--gold-mid)]">
            {t("eyebrow")}
          </span>
          <h1
            className="text-[28px] font-bold leading-tight"
            style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}
          >
            {t.rich("title", {
              em: (chunks) => (
                <em className="text-[var(--gold)] italic">{chunks}</em>
              ),
            })}
          </h1>
          <p className="text-sm text-[var(--soft)]">{t("sub")}</p>
        </div>

        {/* Balance card */}
        {user && (
          <div className="rounded-xl border border-[var(--edge)] bg-[var(--panel)] p-5 text-center">
            <span className="text-[9px] uppercase tracking-[2px] text-[var(--muted)] font-semibold">
              {t("saldoLabel")}
            </span>
            <p className="text-[32px] font-mono font-bold text-[var(--gold)] mt-1">
              $0
            </p>
          </div>
        )}

        {/* Login required */}
        {!user && (
          <div className="rounded-xl border border-[var(--gold-mid)]/30 bg-[var(--gold-mid)]/5 p-6 text-center space-y-4">
            <p className="text-sm text-[var(--soft)]">{t("loginRequired")}</p>
            <a
              href="/#acceso"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--gold)] text-[var(--ink)] font-bold text-sm rounded-lg hover:bg-white transition-all"
            >
              {t("btnLogin")}
            </a>
          </div>
        )}

        {/* Plan selection */}
        <div className="space-y-3">
          <span className="text-[9px] uppercase tracking-[2px] text-[var(--muted)] font-semibold">
            {t("selectPlan")}
          </span>

          <div className="grid grid-cols-2 gap-3">
            {plans.map((p) => {
              const isSelected = selected === p.id;
              const total = p.monto + p.bonus;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelected(p.id)}
                  className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                    isSelected
                      ? "border-[var(--gold)] bg-[var(--gold)]/5"
                      : "border-[var(--edge)] bg-[var(--panel)] hover:border-[var(--muted)]"
                  }`}
                >
                  {p.popular && (
                    <span className="absolute -top-2.5 left-3 px-2 py-0.5 bg-[var(--gold)] text-[var(--ink)] text-[9px] font-bold uppercase tracking-wider rounded">
                      {t("popular")}
                    </span>
                  )}
                  <p className="text-lg font-mono font-bold text-[var(--txt)]">
                    {formatCOP(p.monto)}
                  </p>
                  {p.bonus > 0 && (
                    <p className="text-xs text-[var(--live)] font-semibold mt-1">
                      + {formatCOP(p.bonus)} {t("bonus")}
                    </p>
                  )}
                  <p className="text-[10px] text-[var(--muted)] mt-1">
                    {t("total")}: {formatCOP(total)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        {plan && (
          <div className="rounded-xl border border-[var(--edge)] bg-[var(--panel)] p-5 space-y-3">
            <span className="text-[9px] uppercase tracking-[2px] text-[var(--muted)] font-semibold">
              {t("summaryTitle")}
            </span>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--soft)]">{t("summaryPagas")}</span>
              <span className="font-mono font-semibold">{formatCOP(plan.monto)}</span>
            </div>
            {plan.bonus > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--soft)]">{t("summaryBonus")}</span>
                <span className="font-mono font-semibold text-[var(--live)]">
                  +{formatCOP(plan.bonus)}
                </span>
              </div>
            )}
            <div className="border-t border-[var(--edge)] pt-3 flex justify-between text-sm">
              <span className="text-[var(--soft)]">{t("summaryTotal")}</span>
              <span className="font-mono font-bold text-[var(--gold)]">
                {formatCOP(plan.monto + plan.bonus)}
              </span>
            </div>
          </div>
        )}

        {/* Payment method */}
        <div className="space-y-3">
          <span className="text-[9px] uppercase tracking-[2px] text-[var(--muted)] font-semibold">
            {t("methodTitle")}
          </span>
          <div className="rounded-xl border-2 border-[var(--gold)]/30 bg-[var(--panel)] p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">{t("methodWompi")}</p>
              <p className="text-xs text-[var(--muted)]">{t("methodWompiDesc")}</p>
            </div>
            <span className="px-2 py-0.5 bg-[var(--gold)]/10 text-[var(--gold)] text-[9px] font-bold uppercase tracking-wider rounded">
              {t("methodBadge")}
            </span>
          </div>
        </div>

        {/* CTA Button */}
        <button
          type="button"
          disabled={!plan || !user}
          className={`w-full py-4 rounded-xl font-bold text-sm transition-all ${
            plan && user
              ? "bg-[var(--gold)] text-[var(--ink)] hover:bg-white hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(255,229,102,.3)]"
              : "bg-[var(--edge)] text-[var(--muted)] cursor-not-allowed"
          }`}
        >
          {plan && user ? t("btnPagar") : t("btnDisabled")}
        </button>

        {/* Disclaimer */}
        <p className="text-[11px] text-[var(--muted)] text-center leading-relaxed">
          {t("disclaimer")}
        </p>
      </main>
    </div>
  );
}
