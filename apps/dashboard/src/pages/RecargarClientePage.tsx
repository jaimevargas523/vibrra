import { Link } from "react-router";
import { ArrowLeft, Camera } from "lucide-react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

import { useMovimientosResumen } from "@/hooks/api/useMovimientosResumen";
import { usePais } from "@/hooks/api/usePais";
import { useRecargaCliente } from "@/hooks/useRecargaCliente";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

import { TarjetaMonto } from "@/components/recarga-cliente/TarjetaMonto";
import { TarjetaModo } from "@/components/recarga-cliente/TarjetaModo";
import { TablaBonificacion } from "@/components/recarga-cliente/TablaBonificacion";

import { ModalEscanerQR } from "@/components/recarga-cliente/ModalEscanerQR";
import { ModalExito } from "@/components/recarga-cliente/ModalExito";

export default function RecargarClientePage() {
  const { t } = useTranslation("recargar");
  const { data: resumen } = useMovimientosResumen();
  const { data: pais } = usePais();
  const fmt = useCurrencyFormatter();

  const {
    montoSeleccionado,
    modoSeleccionado,
    status,
    resultado,
    errorMsg,
    bonosActuales,
    montoTotal,
    comisionEsta,
    puedeEscanear,
    seleccionarMonto,
    seleccionarModo,
    iniciarEscaneo,
    cancelarEscaneo,
    onQrDecodificado,
    reiniciar,
    montos,
    modos,
    costoExtraGenerosa,
    tablaBonos,
  } = useRecargaCliente(pais?.recarga);

  const comisionAcumulada = resumen?.comisionesMes ?? 0;
  const recaudoMes = resumen?.recaudoMes ?? 0;
  const bonoArranqueSaldo = resumen?.bonoArranqueSaldo ?? 0;

  return (
    <>
      <div className="max-w-[480px] mx-auto space-y-6 pb-24">
        {/* ── Topbar ──────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <Link
            to="/anfitrion"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("title")}
          </Link>
          <div className="text-right">
            <span className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold">
              {t("topbar.comision", { monto: "" }).replace(": ", "")}
            </span>
            <p className="font-mono text-sm font-bold text-green">{fmt(comisionAcumulada)}</p>
          </div>
        </div>

        {/* ── Card estado del mes ────────────────────────── */}
        <div className="bg-surface rounded-xl border border-border p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">{t("estadoMes.recaudoMes")}</span>
            <span className="font-mono text-text-secondary">{fmt(recaudoMes)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">{t("estadoMes.comisionAcumulada")}</span>
            <span className="font-mono text-green">+ {fmt(comisionAcumulada)}</span>
          </div>
          {bonoArranqueSaldo > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">{t("estadoMes.bonoDisponible")}</span>
              <span className="font-mono text-blue">{fmt(bonoArranqueSaldo)}</span>
            </div>
          )}
        </div>

        {/* ── Paso 1: Monto ───────────────────────────────── */}
        <section>
          <span className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold block mb-3">
            {"\u2460"} {t("montos.title")}
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
                    deshabilitado={false}
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
            {"\u2461"} {t("modos.title")}
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

          {modoSeleccionado?.id === "generosa" && (
            <p className="text-xs text-orange-400 mt-2">
              {t("modos.extraGenerosa", { monto: fmt(costoExtraGenerosa) })}
            </p>
          )}
        </section>

        {/* ── Tabla de bonificación ─────────────────────── */}
        <TablaBonificacion
          montos={montos}
          modos={modos}
          tablaBonos={tablaBonos}
          fmt={fmt}
        />

        {/* ── Resumen ────────────────────────────────────── */}
        {montoSeleccionado && modoSeleccionado && (
          <div className="bg-surface rounded-xl border border-border p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-blue">{t("resumen.saldoCliente")}</span>
              <span className="font-mono text-blue">{fmt(montoSeleccionado.valor)}</span>
            </div>
            {bonosActuales && bonosActuales.canciones > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-blue">{t("resumen.cancionesGratis")}</span>
                <span className="font-mono text-blue">&times;{bonosActuales.canciones}</span>
              </div>
            )}
            {bonosActuales && bonosActuales.conexiones > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-blue">{t("resumen.conexionesGratis")}</span>
                <span className="font-mono text-blue">&times;{bonosActuales.conexiones}</span>
              </div>
            )}
            {modoSeleccionado.id === "generosa" && (
              <div className="flex justify-between text-sm">
                <span className="text-orange-400">{t("resumen.extraGenerosa")}</span>
                <span className="font-mono text-orange-400">{fmt(costoExtraGenerosa)}</span>
              </div>
            )}
            <hr className="border-border" />
            <div className="flex justify-between text-sm font-bold">
              <span className="text-green">{t("resumen.comisionRecarga")}</span>
              <span className="font-mono text-green">+ {fmt(comisionEsta)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">{t("resumen.comisionAcumulada")}</span>
              <span className="font-mono text-text-muted">{fmt(comisionAcumulada + comisionEsta)}</span>
            </div>
          </div>
        )}

        {/* ── Error message ─────────────────────────────── */}
        {errorMsg && (
          <div className="bg-error/10 border border-error/30 rounded-xl p-3 text-sm text-error">
            {errorMsg}
          </div>
        )}
      </div>

      {/* ── Sticky bottom button ──────────────────────── */}
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
            {puedeEscanear ? t("btn.escanear") : t("btn.disabled")}
          </button>
        </div>
      </div>

      {/* ── Modales ──────────────────────────────────── */}
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
