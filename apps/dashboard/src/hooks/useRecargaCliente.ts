import { useState, useCallback, useMemo } from "react";
import { apiPost } from "@/lib/api-client";
import type { PaisConfig } from "@/hooks/api/usePais";

export interface Monto {
  id: string;
  valor: number;
  etiqueta: string;
}

export interface Modo {
  id: string;
  emoji: string;
  label: string;
}

export interface Bonos {
  canciones: number;
  conexiones: number;
}

export type RecargaStatus = "idle" | "scanning" | "processing" | "success" | "error";

export interface RecargaResultado {
  nuevoSaldoAnfitrion: number;
  clienteNombre: string;
  montoAcreditado: number;
  bonos: Bonos;
}

/**
 * Hook que encapsula todo el estado y la logica de la pantalla
 * de recarga del anfitrion. Recibe la config de recarga del pais.
 */
export function useRecargaCliente(
  saldoTotal: number,
  recarga?: PaisConfig["recarga"],
) {
  const [montoSeleccionado, setMontoSeleccionado] = useState<Monto | null>(null);
  const [modoSeleccionado, setModoSeleccionado] = useState<Modo | null>(null);
  const [status, setStatus] = useState<RecargaStatus>("idle");
  const [resultado, setResultado] = useState<RecargaResultado | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const minimoBloqueado = recarga?.minimoBloqueado ?? 0;
  const costoExtraGenerosa = recarga?.costoExtraGenerosa ?? 0;
  const tablaBonos = recarga?.tablaBonos ?? {};
  const montos = recarga?.montos ?? [];
  const modos = recarga?.modos ?? [];

  /** Saldo disponible para recargas (total - minimo bloqueado). */
  const saldoDisponible = useMemo(
    () => Math.max(0, saldoTotal - minimoBloqueado),
    [saldoTotal, minimoBloqueado],
  );

  /** Bonos actuales segun monto y modo seleccionados. */
  const bonosActuales = useMemo<Bonos | null>(() => {
    if (!montoSeleccionado || !modoSeleccionado) return null;
    return tablaBonos[montoSeleccionado.id]?.[modoSeleccionado.id] ?? null;
  }, [montoSeleccionado, modoSeleccionado, tablaBonos]);

  /** Costo total que se descuenta al anfitrion. */
  const costoTotal = useMemo(() => {
    if (!montoSeleccionado) return 0;
    return montoSeleccionado.valor + (modoSeleccionado?.id === "generosa" ? costoExtraGenerosa : 0);
  }, [montoSeleccionado, modoSeleccionado, costoExtraGenerosa]);

  /** Puede escanear si tiene monto, modo seleccionados y saldo suficiente. */
  const puedeEscanear = useMemo(
    () =>
      montoSeleccionado !== null &&
      modoSeleccionado !== null &&
      costoTotal <= saldoDisponible,
    [montoSeleccionado, modoSeleccionado, costoTotal, saldoDisponible],
  );

  const seleccionarMonto = useCallback((monto: Monto) => {
    setMontoSeleccionado(monto);
    setErrorMsg(null);
  }, []);

  const seleccionarModo = useCallback((modo: Modo) => {
    setModoSeleccionado(modo);
    setErrorMsg(null);
  }, []);

  const iniciarEscaneo = useCallback(() => {
    setStatus("scanning");
    setErrorMsg(null);
  }, []);

  const cancelarEscaneo = useCallback(() => {
    setStatus("idle");
  }, []);

  /**
   * Se llama cuando el escaner decodifica el QR del cliente.
   * Llama al backend y maneja el resultado.
   */
  const onQrDecodificado = useCallback(
    async (clienteId: string) => {
      if (!montoSeleccionado || !modoSeleccionado) return;

      setStatus("processing");
      setErrorMsg(null);

      try {
        const res = await apiPost<RecargaResultado>("/api/recarga-cliente/transferir", {
          clienteId,
          montoId: montoSeleccionado.id,
          modoId: modoSeleccionado.id,
        });
        setResultado(res);
        setStatus("success");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al procesar la recarga.";
        setErrorMsg(message);
        setStatus("error");
      }
    },
    [montoSeleccionado, modoSeleccionado],
  );

  /** Resetea todo el estado para una nueva recarga. */
  const reiniciar = useCallback(() => {
    setMontoSeleccionado(null);
    setModoSeleccionado(null);
    setStatus("idle");
    setResultado(null);
    setErrorMsg(null);
  }, []);

  return {
    // State
    montoSeleccionado,
    modoSeleccionado,
    status,
    resultado,
    errorMsg,
    // Derived
    saldoDisponible,
    bonosActuales,
    costoTotal,
    puedeEscanear,
    // Handlers
    seleccionarMonto,
    seleccionarModo,
    iniciarEscaneo,
    cancelarEscaneo,
    onQrDecodificado,
    reiniciar,
    // Config re-exports
    montos,
    modos,
    minimoBloqueado,
    costoExtraGenerosa,
    tablaBonos,
  };
}
