"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth-context";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "@vibrra/shared";
import { useTranslations } from "next-intl";

import type { RegistrationFormData, CountryConfig } from "@/lib/registration/types";
import { INITIAL_REGISTRATION_DATA } from "@/lib/registration/types";
import { getCountryConfig } from "@/lib/registration/countries";

import { LeftPanel } from "./LeftPanel";
import { ProgressBar } from "./ProgressBar";
import { StepPais } from "./steps/StepPais";
import { StepCuenta } from "./steps/StepCuenta";
import { StepIdentidad } from "./steps/StepIdentidad";
import { StepTributario } from "./steps/StepTributario";
import { StepBancaria } from "./steps/StepBancaria";
import { StepLegal } from "./steps/StepLegal";
import s from "@/styles/registro.module.css";

// Re-export for backward compat with step imports
export type FormData = RegistrationFormData;

const TOTAL_STEPS = 6;

export function RegistroWizard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const t = useTranslations("registro.validation");

  const [current, setCurrent] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState<RegistrationFormData>(INITIAL_REGISTRATION_DATA);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const rightPanelRef = useRef<HTMLDivElement>(null);

  // Derive country config from selected country (null if none selected yet)
  const countryConfig: CountryConfig | null = useMemo(() => {
    if (!formData.country) return null;
    try {
      return getCountryConfig(formData.country);
    } catch {
      return null;
    }
  }, [formData.country]);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  const updateFields = useCallback((fields: Partial<RegistrationFormData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  }, []);

  const goNext = useCallback(() => {
    setCompleted((prev) => new Set(prev).add(current));
    setCurrent((prev) => Math.min(prev + 1, TOTAL_STEPS));
    rightPanelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [current]);

  const goBack = useCallback(() => {
    setCurrent((prev) => Math.max(prev - 1, 0));
    rightPanelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  async function uploadFile(uid: string, path: string, file: File): Promise<string> {
    const storageRef = ref(storage, `kyc/${uid}/${path}`);
    const snap = await uploadBytes(storageRef, file);
    return getDownloadURL(snap.ref);
  }

  async function handleComplete() {
    if (!countryConfig) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      // 1. Create Firebase Auth account
      const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const uid = cred.user.uid;

      try {
        // 2. Upload KYC documents to Storage
        const [docFrontalUrl, docPosteriorUrl, selfieUrl, rutUrl] = await Promise.all([
          formData.docFrontal ? uploadFile(uid, "cedula-frontal", formData.docFrontal) : Promise.resolve(null),
          formData.docPosterior ? uploadFile(uid, "cedula-posterior", formData.docPosterior) : Promise.resolve(null),
          formData.selfie ? uploadFile(uid, "selfie", formData.selfie) : Promise.resolve(null),
          formData.rutFile ? uploadFile(uid, "rut", formData.rutFile) : Promise.resolve(null),
        ]);

        // 3. Build legal acceptances object
        const legalObj: Record<string, boolean> = {};
        for (const doc of countryConfig.legalDocs) {
          legalObj[doc.key] = formData.legalAcceptances[doc.key] ?? false;
        }

        // 4. Write Firestore document (country-aware schema)
        await setDoc(doc(db, "Anfitriones", uid), {
          tipo: "anfitrion",
          pais: formData.country,
          email: formData.email,
          nombres: formData.nombres,
          apellidos: formData.apellidos,
          tipoDoc: formData.tipoDoc,
          numeroDoc: formData.numeroDoc,
          fechaNac: formData.fechaNac,
          celular: formData.celular,
          tipoPersona: formData.tipoPersona,
          nit: formData.nit,
          regimen: formData.regimen,
          responsableIva: formData.responsableIva,
          banco: formData.banco,
          tipoCuenta: formData.tipoCuenta,
          numeroCuenta: formData.numeroCuenta,
          titularCuenta: formData.titularCuenta,
          legal: {
            ...legalObj,
            recibeReportes: formData.recibeReportes,
            fechaAceptacion: new Date().toISOString(),
          },
          verificacion: {
            estado: "pendiente",
            docFrontalUrl,
            docPosteriorUrl,
            selfieUrl,
            rutUrl,
          },
          saldoReal: 0,
          saldoBono: countryConfig.activationBonus,
          moneda: countryConfig.currency.code,
          estado: "pendiente_verificacion",
          creadoEn: serverTimestamp(),
        });

        // 5. Redirect to dashboard
        router.replace("/dashboard");
      } catch (innerErr) {
        // Cleanup: delete the auth user if Firestore/Storage failed
        await cred.user.delete().catch(() => {});
        throw innerErr;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error && err.message.includes("email-already-in-use")
        ? t("emailInUse")
        : t("genericError");
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;
  if (user) return null;

  return (
    <div className={s.layout}>
      <LeftPanel current={current} completed={completed} />

      <div className={s.rightPanel} ref={rightPanelRef}>
        <div className={s.formContainer}>
          <ProgressBar current={current} total={TOTAL_STEPS} />

          {current === 0 && (
            <StepPais data={formData} update={updateFields} onNext={goNext} />
          )}
          {current === 1 && (
            <StepCuenta data={formData} update={updateFields} onNext={goNext} onBack={goBack} />
          )}
          {current === 2 && countryConfig && (
            <StepIdentidad data={formData} update={updateFields} onNext={goNext} onBack={goBack} countryConfig={countryConfig} />
          )}
          {current === 3 && countryConfig && (
            <StepTributario data={formData} update={updateFields} onNext={goNext} onBack={goBack} countryConfig={countryConfig} />
          )}
          {current === 4 && countryConfig && (
            <StepBancaria data={formData} update={updateFields} onNext={goNext} onBack={goBack} countryConfig={countryConfig} />
          )}
          {current === 5 && countryConfig && (
            <StepLegal
              data={formData}
              update={updateFields}
              onComplete={handleComplete}
              onBack={goBack}
              submitting={submitting}
              error={submitError}
              countryConfig={countryConfig}
            />
          )}
        </div>
      </div>
    </div>
  );
}
