import { useTranslations } from "next-intl";
import { RevealSection } from "@/components/ui/RevealSection";
import { AccessClient } from "./AccessClient";

export function Access() {
  const t = useTranslations("access");

  return (
    <section
      id="acceso"
      className="landing-section"
    >
      <RevealSection>
        <div className="section-eyebrow">{t("eyebrow")}</div>
      </RevealSection>
      <RevealSection delay={1}>
        <h2 className="section-title">
          {t("titlePre")}
          <em>{t("titleEm")}</em>
        </h2>
      </RevealSection>
      <RevealSection delay={2}>
        <p className="section-sub mb-12">{t("sub")}</p>
      </RevealSection>

      <RevealSection delay={2}>
        <AccessClient />
      </RevealSection>
    </section>
  );
}
