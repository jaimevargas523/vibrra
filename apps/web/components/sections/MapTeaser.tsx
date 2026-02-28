import { useTranslations } from "next-intl";
import { RevealSection } from "@/components/ui/RevealSection";
import styles from "@/styles/map.module.css";

const PINS = [
  { left: "30%", top: "42%", live: true, green: false },
  { left: "55%", top: "58%", live: true, green: true },
  { left: "71%", top: "32%", live: false, green: false },
  { left: "22%", top: "68%", live: false, green: true },
  { left: "80%", top: "62%", live: true, green: false },
] as const;

export function MapTeaser() {
  const t = useTranslations("map");

  return (
    <section id="mapa" className={styles.mapTeaser}>
      <div className={styles.mapBg} />

      <RevealSection>
        <div className="section-eyebrow">{t("eyebrow")}</div>
      </RevealSection>
      <RevealSection delay={1}>
        <h2 className="section-title">
          {t.rich("title", {
            br: () => <br />,
            em: (chunks) => <em>{chunks}</em>,
          })}
        </h2>
      </RevealSection>
      <RevealSection delay={2}>
        <p className="section-sub mx-auto mb-0">{t("sub")}</p>
      </RevealSection>

      <RevealSection delay={3}>
        <div className={styles.mapMock}>
          <div className={styles.mapDots}>
            <div className={styles.mapGridLines} />
            {PINS.map((pin, i) => (
              <div
                key={i}
                className={`${styles.mapPin} ${
                  pin.live ? styles.mapPinLive : ""
                } ${pin.green ? styles.mapPinGreen : ""}`}
                style={{ left: pin.left, top: pin.top }}
              />
            ))}
          </div>
          <div className={styles.mapComing}>{t("coming")}</div>
        </div>
      </RevealSection>
    </section>
  );
}
