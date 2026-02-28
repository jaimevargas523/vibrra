import { useTranslations } from "next-intl";
import { RevealSection } from "@/components/ui/RevealSection";

const MECHANICS = [
  { icon: "🔌", colorClass: "border-t-[#2ECC71]", nameColor: "text-live" },
  { icon: "⬆️", colorClass: "border-t-gold", nameColor: "text-gold" },
  { icon: "🎵", colorClass: "border-t-soft", nameColor: "text-soft" },
  { icon: "💌", colorClass: "border-t-gold-shine", nameColor: "text-gold-shine" },
  { icon: "🚫", colorClass: "border-t-gold-dk", nameColor: "text-gold-dk" },
  { icon: "⚔️", colorClass: "border-t-[#B8900E]", nameColor: "text-[#B8900E]" },
] as const;

const KEYS = [
  "conexion",
  "puja",
  "cancion",
  "dedicatoria",
  "veto",
  "batalla",
] as const;

export function Mechanics() {
  const t = useTranslations("mechanics");

  return (
    <section
      id="mecanicas"
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

      <div className="grid grid-cols-3 gap-4 max-[720px]:grid-cols-1">
        {MECHANICS.map((mech, i) => (
          <RevealSection
            key={KEYS[i]}
            delay={((i % 3) + 1) as 1 | 2 | 3}
          >
            <div
              className={`bg-panel rounded-xl p-6 border-t-[3px] ${mech.colorClass} hover:-translate-y-1 transition-transform cursor-default`}
            >
              <span className="text-2xl mb-3 block">{mech.icon}</span>
              <div className={`font-bold text-[15px] mb-2 ${mech.nameColor}`}>
                {t(`${KEYS[i]}.name`)}
              </div>
              <p className="text-muted text-[13px] leading-relaxed mb-4">
                {t(`${KEYS[i]}.desc`)}
              </p>
              <div className="text-[10px] text-muted tracking-wider uppercase">
                {t(`${KEYS[i]}.price`)}
              </div>
            </div>
          </RevealSection>
        ))}
      </div>
    </section>
  );
}
