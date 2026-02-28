import { useTranslations } from "next-intl";
import { VibrraLogo } from "@/components/ui/VibrraLogo";
import styles from "@/styles/mockups.module.css";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className={styles.footer}>
      <div className={styles.footerGrid}>
        {/* Brand */}
        <div>
          <VibrraLogo width={200} />
          <p className={styles.footerTagline}>{t("tagline")}</p>
          <div className={styles.footerSocial}>
            <a href="#" className={styles.socialBtn} aria-label="Instagram">
              📸
            </a>
            <a href="#" className={styles.socialBtn} aria-label="TikTok">
              📱
            </a>
            <a href="#" className={styles.socialBtn} aria-label="Twitter">
              🐦
            </a>
          </div>
        </div>

        {/* Producto */}
        <div>
          <div className={styles.footerColTitle}>{t("colProduct")}</div>
          <a href="#como-funciona" className={styles.footerLink}>
            {t("linkHow")}
          </a>
          <a href="#anfitrion" className={styles.footerLink}>
            {t("linkHosts")}
          </a>
          <a href="#cliente" className={styles.footerLink}>
            {t("linkClients")}
          </a>
          <a href="#mapa" className={styles.footerLink}>
            {t("linkMap")}
          </a>
          <a href="#" className={styles.footerLink}>
            {t("linkApp")}
          </a>
        </div>

        {/* Legal */}
        <div>
          <div className={styles.footerColTitle}>{t("colLegal")}</div>
          <a href="#" className={styles.footerLink}>
            {t("linkTerms")}
          </a>
          <a href="#" className={styles.footerLink}>
            {t("linkPrivacy")}
          </a>
          <a href="#" className={styles.footerLink}>
            {t("linkContract")}
          </a>
          <a href="#" className={styles.footerLink}>
            {t("linkWithdrawals")}
          </a>
        </div>

        {/* Soporte */}
        <div>
          <div className={styles.footerColTitle}>{t("colSupport")}</div>
          <a href="#" className={styles.footerLink}>
            {t("linkEmail")}
          </a>
          <a href="#" className={styles.footerLink}>
            {t("linkWhatsapp")}
          </a>
          <a href="#" className={styles.footerLink}>
            {t("linkHelp")}
          </a>
          <a href="#" className={styles.footerLink}>
            {t("linkStatus")}
          </a>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <span>{t("copy")}</span>
        <span>vibrra.live</span>
      </div>
    </footer>
  );
}
