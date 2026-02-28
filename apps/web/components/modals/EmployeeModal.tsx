"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "@/styles/access.module.css";

interface EmployeeModalProps {
  open: boolean;
  onClose: () => void;
}

export function EmployeeModal({ open, onClose }: EmployeeModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  const modal = (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,.85)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "var(--panel)",
          border: "1px solid var(--edge)",
          borderRadius: "16px",
          padding: "32px",
          width: "380px",
          maxWidth: "90vw",
        }}
      >
        <button
          onClick={onClose}
          style={{
            float: "right",
            background: "none",
            border: "none",
            color: "var(--muted)",
            fontSize: "20px",
            cursor: "pointer",
          }}
        >
          ✕
        </button>

        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>⚙️</div>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--txt)",
            }}
          >
            Acceso interno
          </div>
          <div style={{ fontSize: "12px", color: "var(--muted)" }}>
            Solo equipo VIBRRA
          </div>
        </div>

        <div
          style={{
            background: "rgba(212,160,23,.04)",
            border: "1px solid var(--line)",
            borderRadius: "8px",
            padding: "10px 14px",
            marginBottom: "20px",
            fontSize: "11px",
            color: "var(--muted)",
            textAlign: "center",
          }}
        >
          ⚠️ Requiere autenticación de doble factor
        </div>

        <div className={styles.loginField} style={{ marginBottom: "10px" }}>
          <span className={styles.loginFieldIcon}>✉️</span>
          <input
            type="email"
            className={styles.loginInput}
            placeholder="tu@vibrra.live"
          />
        </div>
        <div className={styles.loginField} style={{ marginBottom: "10px" }}>
          <span className={styles.loginFieldIcon}>🔒</span>
          <input
            type="password"
            className={styles.loginInput}
            placeholder="Contraseña"
          />
        </div>
        <div className={styles.loginField} style={{ marginBottom: "16px" }}>
          <span className={styles.loginFieldIcon}>🔑</span>
          <input
            type="text"
            className={styles.loginInput}
            placeholder="Código 2FA — Google Authenticator"
          />
        </div>

        <button className={`${styles.loginBtn} ${styles.purpleBtn}`}>
          Acceder al panel
        </button>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}
