import { useTranslations } from "next-intl";
import { RevealSection } from "@/components/ui/RevealSection";

const STEPS = [
  { icon: "📷", tagColor: "var(--gold-mid)", tagBorder: "rgba(0,217,163,.3)" },
  { icon: "🔍", tagColor: "var(--gold)", tagBorder: "rgba(255,229,102,.3)" },
  { icon: "🏆", tagColor: "var(--gold-dk)", tagBorder: "rgba(212,160,23,.3)" },
] as const;

export function Steps() {
  const t = useTranslations("steps");

  return (
    <section
      id="como-funciona"
      className="px-[60px] py-[100px] border-t border-line max-[1100px]:px-8"
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

      <div
        className="grid gap-[3px] rounded-2xl overflow-hidden max-[720px]:grid-cols-1"
        style={{
          gridTemplateColumns: "repeat(3, 1fr)",
          background: "var(--line)",
        }}
      >
        {STEPS.map((step, i) => (
          <RevealSection key={i} delay={(i + 1) as 1 | 2 | 3}>
            <div className="bg-panel p-8 relative group hover:bg-[#101020] transition-colors min-h-[280px]">
              <div
                className="absolute top-4 right-4 font-display text-[72px] font-black opacity-[0.06] leading-none select-none"
              >
                {i + 1}
              </div>
              <span className="text-3xl mb-4 block">{step.icon}</span>
              <div className="text-txt font-semibold text-[15px] mb-2">
                {t(`step${i + 1}.title`)}
              </div>
              <p className="text-muted text-[13px] leading-relaxed mb-4">
                {t(`step${i + 1}.desc`)}
              </p>
              <div
                className="inline-block text-[11px] font-semibold px-3 py-1 rounded-full border"
                style={{
                  color: step.tagColor,
                  borderColor: step.tagBorder,
                }}
              >
                {t(`step${i + 1}.tag`)}
              </div>
            </div>
          </RevealSection>
        ))}
      </div>
    </section>
  );
}
