import { useTranslations } from "next-intl";
import { VibrraLogo } from "@/components/ui/VibrraLogo";
import { HeroTeaserClient } from "./HeroTeaserClient";
import styles from "@/styles/hero.module.css";

function generateBars(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    h: 20 + ((i * 73 + 17) % 80),
    d: 0.8 + ((i * 37 + 11) % 18) / 10,
    delay: -((i * 53) % 8) / 10,
  }));
}

const WAVEFORM_BARS = generateBars(80);

export function Hero() {
  const t = useTranslations("hero");

  return (
    <section className={styles.hero}>
      <div className={styles.heroGlow} />

      {/* Vinyl record */}
      <div className={styles.vinyl} aria-hidden="true">
        <div className={styles.vinylOuter}>
          <div className={styles.vinylLabel}>
            <div className={styles.vinylHole} />
          </div>
        </div>
      </div>

      {/* Waveform */}
      <div className={styles.waveform} aria-hidden="true">
        {WAVEFORM_BARS.map((bar, i) => (
          <div
            key={i}
            className={styles.waveformBar}
            style={
              {
                "--h": `${bar.h}px`,
                "--d": `${bar.d}s`,
                "--delay": `${bar.delay}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className={styles.heroContent}>
        {/* Left column */}
        <div className={styles.heroLeft}>
          <div
            className={styles.heroBadge}
            style={{ animationDelay: ".1s" }}
          >
            <div className={styles.heroBadgeDot} />
            <span>{t("badge")}</span>
          </div>

          <h1 className={styles.heroTitle} style={{ animationDelay: ".2s" }}>
            {t("h1a")}
            <em>{t("h1b")}</em>
            <br />
            {t("h1c")}
          </h1>

          <p className={styles.heroSub} style={{ animationDelay: ".3s" }}>
            {t.rich("sub", {
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>

          <div className={styles.heroBtns} style={{ animationDelay: ".4s" }}>
            <a href="#" className="btn-primary">
              📱 {t("btn1")}
            </a>
            <a href="/registro" className="btn-secondary">
              🏢 {t("btn2")}
            </a>
          </div>

          <div className={styles.heroStats} style={{ animationDelay: ".5s" }}>
            <div>
              <span className={styles.heroStatVal}>70%</span>
              <div className={styles.heroStatLabel}>{t("statHost")}</div>
            </div>
            <div>
              <span className={styles.heroStatVal}>30%</span>
              <div className={styles.heroStatLabel}>{t("statVibrra")}</div>
            </div>
            <div>
              <span className={styles.heroStatVal}>6</span>
              <div className={styles.heroStatLabel}>{t("statMechanics")}</div>
            </div>
            <div>
              <span className={styles.heroStatVal}>~$0</span>
              <div className={styles.heroStatLabel}>{t("statHw")}</div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className={styles.heroRight}>
          <HeroTeaserClient
            eyebrow={t("calcEyebrow")}
            headline={t("calcHeadline")}
            sub={t("calcSub")}
          />
          <VibrraLogo width={440} className="w-full" />
        </div>
      </div>
    </section>
  );
}
