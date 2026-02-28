import { useTranslations } from "next-intl";
import { RevealSection } from "@/components/ui/RevealSection";
import styles from "@/styles/mockups.module.css";

const CHART_HEIGHTS = ["20%", "35%", "30%", "55%", "45%", "70%", "90%", "80%"];

const SONGS = [
  { medal: "🥇", title: "Bad Bunny — Tití Me Preguntó", puja: "$18.000" },
  { medal: "🥈", title: "Maluma — Hawái", puja: "$12.500" },
  { medal: "🥉", title: "J Balvin — Con Calma", puja: "$8.000" },
];

export function Host() {
  const t = useTranslations("host");

  return (
    <section id="anfitrion" className={styles.anfitrion}>
      {/* Dashboard mockup */}
      <div className={styles.anfitrionVisual}>
        <div className={styles.dashboardMock}>
          <div className={styles.dashBar}>
            <div className={styles.dashDot} style={{ background: "#5A5A5A" }} />
            <div className={styles.dashDot} style={{ background: "#3A3A3A" }} />
            <div className={styles.dashDot} style={{ background: "var(--gold-mid)" }} />
            <span className="text-[11px] text-muted ml-2">
              Dashboard Anfitrión
            </span>
          </div>
          <div className={styles.dashBody}>
            <div className={styles.dashKpiRow}>
              <div className={styles.dashKpi}>
                <span className={styles.dashKpiVal}>$86K</span>
                <span className={styles.dashKpiLabel}>Esta noche</span>
              </div>
              <div className={styles.dashKpi}>
                <span className={styles.dashKpiVal}>47</span>
                <span className={styles.dashKpiLabel}>Pujas</span>
              </div>
              <div className={styles.dashKpi}>
                <span className={styles.dashKpiVal} style={{ color: "var(--gold-mid)" }}>
                  LIVE
                </span>
                <span className={styles.dashKpiLabel}>Sesión activa</span>
              </div>
            </div>

            <div className={styles.dashChart}>
              <div className={styles.dashChartTitle}>
                Ingresos — últimas 8 horas
              </div>
              <div className={styles.dashBars}>
                {CHART_HEIGHTS.map((h, i) => (
                  <div
                    key={i}
                    className={`${styles.dashBarItem} ${
                      i === 6 ? styles.dashBarItemActive : ""
                    }`}
                    style={{ height: h }}
                  />
                ))}
              </div>
            </div>

            {SONGS.map((song, i) => (
              <div key={i} className={styles.dashSongRow}>
                <span className={styles.dashSongTitle}>
                  {song.medal} {song.title}
                </span>
                <span className={styles.dashSongPuja}>{song.puja}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <RevealSection>
        <div>
          <div className={styles.anfitrionTag}>{t("tag")}</div>
          <h2 className="section-title mb-3">
            {t.rich("title", {
              br: () => <br />,
              em: (chunks) => <em>{chunks}</em>,
            })}
          </h2>
          <p className="section-sub mb-0">{t("sub")}</p>

          <div className={styles.incomeList}>
            {[
              { dotColor: "var(--gold-mid)", key: "income1" },
              { dotColor: "var(--gold)", key: "income2" },
              { dotColor: "var(--gold-shine)", key: "income3" },
            ].map((item) => (
              <div key={item.key} className={styles.incomeItem}>
                <div
                  className={styles.incomeDot}
                  style={{ background: item.dotColor }}
                />
                <div>
                  <div className={styles.incomeName}>
                    {t(`${item.key}Name`)}
                  </div>
                  <div className={styles.incomeDesc}>
                    {t(`${item.key}Desc`)}
                  </div>
                </div>
                <div className={styles.incomePct}>70%</div>
              </div>
            ))}
          </div>

          <p className={styles.sectionDisclaimer}>{t("disclaimer")}</p>
        </div>
      </RevealSection>
    </section>
  );
}
