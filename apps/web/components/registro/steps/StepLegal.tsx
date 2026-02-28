"use client";

import { useTranslations } from "next-intl";
import type { FormData } from "../RegistroWizard";
import s from "@/styles/registro.module.css";

interface Props {
  data: FormData;
  update: (fields: Partial<FormData>) => void;
  onComplete: () => void;
  onBack: () => void;
  submitting: boolean;
  error: string;
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

export function StepLegal({ data, update, onComplete, onBack, submitting, error }: Props) {
  const t = useTranslations("registro.step5");
  const tc = useTranslations("registro.common");
  const tv = useTranslations("registro.validation");

  const allRequired = data.aceptaTerminos && data.aceptaDatos && data.aceptaPagos && data.aceptaPublicidad;

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

      {/* Mandatory */}
      <div className={s.formSection}>
        <div className={s.formSectionTitle}>{t("sectionObligatorio")}</div>

        <button
          type="button"
          className={s.btnSecondary}
          style={{ width: "100%", marginBottom: 16 }}
          onClick={() =>
            update({
              aceptaTerminos: true,
              aceptaDatos: true,
              aceptaPagos: true,
              aceptaPublicidad: true,
            })
          }
        >
          {t("acceptAllBtn")}
        </button>

        <Toggle
          on={data.aceptaTerminos}
          onToggle={() => update({ aceptaTerminos: !data.aceptaTerminos })}
          title={t("terminosTitle")}
          desc={t("terminosDesc")}
          link="/vibrra-terminos.html"
        />

        <Toggle
          on={data.aceptaDatos}
          onToggle={() => update({ aceptaDatos: !data.aceptaDatos })}
          title={t("datosTitle")}
          desc={t("datosDesc")}
          link="/vibrra-politica-datos.html"
        />

        <Toggle
          on={data.aceptaPagos}
          onToggle={() => update({ aceptaPagos: !data.aceptaPagos })}
          title={t("pagosTitle")}
          desc={t("pagosDesc")}
        />

        <Toggle
          on={data.aceptaPublicidad}
          onToggle={() => update({ aceptaPublicidad: !data.aceptaPublicidad })}
          title={t("publicidadTitle")}
          desc={t("publicidadDesc")}
        />
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
