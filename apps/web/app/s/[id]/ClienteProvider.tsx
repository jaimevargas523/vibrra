"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { ref, onValue, set as rtdbSet } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { useFingerprint } from "./useFingerprint";

interface Bonos {
  conexionesGratis: number;
  nominacionesGratis: number;
}

interface ClienteState {
  visitorId: string | null;
  fpLoading: boolean;
  alias: string;
  setAlias: (v: string) => void;
  isFirstVisit: boolean;
  saldo: number;
  gastarSaldo: (monto: number) => boolean;
  bonos: Bonos;
}

const ClienteContext = createContext<ClienteState | null>(null);

const ALIAS_KEY = "vibrra_alias";

function visitedKey(estId: string) {
  return `vibrra_visited_${estId}`;
}

export function ClienteProvider({ estId, children }: { estId: string; children: ReactNode }) {
  const { visitorId, loading: fpLoading } = useFingerprint();
  const [alias, setAlias] = useState("");
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [saldo, setSaldo] = useState(0);
  const [bonos, setBonos] = useState<Bonos>({ conexionesGratis: 0, nominacionesGratis: 0 });
  const [registrado, setRegistrado] = useState(false);

  // Recuperar alias desde localStorage
  useEffect(() => {
    const savedAlias = localStorage.getItem(ALIAS_KEY);
    if (savedAlias) setAlias(savedAlias);

    const visited = localStorage.getItem(visitedKey(estId));
    if (visited) setIsFirstVisit(false);
  }, [estId]);

  // Registrar cliente anónimo en Firebase cuando tenemos fingerprint
  useEffect(() => {
    if (!visitorId || registrado) return;
    const id = visitorId; // narrow para evitar null en closures

    const visited = localStorage.getItem(visitedKey(estId));

    async function registrar() {
      try {
        const res = await fetch("/api/cliente-anonimo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitorId: id, estId }),
        });
        const data = await res.json();

        if (data.isNew) {
          setIsFirstVisit(true);
        } else if (visited) {
          setIsFirstVisit(false);
        }

        if (!visited) {
          localStorage.setItem(visitedKey(estId), id);
        }

        setRegistrado(true);
      } catch {
        if (!visited) {
          setIsFirstVisit(true);
          setSaldo(2000);
          setBonos({ conexionesGratis: 1, nominacionesGratis: 0 });
          localStorage.setItem(visitedKey(estId), id);
        }
        setRegistrado(true);
      }
    }

    registrar();
  }, [visitorId, estId, registrado]);

  // Escuchar saldo y bonos en tiempo real desde RTDB
  useEffect(() => {
    if (!visitorId) return;

    const saldoRef = ref(rtdb, `Anonimos/${visitorId}/saldo`);
    const bonosRef = ref(rtdb, `Anonimos/${visitorId}/bonos`);

    const unsubSaldo = onValue(saldoRef, (snap) => {
      const val = snap.val();
      if (val !== null) setSaldo(val);
    });

    const unsubBonos = onValue(bonosRef, (snap) => {
      const val = snap.val();
      if (val) setBonos(val);
    });

    return () => {
      unsubSaldo();
      unsubBonos();
    };
  }, [visitorId]);

  /** Descuenta del saldo si hay suficiente. Escribe a RTDB. */
  const gastarSaldo = useCallback((monto: number): boolean => {
    if (saldo < monto || !visitorId) return false;
    const nuevoSaldo = saldo - monto;
    setSaldo(nuevoSaldo);
    // Escribir a RTDB para persistencia
    rtdbSet(ref(rtdb, `Anonimos/${visitorId}/saldo`), nuevoSaldo);
    return true;
  }, [saldo, visitorId]);

  return (
    <ClienteContext.Provider
      value={{ visitorId, fpLoading, alias, setAlias, isFirstVisit, saldo, gastarSaldo, bonos }}
    >
      {children}
    </ClienteContext.Provider>
  );
}

export function useCliente() {
  const ctx = useContext(ClienteContext);
  if (!ctx) throw new Error("useCliente debe usarse dentro de ClienteProvider");
  return ctx;
}
