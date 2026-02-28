"use client";

import { useTranslations } from "next-intl";
import { VibrraLogo } from "@/components/ui/VibrraLogo";
import s from "@/styles/registro.module.css";

const STEPS = [
  { labelKey: "step1Label", nameKey: "step1Name", descKey: "step1Desc" },
  { labelKey: "step2Label", nameKey: "step2Name", descKey: "step2Desc" },
  { labelKey: "step3Label", nameKey: "step3Name", descKey: "step3Desc" },
  { labelKey: "step4Label", nameKey: "step4Name", descKey: "step4Desc" },
  { labelKey: "step5Label", nameKey: "step5Name", descKey: "step5Desc" },
] as const;

interface LeftPanelProps {
  current: number;
  completed: Set<number>;
}

export function LeftPanel({ current, completed }: LeftPanelProps) {
  const t = useTranslations("registro.nav");
  const tb = useTranslations("registro.banner");

  return (
    <aside className={s.leftPanel}>
      <div className={s.leftLogo}>
        <VibrraLogo width={140} />
      </div>

      <div className={s.stepList}>
        {STEPS.map((step, i) => {
          const isDone = completed.has(i);
          const isActive = i === current;

          const dotClass = [
            s.stepDot,
            isDone ? s.stepDotDone : "",
            isActive && !isDone ? s.stepDotActive : "",
          ].join(" ");

          const nameClass = [
            s.stepName,
            isActive ? s.stepNameActive : "",
            isDone ? s.stepNameDone : "",
          ].join(" ");

          return (
            <div key={i} className={s.stepItem}>
              <div className={dotClass}>
                {isDone ? "✓" : i + 1}
              </div>
              <div className={s.stepInfo}>
                <div className={s.stepLabel}>{t(step.labelKey)}</div>
                <div className={nameClass}>{t(step.nameKey)}</div>
                <div className={s.stepDesc}>{t(step.descKey)}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Banner: plan + bono */}
      <div className={s.bannerWrap}>
        <div className={s.bannerPlan}>
          <div className={s.bannerEyebrow}>{tb("planTitle")}</div>
          <div className={s.bannerPrice}>
            <span className={s.bannerPriceValue}>{tb("planPrice")}</span>
            <span className={s.bannerPricePeriod}>{tb("planPeriod")}</span>
          </div>
          <div className={s.bannerPromo}>
            <span className={s.bannerPromoText}>{tb("planPromo")}</span>
          </div>
          <div className={s.bannerDescText}>{tb("planDesc")}</div>
        </div>

        <div className={s.bannerBono}>
          <div className={s.bannerEyebrow}>{tb("bonoTitle")}</div>
          <div className={s.bannerBonoAmount}>{tb("bonoAmount")}</div>
          <div className={s.bannerDescText}>{tb("bonoDesc")}</div>
        </div>
      </div>
    </aside>
  );
}
