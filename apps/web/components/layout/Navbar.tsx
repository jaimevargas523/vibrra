import { useTranslations } from "next-intl";
import { VibrraLogo } from "@/components/ui/VibrraLogo";
import { NavbarClient } from "./NavbarClient";
import styles from "@/styles/nav.module.css";

export function Navbar() {
  const t = useTranslations("nav");

  return (
    <nav className={styles.nav}>
      <NavbarClient
        logo={<VibrraLogo width={160} />}
        links={
          <>
            <a className={styles.navLink} href="#como-funciona">
              {t("how")}
            </a>
            <a className={styles.navLink} href="#anfitrion">
              {t("hosts")}
            </a>
            <a className={styles.navLink} href="#cliente">
              {t("clients")}
            </a>
            <a className={styles.navLink} href="#mapa">
              {t("map")}
            </a>
          </>
        }
        ctaLabel={t("cta")}
      />
    </nav>
  );
}
