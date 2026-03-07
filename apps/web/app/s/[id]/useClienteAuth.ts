"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  onAuthStateChanged,
  signInWithPhoneNumber,
  signInWithPopup,
  linkWithPopup,
  linkWithCredential,
  PhoneAuthProvider,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signOut as firebaseSignOut,
  type User,
  type ConfirmationResult,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export function useClienteAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const clearRecaptcha = useCallback(() => {
    if (recaptchaRef.current) {
      try { recaptchaRef.current.clear(); } catch { /* ignore */ }
      recaptchaRef.current = null;
    }
  }, []);

  const ensureRecaptcha = useCallback((containerId: string) => {
    clearRecaptcha();
    recaptchaRef.current = new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
    });
    return recaptchaRef.current;
  }, [clearRecaptcha]);

  const sendPhoneCode = useCallback(async (phone: string, containerId: string) => {
    setError(null);
    try {
      const verifier = ensureRecaptcha(containerId);
      const result = await signInWithPhoneNumber(auth, phone, verifier);
      confirmationRef.current = result;
      return true;
    } catch (err: any) {
      clearRecaptcha();
      const code = err?.code ?? "";
      console.error("Phone auth error:", code, err);
      if (code === "auth/too-many-requests") {
        setError("Demasiados intentos. Espera unos minutos.");
      } else if (code === "auth/invalid-phone-number") {
        setError("Numero de telefono invalido.");
      } else if (code === "auth/operation-not-allowed") {
        setError("Autenticacion por telefono no habilitada en Firebase.");
      } else if (code === "auth/captcha-check-failed") {
        setError("Error de verificacion reCAPTCHA. Recarga la pagina.");
      } else {
        setError(`Error al enviar codigo: ${code || err?.message || "desconocido"}`);
      }
      return false;
    }
  }, [ensureRecaptcha, clearRecaptcha]);

  const verifyOtp = useCallback(async (code: string) => {
    setError(null);
    if (!confirmationRef.current) {
      setError("No hay codigo pendiente.");
      return null;
    }
    try {
      const credential = await confirmationRef.current.confirm(code);
      confirmationRef.current = null;
      clearRecaptcha();
      return credential.user;
    } catch (err: any) {
      const errCode = err?.code ?? "";
      if (errCode === "auth/invalid-verification-code") {
        setError("Codigo incorrecto.");
      } else {
        setError("Error al verificar. Intenta de nuevo.");
      }
      return null;
    }
  }, [clearRecaptcha]);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (err: any) {
      const code = err?.code ?? "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        return null; // User cancelled
      }
      if (code === "auth/unauthorized-domain") {
        setError("Dominio no autorizado. Agrega este dominio en Firebase Console.");
      } else if (code === "auth/operation-not-allowed") {
        setError("Google Sign-In no esta habilitado en Firebase.");
      } else {
        setError(`Error al iniciar con Google: ${code || err?.message || "desconocido"}`);
      }
      console.error("Google sign-in error:", code, err);
      return null;
    }
  }, []);

  const linkGoogle = useCallback(async () => {
    setError(null);
    if (!user) return false;
    try {
      const provider = new GoogleAuthProvider();
      await linkWithPopup(user, provider);
      return true;
    } catch (err: any) {
      const code = err?.code ?? "";
      if (code === "auth/credential-already-in-use") {
        setError("Esta cuenta de Google ya esta vinculada a otro usuario.");
      } else if (code === "auth/provider-already-linked") {
        setError("Google ya esta vinculado a tu cuenta.");
      } else {
        setError("Error al vincular Google.");
      }
      return false;
    }
  }, [user]);

  const linkPhone = useCallback(async (verificationId: string, code: string) => {
    setError(null);
    if (!user) return false;
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      await linkWithCredential(user, credential);
      return true;
    } catch (err: any) {
      const code2 = err?.code ?? "";
      if (code2 === "auth/credential-already-in-use") {
        setError("Este numero ya esta vinculado a otra cuenta.");
      } else if (code2 === "auth/provider-already-linked") {
        setError("El celular ya esta vinculado a tu cuenta.");
      } else {
        setError("Error al vincular celular.");
      }
      return false;
    }
  }, [user]);

  const signOut = useCallback(async () => {
    setError(null);
    clearRecaptcha();
    confirmationRef.current = null;
    await firebaseSignOut(auth);
  }, [clearRecaptcha]);

  return {
    user,
    loading,
    error,
    setError,
    sendPhoneCode,
    verifyOtp,
    signInWithGoogle,
    linkGoogle,
    linkPhone,
    signOut,
  };
}
