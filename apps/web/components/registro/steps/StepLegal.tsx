"use client";

import { useTranslations } from "next-intl";
import type { RegistrationFormData, CountryConfig } from "@/lib/registration/types";
import s from "@/styles/registro.module.css";

interface Props {
  data: RegistrationFormData;
  update: (fields: Partial<RegistrationFormData>) => void;
  onComplete: () => void;
  onBack: () => void;
  submitting: boolean;
  error: string;
  countryConfig: CountryConfig;
}

function Toggle({
  on,
  onToggle,
  title,
  desc,
  link,
}: {
  on: boolean;
  onToggle: () => void;
  title: string;
  desc: string;
  link?: string;
}) {
  const t5 = useTranslations("registro.step5");
  return (
    <div
      className={`${s.toggleRow} ${on ? s.toggleRowAccepted : ""}`}
      onClick={onToggle}
    >
      <button
        type="button"
        className={`${s.toggleSwitch} ${on ? s.toggleSwitchOn : ""}`}
      />
      <div>
        <div className={s.toggleTitle}>
          {title}
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className={s.toggleLink}
              onClick={(e) => e.stopPropagation()}
            >
              {t5("terminosLink")}
            </a>
          )}
        </div>
        <div className={s.toggleDesc}>{desc}</div>
      </div>
    </div>
  );
}

export function StepLegal({ data, update, onComplete, onBack, submitting, error, countryConfig }: Props) {
  const t = useTranslations("registro.step5");
  const tc = useTranslations("registro.common");
  const tv = useTranslations("registro.validation");

  const requiredDocs = countryConfig.legalDocs.filter((d) => d.required);
  const allRequired = requiredDocs.every((d) => data.legalAcceptances[d.key]);

  function toggleAcceptance(key: string) {
    update({
      legalAcceptances: {
        ...data.legalAcceptances,
        [key]: !data.legalAcceptances[key],
      },
    });
  }

  function acceptAll() {
    const acc: Record<string, boolean> = { ...data.legalAcceptances };
    for (const doc of requiredDocs) {
      acc[doc.key] = true;
    }
    update({ legalAcceptances: acc });
  }

  function handleComplete() {
    if (!allRequired) return;
    onComplete();
  }

  return (
    <div className={s.stepPanel}>
      <div className={s.stepHeader}>
        <div className={s.stepEyebrow}>{t("eyebrow")}</div>
        <h2 className={s.stepTitle}>{t("title")}</h2>
        <p className={s.stepSubtitle}>{t("subtitle")}</p>
      </div>

      {/* Mandatory — driven by countryConfig.legalDocs */}
      <div className={s.formSection}>
        <div className={s.formSectionTitle}>{t("sectionObligatorio")}</div>

        <button
          type="button"
          className={s.btnSecondary}
          style={{ width: "100%", marginBottom: 16 }}
          onClick={acceptAll}
        >
          {t("acceptAllBtn")}
        </button>

        {requiredDocs.map((doc) => (
          <Toggle
            key={doc.key}
            on={!!data.legalAcceptances[doc.key]}
            onToggle={() => toggleAcceptance(doc.key)}
            title={t(`${doc.key}Title`)}
            desc={t(`${doc.key}Desc`)}
            link={doc.linkUrl}
          />
        ))}
      </div>

      {/* Optional */}
      <div className={s.formSection}>
        <div className={s.formSectionTitle}>{t("sectionOpcional")}</div>
        <Toggle
          on={data.recibeReportes}
          onToggle={() => update({ recibeReportes: !data.recibeReportes })}
          title={t("reportesTitle")}
          desc={t("reportesDesc")}
        />
      </div>

      <div className={s.infoBox}>{t("legalNote")}</div>

      {!allRequired && (
        <div className={s.fieldError} style={{ marginBottom: 12 }}>
          {tv("legalRequired")}
        </div>
      )}

      {error && (
        <div className={s.fieldError} style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div className={s.formNav}>
        <button className={s.btnSecondary} onClick={onBack} disabled={submitting}>
          {tc("backBtn")}
        </button>
        <button
          className={s.btnPrimary}
          onClick={handleComplete}
          disabled={!allRequired || submitting}
        >
          {submitting ? t("completingBtn") : t("completeBtn")}
        </button>
      </div>
    </div>
  );
}
