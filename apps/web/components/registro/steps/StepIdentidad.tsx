"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useEnterNavigation } from "@/lib/use-enter-navigation";
import type { RegistrationFormData, CountryConfig } from "@/lib/registration/types";
import s from "@/styles/registro.module.css";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMG = ["image/jpeg", "image/png"];

interface Props {
  data: RegistrationFormData;
  update: (fields: Partial<RegistrationFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  countryConfig: CountryConfig;
}

export function StepIdentidad({ data, update, onNext, onBack, countryConfig }: Props) {
  const t = useTranslations("registro.step2");
  const tc = useTranslations("registro.common");
  const tv = useTranslations("registro.validation");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [countryCode, setCountryCode] = useState(countryConfig.defaultPhonePrefix);
  const [phoneNumber, setPhoneNumber] = useState("");

  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  function validateFile(file: File): string | null {
    if (file.size > MAX_SIZE) return tv("fileTooBig");
    if (!ALLOWED_IMG.includes(file.type)) return tv("fileInvalidType");
    return null;
  }

  function handleFileChange(
    key: "docFrontal" | "docPosterior" | "selfie",
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) {
      setErrors((prev) => ({ ...prev, [key]: err }));
      return;
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    update({ [key]: file });
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!data.nombres.trim()) errs.nombres = tv("fieldRequired");
    if (!data.apellidos.trim()) errs.apellidos = tv("fieldRequired");
    if (!data.tipoDoc) errs.tipoDoc = tv("fieldRequired");
    if (!data.numeroDoc.trim()) errs.numeroDoc = tv("docRequired");
    if (!data.fechaNac) errs.fechaNac = tv("fieldRequired");
    if (!data.celular.trim()) errs.celular = tv("fieldRequired");
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

      {/* Personal data */}
      <div className={s.formSection}>
        <div className={s.formSectionTitle}>{t("sectionPersonal")}</div>
        <div className={s.formGrid}>
          <div className={s.formGroup}>
            <div className={s.formLabel}>
              {t("nombresLabel")} <span className={s.formRequired}>{tc("requiredShort")}</span>
            </div>
            <input
              className={`${s.input} ${errors.nombres ? s.inputError : ""}`}
              placeholder={t("nombresPlaceholder")}
              value={data.nombres}
              onChange={(e) => update({ nombres: e.target.value })}
            />
            {errors.nombres && <div className={s.fieldError}>{errors.nombres}</div>}
          </div>

          <div className={s.formGroup}>
            <div className={s.formLabel}>
              {t("apellidosLabel")} <span className={s.formRequired}>{tc("requiredShort")}</span>
            </div>
            <input
              className={`${s.input} ${errors.apellidos ? s.inputError : ""}`}
              placeholder={t("apellidosPlaceholder")}
              value={data.apellidos}
              onChange={(e) => update({ apellidos: e.target.value })}
            />
            {errors.apellidos && <div className={s.fieldError}>{errors.apellidos}</div>}
          </div>

          {/* Document type — driven by countryConfig.identityDocs */}
          <div className={s.formGroup}>
            <div className={s.formLabel}>
              {t("tipoDocLabel")} <span className={s.formRequired}>{tc("requiredShort")}</span>
            </div>
            <select
              className={`${s.input} ${errors.tipoDoc ? s.inputError : ""}`}
              value={data.tipoDoc}
              onChange={(e) => update({ tipoDoc: e.target.value })}
            >
              <option value="">{tc("select")}</option>
              {countryConfig.identityDocs.map((doc) => (
                <option key={doc.value} value={doc.value}>
                  {t(doc.i18nKey)}
                </option>
              ))}
            </select>
            {errors.tipoDoc && <div className={s.fieldError}>{errors.tipoDoc}</div>}
          </div>

          <div className={s.formGroup}>
            <div className={s.formLabel}>
              {t("numeroDocLabel")} <span className={s.formRequired}>{tc("requiredShort")}</span>
            </div>
            <input
              className={`${s.input} ${errors.numeroDoc ? s.inputError : ""}`}
              placeholder={t("numeroDocPlaceholder")}
              value={data.numeroDoc}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                update({ numeroDoc: val });
              }}
            />
            {errors.numeroDoc && <div className={s.fieldError}>{errors.numeroDoc}</div>}
          </div>

          <div className={s.formGroup}>
            <div className={s.formLabel}>
              {t("fechaNacLabel")} <span className={s.formRequired}>{tc("requiredShort")}</span>
            </div>
            <input
              type="date"
              className={`${s.input} ${errors.fechaNac ? s.inputError : ""}`}
              value={data.fechaNac}
              onChange={(e) => update({ fechaNac: e.target.value })}
            />
            {errors.fechaNac && <div className={s.fieldError}>{errors.fechaNac}</div>}
          </div>

          {/* Phone — driven by countryConfig.phonePrefixes */}
          <div className={s.formGroup}>
            <div className={s.formLabel}>
              {t("celularLabel")} <span className={s.formRequired}>{tc("requiredShort")}</span>
            </div>
            <div className={s.phoneRow}>
              <select
                className={`${s.input} ${s.phoneCode}`}
                value={countryCode}
                onChange={(e) => {
                  setCountryCode(e.target.value);
                  update({ celular: `${e.target.value} ${phoneNumber}` });
                }}
              >
                {countryConfig.phonePrefixes.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
              <input
                type="tel"
                className={`${s.input} ${s.phoneNumber} ${errors.celular ? s.inputError : ""}`}
                placeholder={t("celularPlaceholder")}
                value={phoneNumber}
                onChange={(e) => {
                  const num = e.target.value.replace(/[^\d\s]/g, "");
                  setPhoneNumber(num);
                  update({ celular: `${countryCode} ${num}` });
                }}
              />
            </div>
            {errors.celular && <div className={s.fieldError}>{errors.celular}</div>}
          </div>
        </div>
      </div>

      {/* Document photos */}
      <div className={s.formSection}>
        <div className={s.formSectionTitle}>{t("sectionDoc")}</div>
        <div className={s.infoBox}>{t("docInfo")}</div>
        <div className={s.docPreview}>
          {/* Front */}
          <div
            className={`${s.docCard} ${data.docFrontal ? s.docCardDone : ""}`}
            onClick={() => frontRef.current?.click()}
          >
            <div className={s.docCardIcon}>{data.docFrontal ? "\u2705" : "\u{1F4C4}"}</div>
            <div className={`${s.docCardLabel} ${data.docFrontal ? s.docCardLabelDone : ""}`}>
              {data.docFrontal ? t("docUploaded") : t("docFront")}
            </div>
          </div>
          <input
            ref={frontRef}
            type="file"
            accept="image/jpeg,image/png"
            className={s.hiddenInput}
            onChange={(e) => handleFileChange("docFrontal", e)}
          />

          {/* Back */}
          <div
            className={`${s.docCard} ${data.docPosterior ? s.docCardDone : ""}`}
            onClick={() => backRef.current?.click()}
          >
            <div className={s.docCardIcon}>{data.docPosterior ? "\u2705" : "\u{1F4C4}"}</div>
            <div className={`${s.docCardLabel} ${data.docPosterior ? s.docCardLabelDone : ""}`}>
              {data.docPosterior ? t("docUploaded") : t("docBack")}
            </div>
          </div>
          <input
            ref={backRef}
            type="file"
            accept="image/jpeg,image/png"
            className={s.hiddenInput}
            onChange={(e) => handleFileChange("docPosterior", e)}
          />

          {/* Selfie */}
          <div
            className={`${s.docCard} ${data.selfie ? s.docCardDone : ""}`}
            onClick={() => selfieRef.current?.click()}
          >
            <div className={s.docCardIcon}>{data.selfie ? "\u2705" : "\u{1F933}"}</div>
            <div className={`${s.docCardLabel} ${data.selfie ? s.docCardLabelDone : ""}`}>
              {data.selfie ? t("docUploaded") : t("docSelfie")}
            </div>
          </div>
          <input
            ref={selfieRef}
            type="file"
            accept="image/jpeg,image/png"
            className={s.hiddenInput}
            onChange={(e) => handleFileChange("selfie", e)}
          />
        </div>
        {(errors.docFrontal || errors.docPosterior || errors.selfie) && (
          <div className={s.fieldError}>
            {errors.docFrontal || errors.docPosterior || errors.selfie}
          </div>
        )}
        <div className={s.formHint} style={{ marginTop: 10 }}>{t("docFormats")}</div>
      </div>

      <div className={s.formNav}>
        <button className={s.btnSecondary} onClick={onBack}>{tc("backBtn")}</button>
        <button className={s.btnPrimary} onClick={handleNext}>{tc("continueBtn")}</button>
      </div>
    </div>
  );
}
