"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@vibrra/shared";
import styles from "@/styles/access.module.css";

const DASHBOARD_URL =
  process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:5173";

type ClientTab = "email" | "phone";

export function AccessClient() {
  const [clientTab, setClientTab] = useState<ClientTab>("email");
  const t = useTranslations("access");

  /* Anfitrión form state */
  const [hostEmail, setHostEmail] = useState("");
  const [hostPassword, setHostPassword] = useState("");
  const [hostError, setHostError] = useState("");
  const [hostLoading, setHostLoading] = useState(false);

  async function handleHostLogin() {
    if (!hostEmail || !hostPassword || hostLoading) return;
    setHostError("");
    setHostLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, hostEmail, hostPassword);
      const idToken = await cred.user.getIdToken();
      window.open(`${DASHBOARD_URL}/login#token=${encodeURIComponent(idToken)}`, "_blank");
      setHostLoading(false);
      setHostEmail("");
      setHostPassword("");
    } catch {
      setHostError(t("loginError"));
      setHostLoading(false);
    }
  }

  return (
    <div className={styles.accessGrid}>
      {/* Cliente card */}
      <div className={`${styles.loginCard} ${styles.clienteCard}`}>
        <div className={`${styles.loginCardHeader} ${styles.clienteH}`}>
          <span className={styles.loginIcon}>📱</span>
          <div>
            <div className={styles.loginRole} style={{ color: "var(--gold)" }}>
              {t("roleClient")}
            </div>
            <div className={styles.loginSubtitle}>{t("roleClientSub")}</div>
          </div>
        </div>
        <div className={styles.loginBody}>
          <div className={styles.loginTabRow}>
            <button
              className={`${styles.loginTab} ${
                clientTab === "email" ? styles.loginTabActive : ""
              }`}
              onClick={() => setClientTab("email")}
            >
              {t("tabEmail")}
            </button>
            <button
              className={`${styles.loginTab} ${
                clientTab === "phone" ? styles.loginTabActive : ""
              }`}
              onClick={() => setClientTab("phone")}
            >
              {t("tabPhone")}
            </button>
          </div>

          <div
            className={
              clientTab === "email"
                ? styles.loginFormBlockActive
                : styles.loginFormBlock
            }
          >
            <div className={styles.loginField}>
              <span className={styles.loginFieldIcon}>✉️</span>
              <input
                type="email"
                className={styles.loginInput}
                placeholder={t("phEmail")}
              />
            </div>
            <div className={styles.loginField}>
              <span className={styles.loginFieldIcon}>🔒</span>
              <input
                type="password"
                className={styles.loginInput}
                placeholder={t("phPassword")}
              />
            </div>
            <button className={`${styles.loginBtn} ${styles.goldBtn}`}>
              {t("btnEnter")}
            </button>
          </div>

          <div
            className={
              clientTab === "phone"
                ? styles.loginFormBlockActive
                : styles.loginFormBlock
            }
          >
            <div className={styles.loginField}>
              <span className={styles.loginFieldIcon}>🇨🇴</span>
              <input
                type="tel"
                className={styles.loginInput}
                placeholder={t("phPhone")}
              />
            </div>
            <button className={`${styles.loginBtn} ${styles.goldBtn}`}>
              {t("btnSms")}
            </button>
          </div>

          <div className={styles.loginFooterLink}>
            {t("noAccount")}&nbsp;
            <a href="#" style={{ color: "var(--gold)" }}>
              {t("registerFree")}
            </a>
          </div>
        </div>
      </div>

      {/* Anfitrión card */}
      <div className={`${styles.loginCard} ${styles.anfitrionCard}`}>
        <div className={`${styles.loginCardHeader} ${styles.anfitrionH}`}>
          <span className={styles.loginIcon}>🏢</span>
          <div>
            <div
              className={styles.loginRole}
              style={{ color: "#2ECC71" }}
            >
              {t("roleHost")}
            </div>
            <div className={styles.loginSubtitle}>{t("roleHostSub")}</div>
          </div>
        </div>
        <div className={styles.loginBody}>
          <div className={styles.loginField}>
            <span className={styles.loginFieldIcon}>✉️</span>
            <input
              type="email"
              className={styles.loginInput}
              placeholder={t("phEmailBar")}
              value={hostEmail}
              onChange={(e) => setHostEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleHostLogin()}
            />
          </div>
          <div className={styles.loginField}>
            <span className={styles.loginFieldIcon}>🔒</span>
            <input
              type="password"
              className={styles.loginInput}
              placeholder={t("phPassword")}
              value={hostPassword}
              onChange={(e) => setHostPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleHostLogin()}
            />
          </div>
          {hostError && (
            <div className={styles.errorMsg}>{hostError}</div>
          )}
          <button
            className={`${styles.loginBtn} ${styles.greenBtn}`}
            onClick={handleHostLogin}
            disabled={hostLoading}
          >
            {hostLoading ? "..." : t("btnEnterPanel")}
          </button>
          <div className={styles.forgotLink}>
            <a href="#">{t("forgotPw")}</a>
          </div>
          <div className={styles.loginFooterLink}>
            {t("newVibrra")}&nbsp;
            <a href="/registro" style={{ color: "#2ECC71" }}>
              {t("registerBar")}
            </a>
          </div>
          <div className={styles.hintBox}>
            🔌{" "}
            {t.rich("chromeHint", {
              strong: (chunks) => (
                <strong style={{ color: "#2ECC71" }}>{chunks}</strong>
              ),
            })}
          </div>
        </div>
      </div>

      {/* Empresa card */}
      <div className={`${styles.loginCard} ${styles.empresaCard}`}>
        <div className={`${styles.loginCardHeader} ${styles.empresaH}`}>
          <span className={styles.loginIcon}>🏛️</span>
          <div>
            <div className={styles.loginRole} style={{ color: "#8B5CF6" }}>
              {t("roleCompany")}
            </div>
            <div className={styles.loginSubtitle}>{t("roleCompanySub")}</div>
          </div>
        </div>
        <div className={styles.loginBody}>
          <div className={styles.hintBox} style={{ marginBottom: "16px", marginTop: 0 }}>
            {t("companyHint")}
          </div>
          <div className={styles.loginField}>
            <span className={styles.loginFieldIcon}>🏛️</span>
            <input
              type="text"
              className={styles.loginInput}
              placeholder={t("phNit")}
            />
          </div>
          <div className={styles.loginField}>
            <span className={styles.loginFieldIcon}>✉️</span>
            <input
              type="email"
              className={styles.loginInput}
              placeholder={t("phEmailCompany")}
            />
          </div>
          <div className={styles.loginField}>
            <span className={styles.loginFieldIcon}>🔒</span>
            <input
              type="password"
              className={styles.loginInput}
              placeholder={t("phPassword")}
            />
          </div>
          <button className={`${styles.loginBtn} ${styles.purpleBtn}`}>
            {t("btnEnterCorp")}
          </button>
          <div className={styles.forgotLink}>
            <a href="#">{t("forgotPw")}</a>
          </div>
          <div className={styles.loginFooterLink}>
            {t("wantJoin")}&nbsp;
            <a href="/registro" style={{ color: "#8B5CF6" }}>
              {t("registerCompany")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
