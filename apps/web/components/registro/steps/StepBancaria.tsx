"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useEnterNavigation } from "@/lib/use-enter-navigation";
import type { RegistrationFormData, CountryConfig } from "@/lib/registration/types";
import s from "@/styles/registro.module.css";

interface Props {
  data: RegistrationFormData;
  update: (fields: Partial<RegistrationFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  countryConfig: CountryConfig;
}

export function StepBancaria({ data, update, onNext, onBack, countryConfig }: Props) {
  const t = useTranslations("registro.step4");
  const tc = useTranslations("registro.common");
  const tv = useTranslations("registro.validation");

  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!data.banco) errs.banco = tv("fieldRequired");
    if (!data.tipoCuenta) errs.tipoCuenta = tv("fieldRequired");
    if (!data.numeroCuenta.trim()) errs.numeroCuenta = tv("fieldRequired");
    if (!data.titularCuenta.trim()) errs.titularCuenta = tv("fieldRequired");
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (validate()) onNext();
  }

  const { containerRef, handleKeyDown } = useEnterNavigation(handleNext);

  return (
    <div className={s.stepPanel} ref={containerRef} onKeyDown={handleKeyDown}>
      <div className={s.stepHeader}>
        <div className={s.stepEyebrow}>{t("eyebrow")}</div>
        <h2 className={s.stepTitle}>{t("title")}</h2>
        <p className={s.stepSubtitle}>{t("subtitle")}</p>
      </div>

      {/* Bank selector — driven by countryConfig.banks */}
      <div className={s.formSection}>
        <div className={s.formSectionTitle}>{t("sectionBanco")}</div>
        <div className={s.bankGrid}>
          {countryConfig.banks.map((bank) => {
            const label = t(bank.key);
            const selected = data.banco === label;
            return (
              <div
                key={bank.key}
                className={`${s.bankItem} ${selected ? s.bankItemSelected : ""}`}
                onClick={() => update({ banco: label })}
              >
                <div className={s.bankIcon}>{bank.icon}</div>
                <div className={`${s.bankName} ${selected ? s.bankNameSelected : ""}`}>
                  {label}
                </div>
              </div>
            );
          })}
        </div>
        {errors.banco && <div className={s.fieldError}>{errors.banco}</div>}
      </div>

      {/* Account data — driven by countryConfig.accountTypes */}
      <div className={s.formSection}>
        <div className={s.formSectionTitle}>{t("sectionDatos")}</div>
        <div className={s.formGrid}>
          <div className={s.formGroup}>
            <div className={s.formLabel}>
              {t("tipoCuentaLabel")} <span className={s.formRequired}>{tc("requiredShort")}</span>
            </div>
            <select
              className={`${s.input} ${errors.tipoCuenta ? s.inputError : ""}`}
              value={data.tipoCuenta}
              onChange={(e) => update({ tipoCuenta: e.target.value })}
            >
              <option value="">{tc("select")}</option>
              {countryConfig.accountTypes.map((at) => (
                <option key={at.value} value={at.value}>
                  {t(at.i18nKey)}
                </option>
              ))}
            </select>
            {errors.tipoCuenta && <div className={s.fieldError}>{errors.tipoCuenta}</div>}
          </div>

          <div className={s.formGroup}>
            <div className={s.formLabel}>
              {t("numeroCuentaLabel")} <span className={s.formRequired}>{tc("requiredShort")}</span>
            </div>
            <input
              className={`${s.input} ${errors.numeroCuenta ? s.inputError : ""}`}
              placeholder={t("numeroCuentaPlaceholder")}
              value={data.numeroCuenta}
              onChange={(e) => update({ numeroCuenta: e.target.value })}
            />
            {errors.numeroCuenta && <div className={s.fieldError}>{errors.numeroCuenta}</div>}
          </div>

          <div className={`${s.formGroup} ${s.formGroupSpan2}`}>
            <div className={s.formLabel}>
              {t("titularLabel")} <span className={s.formRequired}>{tc("requiredShort")}</span>
            </div>
            <input
              className={`${s.input} ${errors.titularCuenta ? s.inputError : ""}`}
              placeholder={t("titularPlaceholder")}
              value={data.titularCuenta}
              onChange={(e) => update({ titularCuenta: e.target.value })}
            />
            {errors.titularCuenta && <div className={s.fieldError}>{errors.titularCuenta}</div>}
            <div className={s.formHint}>{t("titularHint")}</div>
          </div>
        </div>
      </div>

      <div className={s.infoBox}>{t("retiroInfo")}</div>

      <div className={s.formNav}>
        <button className={s.btnSecondary} onClick={onBack}>{tc("backBtn")}</button>
        <button className={s.btnPrimary} onClick={handleNext}>{tc("continueBtn")}</button>
      </div>
    </div>
  );
}
