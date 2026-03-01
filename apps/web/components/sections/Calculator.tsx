import { useTranslations } from "next-intl";
import { RevealSection } from "@/components/ui/RevealSection";
import { CalculatorClient } from "./CalculatorClient";

export function Calculator() {
  const t = useTranslations("calculator");

  return (
    <section
      id="calculadora"
      className="landing-section" style={{ background: "var(--deep)" }}
    >
      <RevealSection>
        <div className="section-eyebrow">{t("eyebrow")}</div>
      </RevealSection>
      <RevealSection delay={1}>
        <h2 className="section-title">
          {t.rich("title", {
            em: (chunks) => <em>{chunks}</em>,
          })}
        </h2>
      </RevealSection>
      <RevealSection delay={2}>
        <p className="section-sub mb-12">{t("sub")}</p>
      </RevealSection>

      <RevealSection delay={3}>
        <CalculatorClient />
      </RevealSection>
    </section>
  );
}
