"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { calcUpdate, fmtCOP, type CalcInputs } from "@/lib/calc";
import styles from "@/styles/calculator.module.css";

const DEFAULTS: CalcInputs = {
  sesiones: 4,
  clientes: 30,
  conexion: 2000,
  transacciones: 40,
  puja: 4000,
  establecimientos: 1,
};

interface SliderConfig {
  key: keyof CalcInputs;
  labelKey: string;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  hintMin: string;
  hintMax: string;
}

const SLIDERS: SliderConfig[] = [
  { key: "sesiones", labelKey: "labelSesiones", min: 1, max: 7, step: 1, hintMin: "1 noche", hintMax: "7 noches" },
  { key: "clientes", labelKey: "labelClientes", min: 5, max: 120, step: 5, hintMin: "5", hintMax: "120" },
  { key: "conexion", labelKey: "labelConexion", min: 0, max: 10000, step: 500, format: (v) => fmtCOP(v), hintMin: "Gratis", hintMax: "$10.000" },
  { key: "transacciones", labelKey: "labelTransacciones", min: 5, max: 150, step: 5, hintMin: "5", hintMax: "150" },
  { key: "puja", labelKey: "labelPuja", min: 1000, max: 20000, step: 500, format: (v) => fmtCOP(v), hintMin: "$1.000", hintMax: "$20.000" },
  { key: "establecimientos", labelKey: "labelEstablecimientos", min: 1, max: 10, step: 1, hintMin: "1 local", hintMax: "10 locales" },
];

export function CalculatorClient() {
  const [inputs, setInputs] = useState<CalcInputs>(DEFAULTS);
  const t = useTranslations("calculator");
  const results = calcUpdate(inputs);

  const handleChange = useCallback(
    (key: keyof CalcInputs, value: number) => {
      setInputs((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  return (
    <div className={styles.calcGrid}>
      {/* Sliders panel */}
      <div className={styles.slidersPanel}>
        <div className={styles.panelLabel}>{t("configLabel")}</div>
        {SLIDERS.map((slider) => {
          const value = inputs[slider.key];
          const pct = ((value - slider.min) / (slider.max - slider.min)) * 100;
          return (
            <div key={slider.key} className={styles.calcGroup}>
              <div className={styles.calcLabel}>
                {t(slider.labelKey)}
                <span className={styles.calcVal}>
                  {slider.format ? slider.format(value) : value}
                </span>
              </div>
              <input
                type="range"
                className={styles.slider}
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={value}
                onChange={(e) =>
                  handleChange(slider.key, Number(e.target.value))
                }
                style={{ "--pct": `${pct}%` } as React.CSSProperties}
              />
              <div className={styles.calcHints}>
                <span>{slider.hintMin}</span>
                <span>{slider.hintMax}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Results panel */}
      <div className={styles.resultsPanel}>
        <div className={styles.panelLabel}>{t("resultsLabel")}</div>

        <div className={styles.totalBox}>
          <div className={styles.totalLabel}>{t("resultTotal")}</div>
          <div className={styles.totalAmount}>{fmtCOP(results.total)}</div>
          <div className={styles.totalSub}>{t("resultTotalSub")}</div>
        </div>

        <div className={styles.resultGrid}>
          <div className={styles.resultCard}>
            <div className={styles.resultLabel}>{t("resultConexiones")}</div>
            <div className={styles.resultVal} style={{ color: "var(--gold-mid)" }}>
              {fmtCOP(results.ingConexion)}
            </div>
          </div>
          <div className={styles.resultCard}>
            <div className={styles.resultLabel}>{t("resultTransacciones")}</div>
            <div className={styles.resultVal} style={{ color: "var(--gold)" }}>
              {fmtCOP(results.ingTrans)}
            </div>
          </div>
          <div className={styles.resultCard}>
            <div className={styles.resultLabel}>{t("resultAnual")}</div>
            <div className={styles.resultVal} style={{ color: "var(--gold-dk)" }}>
              {fmtCOP(results.anual)}
            </div>
          </div>
          <div className={styles.resultCard}>
            <div className={styles.resultLabel}>{t("resultCosto")}</div>
            <div className={styles.resultVal} style={{ color: "var(--gold-deep)" }}>
              {fmtCOP(results.suscripcion)}
            </div>
          </div>
        </div>

        <div className={styles.retiroBox}>
          <div className={styles.retiroLabel}>{t("retiroLabel")}</div>
          <div className={styles.retiroVal}>
            {fmtCOP(results.retiro)}{" "}
            <span className={styles.retiroNote}>{t("retiroNote")}</span>
          </div>
        </div>

        <div className={styles.disclaimer}>{t("disclaimer")}</div>
      </div>
    </div>
  );
}
