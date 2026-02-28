"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { COUNTRY_LIST, isCountrySupported } from "@/lib/registration/countries";
import type { RegistrationFormData } from "@/lib/registration/types";
import s from "@/styles/registro.module.css";

interface Props {
  data: RegistrationFormData;
  update: (fields: Partial<RegistrationFormData>) => void;
  onNext: () => void;
}

export function StepPais({ data, update, onNext }: Props) {
  const t = useTranslations("registro.step0");
  const tc = useTranslations("registro.common");
  const [detecting, setDetecting] = useState(!data.country);

  // Auto-detect country via IP geolocation
  useEffect(() => {
    if (data.country) return; // already selected

    const controller = new AbortController();

    fetch("https://ipapi.co/json/", { signal: controller.signal })
      .then((res) => res.json())
      .then((geo: { country_code?: string }) => {
        const code = geo.country_code?.toUpperCase();
        if (code && isCountrySupported(code)) {
          update({ country: code });
        }
      })
      .catch(() => {
        // silently ignore — user can select manually
      })
      .finally(() => setDetecting(false));

    return () => controller.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSelect(code: string) {
    update({ country: code });
  }

  function handleNext() {
    if (data.country) onNext();
  }

  return (
    <div className={s.stepPanel}>
      <div className={s.stepHeader}>
        <div className={s.stepEyebrow}>{t("eyebrow")}</div>
        <h2 className={s.stepTitle}>{t("title")}</h2>
        <p className={s.stepSubtitle}>{t("subtitle")}</p>
      </div>

      <div className={s.formSection}>
        <div className={s.bankGrid}>
          {COUNTRY_LIST.map((country) => {
            const selected = data.country === country.code;
            return (
              <div
                key={country.code}
                className={`${s.bankItem} ${selected ? s.bankItemSelected : ""}`}
                onClick={() => handleSelect(country.code)}
              >
                <div className={s.bankIcon}>{country.flag}</div>
                <div className={`${s.bankName} ${selected ? s.bankNameSelected : ""}`}>
                  {t(country.nameI18nKey)}
                </div>
                {detecting && (
                  <div className={s.formHint} style={{ fontSize: 9, marginTop: 2 }}>
                    {t("detecting")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className={s.infoBox}>{t("countryNote")}</div>

      <div className={s.formNav}>
        <button
          className={s.btnPrimary}
          onClick={handleNext}
          disabled={!data.country}
        >
          {tc("continueBtn")}
        </button>
      </div>
    </div>
  );
}
