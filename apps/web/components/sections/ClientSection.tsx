import { useTranslations } from "next-intl";
import { RevealSection } from "@/components/ui/RevealSection";
import styles from "@/styles/mockups.module.css";

const BENEFITS = [
  { icon: "🔌", key: "benefit1" },
  { icon: "🎵", key: "benefit2" },
  { icon: "⚡", key: "benefit3" },
  { icon: "🔔", key: "benefit4" },
  { icon: "❤️", key: "benefit5" },
  { icon: "🏅", key: "benefit6" },
] as const;

const QUEUE_SONGS = [
  { rank: "🥇", name: "Maluma — Hawái", puja: "$18K", tier: "Top" },
  { rank: "🥈", name: "J Balvin — Con Calma", puja: "$12K", tier: "Mid" },
  { rank: "🥉", name: "Karol G — Bichota", puja: "$7K", tier: "Low" },
] as const;

const SEARCH_RESULTS = [
  { name: "Tusa — Karol G", duration: "3:28", thumb: "A" },
  { name: "Dakiti — Bad Bunny", duration: "3:04", thumb: "B" },
  { name: "Pepas — Farruko", duration: "4:12", thumb: "C" },
] as const;

export function ClientSection() {
  const t = useTranslations("client");

  return (
    <section id="cliente" className={styles.cliente}>
      {/* Content */}
      <RevealSection>
        <div>
          <div
            className={styles.anfitrionTag}
            style={{
              background: "rgba(255,229,102,.1)",
              borderColor: "rgba(255,229,102,.3)",
              color: "var(--gold)",
            }}
          >
            {t("tag")}
          </div>
          <h2 className="section-title mb-3">
            {t.rich("title", {
              br: () => <br />,
              em: (chunks) => <em>{chunks}</em>,
            })}
          </h2>
          <p className="section-sub mb-0">{t("sub")}</p>

          <div className={styles.clienteBenefits}>
            {BENEFITS.map((b) => (
              <div key={b.key} className={styles.benefitChip}>
                <div className={styles.benefitChipIcon}>{b.icon}</div>
                <div>
                  <div className={styles.benefitChipTitle}>
                    {t(`${b.key}Title`)}
                  </div>
                  <div className={styles.benefitChipSub}>
                    {t(`${b.key}Sub`)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7 flex gap-3 flex-wrap">
            <a href="#" className="btn-primary">
              📱 {t("btnDownload")}
            </a>
            <div className="text-[12px] text-muted flex items-center">
              {t("availability")}
            </div>
          </div>
        </div>
      </RevealSection>

      {/* Phone mockups */}
      <div className={styles.phoneWrap}>
        <RevealSection delay={2}>
          <div className={styles.phone}>
            <div className={styles.phoneNotch} />
            <div className={styles.phoneScreen}>
              <div className={styles.phoneHeader}>
                <div className={styles.phoneBarName}>Bar El Rincón 🍻</div>
                <div className={styles.phoneLive}>
                  <div className={styles.phoneLiveDot} />
                  LIVE
                </div>
              </div>

              <div className={styles.phoneNowPlaying}>
                <div className={styles.phoneNpLabel}>♪ Sonando ahora</div>
                <div className={styles.phoneNpTitle}>
                  Bad Bunny — Tití Me...
                </div>
                <div className={styles.phoneNpProgress}>
                  <div className={styles.phoneNpFill} />
                </div>
              </div>

              <div className={styles.phoneQueueTitle}>Cola · 5 canciones</div>

              {QUEUE_SONGS.map((song, i) => (
                <div
                  key={i}
                  className={`${styles.phoneSong} ${
                    styles[`phoneSong${song.tier}`]
                  }`}
                >
                  <span className={styles.phoneSongName}>
                    {song.rank} {song.name}
                  </span>
                  <span className={styles.phoneSongPuja}>{song.puja}</span>
                </div>
              ))}

              <button className={styles.phonePujaBtn}>
                ⬆️ Pujar mi canción
              </button>
            </div>
          </div>
        </RevealSection>

        <RevealSection delay={3}>
          <div className={styles.phoneSearch}>
            <div className={styles.phoneNotch} style={{ height: 16, width: 60 }} />
            <div className={styles.phoneSearchInner}>
              <div className={styles.phoneSearchBar}>🔍 Buscar canción...</div>
              {SEARCH_RESULTS.map((result, i) => (
                <div key={i} className={styles.searchResult}>
                  <div
                    className={`${styles.searchThumb} ${
                      styles[`searchThumb${result.thumb}`]
                    }`}
                  />
                  <div>
                    <div className={styles.searchName}>{result.name}</div>
                    <div className={styles.searchArtist}>{result.duration}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}
