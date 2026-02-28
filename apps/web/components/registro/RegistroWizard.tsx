"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth-context";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "@vibrra/shared";
import { useTranslations } from "next-intl";

import { LeftPanel } from "./LeftPanel";
import { ProgressBar } from "./ProgressBar";
import { StepCuenta } from "./steps/StepCuenta";
import { StepIdentidad } from "./steps/StepIdentidad";
import { StepTributario } from "./steps/StepTributario";
import { StepBancaria } from "./steps/StepBancaria";
import { StepLegal } from "./steps/StepLegal";
import s from "@/styles/registro.module.css";

export interface FormData {
  // Step 1
  email: string;
  password: string;
  // Step 2
  nombres: string;
  apellidos: string;
  tipoDoc: string;
  numeroDoc: string;
  fechaNac: string;
  celular: string;
  docFrontal: File | null;
  docPosterior: File | null;
  selfie: File | null;
  // Step 3
  tipoPersona: "natural" | "juridica";
  nit: string;
  regimen: string;
  responsableIva: boolean;
  rutFile: File | null;
  // Step 4
  banco: string;
  tipoCuenta: string;
  numeroCuenta: string;
  titularCuenta: string;
  // Step 5
  aceptaTerminos: boolean;
  aceptaDatos: boolean;
  aceptaPagos: boolean;
  aceptaPublicidad: boolean;
  recibeReportes: boolean;
}

const INITIAL_DATA: FormData = {
  email: "",
  password: "",
  nombres: "",
  apellidos: "",
  tipoDoc: "",
  numeroDoc: "",
  fechaNac: "",
  celular: "",
  docFrontal: null,
  docPosterior: null,
  selfie: null,
  tipoPersona: "natural",
  nit: "",
  regimen: "simple",
  responsableIva: false,
  rutFile: null,
  banco: "",
  tipoCuenta: "",
  numeroCuenta: "",
  titularCuenta: "",
  aceptaTerminos: false,
  aceptaDatos: false,
  aceptaPagos: false,
  aceptaPublicidad: false,
  recibeReportes: false,
};

const TOTAL_STEPS = 5;

export function RegistroWizard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const t = useTranslations("registro.validation");

  const [current, setCurrent] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState<FormData>(INITIAL_DATA);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const rightPanelRef = useRef<HTMLDivElement>(null);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  const updateFields = useCallback((fields: Partial<FormData>) => {
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

        // 3. Write Firestore document
        await setDoc(doc(db, "Usuarios", uid), {
          tipo: "anfitrion",
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
            aceptaTerminos: formData.aceptaTerminos,
            aceptaDatos: formData.aceptaDatos,
            aceptaPagos: formData.aceptaPagos,
            aceptaPublicidad: formData.aceptaPublicidad,
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
          saldoBono: 30000,
          estado: "pendiente_verificacion",
          creadoEn: serverTimestamp(),
        });

        // 4. Redirect to dashboard
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
            <StepCuenta data={formData} update={updateFields} onNext={goNext} />
          )}
          {current === 1 && (
            <StepIdentidad data={formData} update={updateFields} onNext={goNext} onBack={goBack} />
          )}
          {current === 2 && (
            <StepTributario data={formData} update={updateFields} onNext={goNext} onBack={goBack} />
          )}
          {current === 3 && (
            <StepBancaria data={formData} update={updateFields} onNext={goNext} onBack={goBack} />
          )}
          {current === 4 && (
            <StepLegal
              data={formData}
              update={updateFields}
              onComplete={handleComplete}
              onBack={goBack}
              submitting={submitting}
              error={submitError}
            />
          )}
        </div>
      </div>
    </div>
  );
}
