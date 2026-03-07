"use client";

import { useState, useCallback } from "react";
import { PhoneInput, PHONE_PREFIXES } from "./PhoneInput";
import { OtpInput } from "./OtpInput";
import { useClienteAuth } from "./useClienteAuth";

type Step = "method" | "phone-input" | "otp" | "success";

interface RegistroScreenProps {
  estId: string;
  visitorId: string | null;
  onRegistered: () => void;
  onSkip: () => void;
}

export function RegistroScreen({ estId, visitorId, onRegistered, onSkip }: RegistroScreenProps) {
  const [step, setStep] = useState<Step>("method");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const { sendPhoneCode, verifyOtp, signInWithGoogle, error, setError } = useClienteAuth();

  const registerOnServer = useCallback(async (user: { uid: string; displayName?: string | null; email?: string | null; phoneNumber?: string | null; photoURL?: string | null }) => {
    try {
      const { getIdToken } = await import("firebase/auth");
      const { auth } = await import("@/lib/firebase");
      const token = await getIdToken(auth.currentUser!);

      await fetch("/api/cliente/registrar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          visitorId,
          estId,
          displayName: user.displayName || "",
          phone: user.phoneNumber || phone || undefined,
          email: user.email || undefined,
          photoURL: user.photoURL || undefined,
        }),
      });
    } catch (err) {
      console.error("Error registrando en servidor:", err);
    }
  }, [visitorId, estId, phone]);

  const handlePhoneSubmit = useCallback(async (fullNumber: string) => {
    setPhone(fullNumber);
    setLoading(true);
    setError(null);
    const ok = await sendPhoneCode(fullNumber, "recaptcha-container");
    setLoading(false);
    if (ok) setStep("otp");
  }, [sendPhoneCode, setError]);

  const handleOtpComplete = useCallback(async (code: string) => {
    setLoading(true);
    const user = await verifyOtp(code);
    if (user) {
      await registerOnServer(user);
      setStep("success");
      setTimeout(onRegistered, 1200);
    }
    setLoading(false);
  }, [verifyOtp, registerOnServer, onRegistered]);

  const handleResendOtp = useCallback(async () => {
    if (!phone) return;
    setError(null);
    await sendPhoneCode(phone, "recaptcha-container");
  }, [phone, sendPhoneCode, setError]);

  const handleGoogle = useCallback(async () => {
    setLoading(true);
    setError(null);
    const user = await signInWithGoogle();
    if (user) {
      await registerOnServer(user);
      setStep("success");
      setTimeout(onRegistered, 1200);
    }
    setLoading(false);
  }, [signInWithGoogle, registerOnServer, onRegistered]);

  return (
    <div className="registro-screen">
      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container" />

      {step === "method" && (
        <div className="registro-content">
          <h2 className="registro-title">Crea tu cuenta</h2>
          <p className="registro-subtitle">
            Conserva tu saldo, bonos y accede desde cualquier dispositivo.
          </p>

          <div className="registro-benefits">
            <div className="registro-benefit-item">
              <span className="registro-benefit-icon">&#127925;</span>
              <span>3 nominaciones gratis</span>
            </div>
            <div className="registro-benefit-item">
              <span className="registro-benefit-icon">&#128274;</span>
              <span>1 conexion extra</span>
            </div>
            <div className="registro-benefit-item">
              <span className="registro-benefit-icon">&#128176;</span>
              <span>Saldo permanente entre bares</span>
            </div>
          </div>

          <button className="registro-method-btn registro-phone-btn" onClick={() => setStep("phone-input")} disabled={loading}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Continuar con celular
          </button>

          <button className="registro-method-btn registro-google-btn" onClick={handleGoogle} disabled={loading}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </button>

          <p className="registro-legal">
            Al registrarte aceptas nuestra{" "}
            <a href="/privacidad" target="_blank" rel="noopener noreferrer">Política de Privacidad</a> y el{" "}
            <a href="/datos" target="_blank" rel="noopener noreferrer">Tratamiento de Datos Personales</a>.
          </p>

          {error && <p className="registro-error">{error}</p>}

          <button className="registro-skip-btn" onClick={onSkip}>
            Anónimo
          </button>
        </div>
      )}

      {step === "phone-input" && (
        <div className="registro-content">
          <button className="registro-back-btn" onClick={() => { setStep("method"); setError(null); }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="registro-title">Ingresa tu numero</h2>
          <p className="registro-subtitle">
            Te enviaremos un codigo de verificacion por SMS.
          </p>
          <PhoneInput
            prefixes={PHONE_PREFIXES}
            defaultPrefix="+57"
            onSubmit={handlePhoneSubmit}
            disabled={loading}
          />
          {error && <p className="registro-error">{error}</p>}
        </div>
      )}

      {step === "otp" && (
        <div className="registro-content">
          <button className="registro-back-btn" onClick={() => { setStep("phone-input"); setError(null); }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="registro-title">Ingresa el codigo</h2>
          <p className="registro-subtitle">
            Enviamos un SMS a <strong>{phone}</strong>
          </p>
          <OtpInput
            onComplete={handleOtpComplete}
            onResend={handleResendOtp}
            disabled={loading}
            error={error}
          />
        </div>
      )}

      {step === "success" && (
        <div className="registro-content registro-success">
          <div className="registro-success-icon">&#10003;</div>
          <h2 className="registro-title">Cuenta creada</h2>
          <p className="registro-subtitle">
            Tu saldo y bonos estan seguros.
          </p>
        </div>
      )}
    </div>
  );
}
