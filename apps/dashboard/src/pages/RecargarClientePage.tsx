import { Link } from "react-router";
import { ArrowLeft, Camera } from "lucide-react";
import clsx from "clsx";

import { useMovimientosResumen } from "@/hooks/api/useMovimientosResumen";
import { usePais } from "@/hooks/api/usePais";
import { useRecargaCliente } from "@/hooks/useRecargaCliente";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

import { BarraSaldo } from "@/components/recarga-cliente/BarraSaldo";
import { TarjetaMonto } from "@/components/recarga-cliente/TarjetaMonto";
import { TarjetaModo } from "@/components/recarga-cliente/TarjetaModo";
import { TablaBonificacion } from "@/components/recarga-cliente/TablaBonificacion";
import { ResumenRecarga } from "@/components/recarga-cliente/ResumenRecarga";
import { ModalEscanerQR } from "@/components/recarga-cliente/ModalEscanerQR";
import { ModalExito } from "@/components/recarga-cliente/ModalExito";

export default function RecargarClientePage() {
  const { data: resumen } = useMovimientosResumen();
  const { data: pais } = usePais();
  const fmt = useCurrencyFormatter();
  const saldoTotal = (resumen?.saldoDisponible ?? 0);

  const {
    montoSeleccionado,
    modoSeleccionado,
    status,
    resultado,
    errorMsg,
    saldoDisponible,
    bonosActuales,
    costoTotal,
    puedeEscanear,
    seleccionarMonto,
    seleccionarModo,
    iniciarEscaneo,
    cancelarEscaneo,
    onQrDecodificado,
    reiniciar,
    montos,
    modos,
    minimoBloqueado,
    costoExtraGenerosa,
    tablaBonos,
  } = useRecargaCliente(saldoTotal, pais?.recarga);

  return (
    <>
      <div className="max-w-[480px] mx-auto space-y-6 pb-24">
        {/* ── Topbar ──────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <Link
            to="/anfitrion/recargar"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Link>
          <div className="text-right">
            <span className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold">
              TU SALDO
            </span>
            <p className="font-mono text-sm font-bold text-gold">{fmt(saldoTotal)}</p>
          </div>
        </div>

        <h1 className="text-xl font-bold text-text-primary">Recargar cliente</h1>

        {/* ── Barra de saldo ──────────────────────────────── */}
        <BarraSaldo
          saldoTotal={saldoTotal}
          saldoDisponible={saldoDisponible}
          minimoBloqueado={minimoBloqueado}
          fmt={fmt}
        />

        {/* ── Paso 1: Monto ───────────────────────────────── */}
        <section>
          <span className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold block mb-3">
            {"\u2460"} MONTO A RECARGAR
          </span>
          <div className="grid grid-cols-6 gap-3">
            {montos.map((monto, i) => {
              const remainder = montos.length % 3;
              const isLastRow = remainder > 0 && i >= montos.length - remainder;
              return (
                <div
                  key={monto.id}
                  className={clsx(
                    !isLastRow && "col-span-2",
                    isLastRow && remainder === 2 && "col-span-3",
                    isLastRow && remainder === 1 && "col-span-6",
                  )}
                >
                  <TarjetaMonto
                    monto={monto}
                    seleccionado={montoSeleccionado?.id === monto.id}
                    deshabilitado={monto.valor > saldoDisponible}
                    onClick={() => seleccionarMonto(monto)}
                    fmt={fmt}
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Paso 2: Modo ────────────────────────────────── */}
        <section>
          <span className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold block mb-3">
            {"\u2461"} MI ESTADO DE ANIMO
          </span>
          <div className="flex gap-3">
            {modos.map((modo) => (
              <TarjetaModo
                key={modo.id}
                modo={modo}
                seleccionado={modoSeleccionado?.id === modo.id}
                bonos={
                  tablaBonos[(montoSeleccionado ?? montos[0])?.id]?.[modo.id] ?? null
                }
                costoExtraGenerosa={costoExtraGenerosa}
                onClick={() => seleccionarModo(modo)}
                fmt={fmt}
              />
            ))}
          </div>

          {/* Nota generosa */}
          {modoSeleccionado?.id === "generosa" && (
            <p className="text-xs text-orange-400 mt-2">
              Modo generosa agrega {fmt(costoExtraGenerosa)} extra al costo total.
            </p>
          )}
        </section>

        {/* ── Tabla de bonificacion ───────────────────────── */}
        <TablaBonificacion
          montos={montos}
          modos={modos}
          tablaBonos={tablaBonos}
          fmt={fmt}
        />

        {/* ── Resumen ─────────────────────────────────────── */}
        <ResumenRecarga
          monto={montoSeleccionado}
          modo={modoSeleccionado}
          bonos={bonosActuales}
          costoTotal={costoTotal}
          fmt={fmt}
        />

        {/* ── Error message ───────────────────────────────── */}
        {errorMsg && (
          <div className="bg-error/10 border border-error/30 rounded-xl p-3 text-sm text-error">
            {errorMsg}
          </div>
        )}
      </div>

      {/* ── Sticky bottom button ──────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-bg border-t border-border px-4 py-3 z-20">
        <div className="max-w-[480px] mx-auto">
          <button
            type="button"
            disabled={!puedeEscanear}
            onClick={iniciarEscaneo}
            className={clsx(
              "w-full flex items-center justify-center gap-2 h-14 rounded-xl text-base font-bold transition-all",
              puedeEscanear
                ? "bg-gold text-[#0A0A0A] hover:bg-gold-light cursor-pointer"
                : "bg-border text-text-disabled cursor-not-allowed",
            )}
          >
            <Camera className="w-5 h-5" />
            Escanear QR del cliente
          </button>
        </div>
      </div>

      {/* ── Modales ───────────────────────────────────────── */}
      <ModalEscanerQR
        open={status === "scanning" || status === "processing"}
        status={status}
        onQrDecodificado={onQrDecodificado}
        onCancelar={cancelarEscaneo}
      />

      <ModalExito
        open={status === "success"}
        resultado={resultado}
        onRecargarOtro={reiniciar}
        onCerrar={() => window.history.back()}
        fmt={fmt}
      />
    </>
  );
}
