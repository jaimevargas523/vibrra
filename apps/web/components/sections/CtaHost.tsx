import { useTranslations } from "next-intl";
import { RevealSection } from "@/components/ui/RevealSection";
import styles from "@/styles/mockups.module.css";

export function CtaHost() {
  const t = useTranslations("cta");

  return (
    <section id="anfitrion-cta" className={styles.ctaAnfitrion}>
      {/* Content */}
      <RevealSection>
        <div>
          <div className="section-eyebrow">{t("eyebrow")}</div>
          <h2 className="section-title mb-3">
            {t.rich("title", {
              br: () => <br />,
              em: (chunks) => <em>{chunks}</em>,
            })}
          </h2>
          <p className="text-[16px] text-soft leading-[1.7] mb-7">
            {t("sub")}
          </p>

          <div className={styles.ctaSteps}>
            {[1, 2, 3].map((n) => (
              <div key={n} className={styles.ctaStep}>
                <div className={styles.ctaStepNum}>{n}</div>
                <div>
                  <div className={styles.ctaStepTitle}>
                    {t(`step${n}Title`)}
                  </div>
                  <div className={styles.ctaStepDesc}>
                    {t(`step${n}Desc`)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <a
            href="/registro"
            className="btn-primary w-fit text-[16px] px-8 py-4"
          >
            {t("ctaBtn")}
          </a>
        </div>
      </RevealSection>

      {/* KPI grid */}
      <RevealSection delay={2}>
        <div className={styles.ctaKpis}>
          {(
            [
              { val: "$0", label: t("kpi1Label") },
              { val: "$0", label: t("kpi2Label") },
              { val: "70%", label: t("kpi3Label") },
              { val: "$15K", label: t("kpi4Label") },
            ] as const
          ).map((kpi, i) => (
            <div key={i} className={styles.ctaKpi}>
              <span
                className={styles.ctaKpiVal}
                style={i === 3 ? { fontSize: "22px" } : undefined}
              >
                {kpi.val}
              </span>
              <span className={styles.ctaKpiLabel}>{kpi.label}</span>
            </div>
          ))}

          <div className={styles.ctaKpiFooter}>
            <div className={styles.ctaKpiFooterText}>
              {t.rich("legal", {
                br: () => <br />,
                muted: (chunks) => (
                  <span className="text-muted">{chunks}</span>
                ),
              })}
            </div>
          </div>
        </div>
      </RevealSection>
    </section>
  );
}
