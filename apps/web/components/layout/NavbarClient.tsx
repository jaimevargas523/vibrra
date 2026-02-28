"use client";

import { type ReactNode, useState } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { EmployeeModal } from "@/components/modals/EmployeeModal";
import styles from "@/styles/nav.module.css";

const LOCALES = ["es", "en", "pt"] as const;

interface NavbarClientProps {
  logo: ReactNode;
  links: ReactNode;
  ctaLabel: string;
}

export function NavbarClient({ logo, links, ctaLabel }: NavbarClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  function switchLocale(locale: string) {
    router.replace(pathname, { locale });
  }

  return (
    <>
      <button
        className={styles.navLogo}
        onClick={() => setModalOpen(true)}
        aria-label="VIBRRA"
      >
        {logo}
        <div className={styles.navLogoDot} />
      </button>

      <div className={styles.navLinks}>
        {links}

        <div className={styles.langSwitcher}>
          {LOCALES.map((locale) => (
            <button
              key={locale}
              className={`${styles.langBtn} ${
                currentLocale === locale ? styles.langBtnActive : ""
              }`}
              onClick={() => switchLocale(locale)}
            >
              {locale.toUpperCase()}
            </button>
          ))}
        </div>

        <a className={styles.navCta} href="/registro">
          {ctaLabel}
        </a>
      </div>

      <EmployeeModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
