"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useEnterNavigation } from "@/lib/use-enter-navigation";
import type { FormData } from "../RegistroWizard";
import s from "@/styles/registro.module.css";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_RUT = ["image/jpeg", "image/png", "application/pdf"];

interface Props {
  data: FormData;
  update: (fields: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepTributario({ data, update, onNext, onBack }: Props) {
  const t = useTranslations("registro.step3");
  const tc = useTranslations("registro.common");
  const tv = useTranslations("registro.validation");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const rutRef = useRef<HTMLInputElement>(null);

  function handleRutChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE) {
      setErrors((prev) => ({ ...prev, rut: tv("fileTooBig") }));
      return;
    }
    if (!ALLOWED_RUT.includes(file.type)) {
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

      {/* Person type */}
      <div className={s.formSection}>
        <div className={s.formSectionTitle}>{t("sectionTipo")}</div>
        <div className={s.radioGroup}>
          <div
            className={`${s.radioItem} ${data.tipoPersona === "natural" ? s.radioItemSelected : ""}`}
            onClick={() => update({ tipoPersona: "natural" })}
          >
            <div className={`${s.radioDot} ${data.tipoPersona === "natural" ? s.radioDotSelected : ""}`}>
              {data.tipoPersona === "natural" && <div className={s.radioDotInner} />}
            </div>
            <div>
              <div className={s.radioText}>{t("natural")}</div>
              <div className={s.radioSub}>{t("naturalDesc")}</div>
            </div>
          </div>
          <div
            className={`${s.radioItem} ${data.tipoPersona === "juridica" ? s.radioItemSelected : ""}`}
            onClick={() => update({ tipoPersona: "juridica" })}
          >
            <div className={`${s.radioDot} ${data.tipoPersona === "juridica" ? s.radioDotSelected : ""}`}>
              {data.tipoPersona === "juridica" && <div className={s.radioDotInner} />}
            </div>
            <div>
              <div className={s.radioText}>{t("juridica")}</div>
              <div className={s.radioSub}>{t("juridicaDesc")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tax data */}
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
              <option value="simple">{t("regimenSimple")}</option>
              <option value="ordinario">{t("regimenOrdinario")}</option>
              <option value="no_iva">{t("regimenNoIva")}</option>
            </select>
            {errors.regimen && <div className={s.fieldError}>{errors.regimen}</div>}
          </div>
        </div>
      </div>

      {/* RUT upload */}
      <div className={s.formSection}>
        <div className={s.formSectionTitle}>{t("sectionRut")}</div>
        <div className={s.infoBox}>{t("rutInfo")}</div>
        <div
          className={`${s.uploadArea} ${data.rutFile ? s.uploadAreaDone : ""}`}
          onClick={() => rutRef.current?.click()}
        >
          {data.rutFile && <div className={s.uploadBadge}>{t("rutUploadedBadge")}</div>}
          <div className={s.uploadIcon}>📋</div>
          <div className={s.uploadTitle} style={data.rutFile ? { color: "#2ECC71" } : undefined}>
            {data.rutFile ? t("rutUploaded") : t("rutUploadTitle")}
          </div>
          <div className={s.uploadDesc}>
            {data.rutFile ? `${data.rutFile.name} · ${(data.rutFile.size / 1024 / 1024).toFixed(1)}MB` : t("rutUploadDesc")}
          </div>
        </div>
        <input
          ref={rutRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          className={s.hiddenInput}
          onChange={handleRutChange}
        />
        {errors.rut && <div className={s.fieldError}>{errors.rut}</div>}
      </div>

      {/* IVA */}
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

      <div className={s.formNav}>
        <button className={s.btnSecondary} onClick={onBack}>{tc("backBtn")}</button>
        <button className={s.btnPrimary} onClick={handleNext}>{tc("continueBtn")}</button>
      </div>
    </div>
  );
}
