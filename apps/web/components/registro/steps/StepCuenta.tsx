"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useEnterNavigation } from "@/lib/use-enter-navigation";
import type { RegistrationFormData } from "@/lib/registration/types";
import s from "@/styles/registro.module.css";

interface Props {
  data: RegistrationFormData;
  update: (fields: Partial<RegistrationFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepCuenta({ data, update, onNext, onBack }: Props) {
  const t = useTranslations("registro.step1");
  const tc = useTranslations("registro.common");
  const tv = useTranslations("registro.validation");

  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [pass2, setPass2] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errs.email = tv("emailInvalid");
    }
    if (!data.password || data.password.length < 8) {
      errs.password = tv("passwordMin");
    }
    if (data.password !== pass2) {
      errs.pass2 = tv("passwordMismatch");
    }
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

      <div className={s.formSection}>
        <div className={`${s.formGrid} ${s.formGridFull}`}>
          {/* Email */}
          <div className={s.formGroup}>
            <div className={s.formLabel}>
              {t("emailLabel")}
              <span className={s.formRequired}>{tc("required")}</span>
            </div>
            <input
              type="email"
              className={`${s.input} ${errors.email ? s.inputError : data.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ? s.inputValid : ""}`}
              placeholder={t("emailPlaceholder")}
              value={data.email}
              onChange={(e) => update({ email: e.target.value })}
            />
            {errors.email && <div className={s.fieldError}>{errors.email}</div>}
            <div className={s.formHint}>{t("emailHint")}</div>
          </div>

          {/* Password */}
          <div className={s.formGroup}>
            <div className={s.formLabel}>
              {t("passwordLabel")}
              <span className={s.formRequired}>{tc("required")}</span>
            </div>
            <div className={s.inputIcon}>
              <input
                type={showPass ? "text" : "password"}
                className={`${s.input} ${errors.password ? s.inputError : data.password.length >= 8 ? s.inputValid : ""}`}
                placeholder={t("passwordPlaceholder")}
                value={data.password}
                onChange={(e) => update({ password: e.target.value })}
              />
              <button
                type="button"
                className={s.inputIconBtn}
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? "\u{1F648}" : "\u{1F441}"}
              </button>
            </div>
            {errors.password && <div className={s.fieldError}>{errors.password}</div>}
          </div>

          {/* Confirm */}
          <div className={s.formGroup}>
            <div className={s.formLabel}>
              {t("confirmLabel")}
              <span className={s.formRequired}>{tc("required")}</span>
            </div>
            <div className={s.inputIcon}>
              <input
                type={showPass2 ? "text" : "password"}
                className={`${s.input} ${errors.pass2 ? s.inputError : ""}`}
                placeholder={t("confirmPlaceholder")}
                value={pass2}
                onChange={(e) => setPass2(e.target.value)}
              />
              <button
                type="button"
                className={s.inputIconBtn}
                onClick={() => setShowPass2(!showPass2)}
              >
                {showPass2 ? "\u{1F648}" : "\u{1F441}"}
              </button>
            </div>
            {errors.pass2 && <div className={s.fieldError}>{errors.pass2}</div>}
          </div>
        </div>
      </div>

      <div className={s.infoBox}>
        {t("securityNote")}
      </div>

      <div className={s.formNav}>
        <button className={s.btnSecondary} onClick={onBack}>{tc("backBtn")}</button>
        <button className={s.btnPrimary} onClick={handleNext}>
          {tc("continueBtn")}
        </button>
      </div>
    </div>
  );
}
