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

/**
 * Resultado de una recarga exitosa.
 * Modelo de crédito: muestra comisión ganada, no saldo.
 */
export interface RecargaResultado {
  comisionAcumulada: number;
  recaudoMes: number;
  clienteNombre: string;
  montoAcreditado: number;
  bonos: Bonos;
  comisionEsta: number;
}

/**
 * Hook que encapsula el estado y la lógica de la pantalla de recarga.
 * Modelo de crédito: NO valida saldo — crédito ilimitado.
 * Las tarjetas de monto siempre están habilitadas.
 */
export function useRecargaCliente(
  recarga?: PaisConfig["recarga"],
) {
  const [montoSeleccionado, setMontoSeleccionado] = useState<Monto | null>(null);
  const [modoSeleccionado, setModoSeleccionado] = useState<Modo | null>(null);
  const [status, setStatus] = useState<RecargaStatus>("idle");
  const [resultado, setResultado] = useState<RecargaResultado | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const costoExtraGenerosa = recarga?.costoExtraGenerosa ?? 0;
  const tablaBonos = recarga?.tablaBonos ?? {};
  const montos = recarga?.montos ?? [];
  const modos = recarga?.modos ?? [];

  /** Bonos actuales según monto y modo seleccionados. */
  const bonosActuales = useMemo<Bonos | null>(() => {
    if (!montoSeleccionado || !modoSeleccionado) return null;
    return tablaBonos[montoSeleccionado.id]?.[modoSeleccionado.id] ?? null;
  }, [montoSeleccionado, modoSeleccionado, tablaBonos]);

  /** Extra del modo generosa */
  const extra = useMemo(
    () => (modoSeleccionado?.id === "generosa" ? costoExtraGenerosa : 0),
    [modoSeleccionado, costoExtraGenerosa],
  );

  /** Monto total de la recarga (monto + extra generosa) */
  const montoTotal = useMemo(() => {
    if (!montoSeleccionado) return 0;
    return montoSeleccionado.valor + extra;
  }, [montoSeleccionado, extra]);

  /** Comisión que gana el anfitrión por esta recarga (10%) */
  const comisionEsta = useMemo(
    () => Math.round(montoTotal * 0.10),
    [montoTotal],
  );

  /** Puede escanear si tiene monto y modo seleccionados. Sin validar saldo. */
  const puedeEscanear = useMemo(
    () => montoSeleccionado !== null && modoSeleccionado !== null,
    [montoSeleccionado, modoSeleccionado],
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
   * Se llama cuando el escáner decodifica el QR del cliente.
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
    bonosActuales,
    extra,
    montoTotal,
    comisionEsta,
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
    costoExtraGenerosa,
    tablaBonos,
  };
}
