"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useEnterNavigation } from "@/lib/use-enter-navigation";
import type { RegistrationFormData, CountryConfig } from "@/lib/registration/types";
import s from "@/styles/registro.module.css";

const MAX_SIZE = 5 * 1024 * 1024;

interface Props {
  data: RegistrationFormData;
  update: (fields: Partial<RegistrationFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  countryConfig: CountryConfig;
}

export function StepTributario({ data, update, onNext, onBack, countryConfig }: Props) {
  const t = useTranslations("registro.step3");
  const tc = useTranslations("registro.common");
  const tv = useTranslations("registro.validation");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const rutRef = useRef<HTMLInputElement>(null);

  const { taxDoc } = countryConfig;

  function handleDocChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE) {
      setErrors((prev) => ({ ...prev, rut: tv("fileTooBig") }));
      return;
    }
    if (taxDoc && !taxDoc.accepts.includes(file.type)) {
      setErrors((prev) => ({ ...prev, rut: tv("fileInvalidType") }));
      return;
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next.rut;
      return next;
    });
    update({ rutFile: file });
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!data.nit.trim()) errs.nit = tv("fieldRequired");
    if (!data.regimen) errs.regimen = tv("fieldRequired");
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

      {/* Person type — driven by countryConfig.personTypes */}
      <div className={s.formSection}>
        <div className={s.formSectionTitle}>{t("sectionTipo")}</div>
        <div className={s.radioGroup}>
          {countryConfig.personTypes.map((pt) => {
            const selected = data.tipoPersona === pt.value;
            return (
              <div
                key={pt.value}
                className={`${s.radioItem} ${selected ? s.radioItemSelected : ""}`}
                onClick={() => update({ tipoPersona: pt.value })}
              >
                <div className={`${s.radioDot} ${selected ? s.radioDotSelected : ""}`}>
                  {selected && <div className={s.radioDotInner} />}
                </div>
                <div>
                  <div className={s.radioText}>{t(pt.i18nKey)}</div>
                  <div className={s.radioSub}>{t(pt.descI18nKey)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tax data — driven by countryConfig.taxRegimes */}
      <div className={s.formSection}>
        <div className={s.formSectionTitle}>{t("sectionDatos")}</div>
        <div className={s.formGrid}>
          <div className={s.formGroup}>
            <div className={s.formLabel}>
              {t("nitLabel")} <span className={s.formRequired}>{tc("requiredShort")}</span>
            </div>
            <input
              className={`${s.input} ${errors.nit ? s.inputError : ""}`}
              placeholder={t("nitPlaceholder")}
              value={data.nit}
              onChange={(e) => update({ nit: e.target.value })}
            />
            {errors.nit && <div className={s.fieldError}>{errors.nit}</div>}
            <div className={s.formHint}>{t("nitHint")}</div>
          </div>
          <div className={s.formGroup}>
            <div className={s.formLabel}>
              {t("regimenLabel")} <span className={s.formRequired}>{tc("requiredShort")}</span>
            </div>
            <select
              className={`${s.input} ${errors.regimen ? s.inputError : ""}`}
              value={data.regimen}
              onChange={(e) => update({ regimen: e.target.value })}
            >
              <option value="">{tc("select")}</option>
              {countryConfig.taxRegimes.map((reg) => (
                <option key={reg.value} value={reg.value}>
                  {t(reg.i18nKey)}
                </option>
              ))}
            </select>
            {errors.regimen && <div className={s.fieldError}>{errors.regimen}</div>}
          </div>
        </div>
      </div>

      {/* Tax document upload (RUT for CO) — only if taxDoc is configured */}
      {taxDoc && (
        <div className={s.formSection}>
          <div className={s.formSectionTitle}>{t("sectionRut")}</div>
          <div className={s.infoBox}>{t(`${taxDoc.i18nPrefix}Info`)}</div>
          <div
            className={`${s.uploadArea} ${data.rutFile ? s.uploadAreaDone : ""}`}
            onClick={() => rutRef.current?.click()}
          >
            {data.rutFile && <div className={s.uploadBadge}>{t(`${taxDoc.i18nPrefix}UploadedBadge`)}</div>}
            <div className={s.uploadIcon}>{"\u{1F4CB}"}</div>
            <div className={s.uploadTitle} style={data.rutFile ? { color: "#2ECC71" } : undefined}>
              {data.rutFile ? t(`${taxDoc.i18nPrefix}Uploaded`) : t(`${taxDoc.i18nPrefix}UploadTitle`)}
            </div>
            <div className={s.uploadDesc}>
              {data.rutFile ? `${data.rutFile.name} · ${(data.rutFile.size / 1024 / 1024).toFixed(1)}MB` : t(`${taxDoc.i18nPrefix}UploadDesc`)}
            </div>
          </div>
          <input
            ref={rutRef}
            type="file"
            accept={taxDoc.accepts.join(",")}
            className={s.hiddenInput}
            onChange={handleDocChange}
          />
          {errors.rut && <div className={s.fieldError}>{errors.rut}</div>}
        </div>
      )}

      {/* IVA / VAT — only if enabled for this country */}
      {countryConfig.vat.enabled && (
        <div className={s.formSection}>
          <div className={s.formSectionTitle}>{t("sectionIva")}</div>
          <div className={s.radioGroup}>
            <div
              className={`${s.radioItem} ${!data.responsableIva ? s.radioItemSelected : ""}`}
              onClick={() => update({ responsableIva: false })}
            >
              <div className={`${s.radioDot} ${!data.responsableIva ? s.radioDotSelected : ""}`}>
                {!data.responsableIva && <div className={s.radioDotInner} />}
              </div>
              <div>
                <div className={s.radioText}>{t("noIva")}</div>
                <div className={s.radioSub}>{t("noIvaDesc")}</div>
              </div>
            </div>
            <div
              className={`${s.radioItem} ${data.responsableIva ? s.radioItemSelected : ""}`}
              onClick={() => update({ responsableIva: true })}
            >
              <div className={`${s.radioDot} ${data.responsableIva ? s.radioDotSelected : ""}`}>
                {data.responsableIva && <div className={s.radioDotInner} />}
              </div>
              <div>
                <div className={s.radioText}>{t("siIva")}</div>
                <div className={s.radioSub}>{t("siIvaDesc")}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={s.formNav}>
        <button className={s.btnSecondary} onClick={onBack}>{tc("backBtn")}</button>
        <button className={s.btnPrimary} onClick={handleNext}>{tc("continueBtn")}</button>
      </div>
    </div>
  );
}
