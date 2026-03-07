import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Play,
  Pause,
  SkipForward,
  Trash2,
  Copy,
  Users,
  Music,
  ArrowUp,
  Zap,
  Heart,
  ListMusic,
  X,
} from "lucide-react";
import clsx from "clsx";

import { StatusDot } from "@/components/ui/StatusDot";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";

import { useSessionRTDB } from "@/hooks/useSessionRTDB";
import { useEstablishmentStore } from "@/stores/establishment.store";
import { formatDurationLive, formatRelativeTime } from "@/lib/format";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

/* ── Live timer ──────────────────────────────────────────────── */

function LiveTimer({ startedAt }: { startedAt: number }) {
  const [display, setDisplay] = useState("00:00:00");

  useEffect(() => {
    const start = new Date(startedAt);
    const tick = () => setDisplay(formatDurationLive(start));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return (
    <span className="font-mono text-gold text-lg font-bold">{display}</span>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */

export default function EnVivoPage() {
  const { t } = useTranslation("envivo");
  const establishments = useEstablishmentStore((s) => s.establishments);
  const selectedEst = useEstablishmentStore((s) => s.getSelected());
  const selectEst = useEstablishmentStore((s) => s.select);

  const estId = selectedEst?.id ?? null;

  const {
    sesionActiva,
    isVibrra,
    cancionActual,
    playlist,
    cancionesSonadas,
    ultimaActividad,
    dedicatorias,
    totalRecaudado,
    maxPuja,
    iniciarVibrra,
    detenerVibrra,
    eliminarCancion,
    limpiarCola,
    moverAlFrente,
  } = useSessionRTDB(estId);

  const fmt = useCurrencyFormatter();
  const [showClearModal, setShowClearModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `vibrra.live/s/${estId ?? ""}`;

  // Filter: canción actual fuera de la playlist pendiente
  const pendingItems = cancionActual?.videoId
    ? playlist.filter((item) => item.videoId !== cancionActual.videoId)
    : playlist;

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${shareUrl}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLimpiarCola = () => {
    limpiarCola();
    setShowClearModal(false);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `🎵 ¡Entra a la sesión VIBRRA!\nPide canciones y haz pujas en tiempo real.\n\nhttps://${shareUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  /* ── No active session state ────────────────────────── */
  if (!sesionActiva) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <div className="flex justify-center mb-6">
          <Play className="w-16 h-16 text-text-muted" />
        </div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          {t("noSession.title")}
        </h2>
        <p className="text-sm text-text-secondary mb-6">
          {t("noSession.desc")}
        </p>

        {establishments.length > 1 && (
          <div className="mb-4">
            <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-2">
              ESTABLECIMIENTO
            </label>
            <select
              value={estId ?? ""}
              onChange={(e) => selectEst(e.target.value)}
              className="w-full bg-card-dark border border-border rounded-lg px-4 py-3 text-text-primary text-sm focus:border-gold outline-none"
            >
              {establishments.map((est) => (
                <option key={est.id} value={est.id}>
                  {est.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="button"
          onClick={iniciarVibrra}
          className="h-14 w-full bg-green text-black font-bold rounded-xl text-base hover:bg-green/90 transition-colors cursor-pointer"
        >
          {t("noSession.start")}
        </button>
      </div>
    );
  }

  /* ── Active session ─────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* ── Header bar ────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <StatusDot status="live" />
            <Badge variant="live" pulsing>{t("header.live")}</Badge>
          </div>
          <span className="text-sm text-text-secondary">
            {selectedEst?.name ?? "Establecimiento"}
          </span>
          {ultimaActividad > 0 && <LiveTimer startedAt={ultimaActividad} />}
        </div>

        {/* VIBRRA toggle */}
        <div className="flex items-center gap-2">
          {isVibrra ? (
            <button
              type="button"
              onClick={detenerVibrra}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold/15 border border-gold/30 text-gold text-sm font-bold hover:bg-gold/25 transition-colors cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              VIBRRA ON
            </button>
          ) : (
            <button
              type="button"
              onClick={iniciarVibrra}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border text-text-muted text-sm font-bold hover:border-gold hover:text-gold transition-colors cursor-pointer"
            >
              <Pause className="w-4 h-4" />
              MANUAL
            </button>
          )}
        </div>
      </div>

      {/* ── Two panels ────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left panel - Queue */}
        <div className="lg:w-3/5 space-y-3">
          {/* Cola header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold">
                {t("cola.title")}
              </span>
              <Badge variant="neutral" size="sm">{playlist.length}</Badge>
            </div>
            {playlist.length > 0 && (
              <button
                type="button"
                onClick={() => setShowClearModal(true)}
                className="flex items-center gap-1 text-xs text-error/70 hover:text-error transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                Limpiar cola
              </button>
            )}
          </div>

          {/* Canción actual (from Cancion_reproduccion) */}
          {cancionActual && cancionActual.titulo && (
            <div className="relative bg-surface-elevated rounded-xl border-l-[3px] border-gold p-4 overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {cancionActual.imagen && (
                    <img
                      src={cancionActual.imagen}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-text-primary">
                        {cancionActual.titulo}
                      </p>
                      <Badge variant="gold" size="sm" pulsing>
                        {t("cola.sonando")}
                      </Badge>
                    </div>
                    <p className="text-sm text-text-secondary">
                      {cancionActual.artista}
                    </p>
                    {cancionActual.duracion && (
                      <p className="text-xs text-text-muted mt-0.5">
                        {cancionActual.duracion}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pending queue */}
          {pendingItems.length === 0 ? (
            <EmptyState
              icon={<Music className="w-12 h-12" />}
              title="Cola vacía"
              description={t("cola.empty")}
            />
          ) : (
            <div className="space-y-2">
              {pendingItems.map((item, idx) => (
                <div
                  key={item.videoId}
                  className="bg-surface rounded-xl border border-border p-4 hover:bg-surface-hover transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-text-muted font-mono w-6 text-center">
                        {idx + 1}
                      </span>
                      {item.imagen && (
                        <img
                          src={item.imagen}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-text-primary">
                          {item.titulo}
                        </p>
                        <p className="text-sm text-text-secondary">
                          {item.artista}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {item.origen} &middot;{" "}
                          {formatRelativeTime(new Date(item.timestamp))}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-gold text-right font-semibold text-sm">
                        {fmt(item.puja)}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => moverAlFrente(item.videoId)}
                          title="Mover al frente"
                          className="p-1.5 rounded-lg text-text-muted hover:bg-gold/10 hover:text-gold transition-colors cursor-pointer"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminarCancion(item.videoId)}
                          title={t("cola.acciones.delete")}
                          className="p-1.5 rounded-lg text-text-muted hover:bg-error/10 hover:text-error transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right panel - Stats */}
        <div className="lg:w-2/5 space-y-4">
          {/* Stats cards */}
          <div className="space-y-3">
            <div className="bg-surface rounded-xl border border-border p-4">
              <span className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold">
                {t("stats.recaudado")}
              </span>
              <p className="text-[32px] font-bold font-mono text-gold mt-1 leading-tight">
                {fmt(totalRecaudado)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface rounded-xl border border-border p-4">
                <span className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold">
                  <ListMusic className="w-3 h-3 inline mr-1" />
                  {t("stats.pujas")}
                </span>
                <p className="text-xl font-bold text-text-primary mt-1">
                  {playlist.length}
                </p>
              </div>
              <div className="bg-surface rounded-xl border border-border p-4">
                <span className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold">
                  {t("stats.pujaMax")}
                </span>
                <p className="text-xl font-bold font-mono text-gold mt-1">
                  {fmt(maxPuja)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface rounded-xl border border-border p-4">
                <span className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold">
                  <Music className="w-3 h-3 inline mr-1" />
                  CANCIONES SONADAS
                </span>
                <p className="text-xl font-bold text-text-primary mt-1">
                  {cancionesSonadas}
                </p>
              </div>
              <div className="bg-surface rounded-xl border border-border p-4">
                <span className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold">
                  <Heart className="w-3 h-3 inline mr-1" />
                  DEDICATORIAS
                </span>
                <p className="text-xl font-bold text-text-primary mt-1">
                  {dedicatorias.length}
                </p>
              </div>
            </div>
          </div>

          {/* Dedicatorias recientes */}
          {dedicatorias.length > 0 && (
            <div className="bg-surface rounded-xl border border-border p-4">
              <span className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-3">
                DEDICATORIAS RECIENTES
              </span>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {dedicatorias.slice(0, 5).map((d) => (
                  <div key={d.id} className="flex items-start gap-2 text-xs">
                    <Heart className="w-3 h-3 text-gold flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-text-primary">{d.alias_emisor}</span>
                      <span className="text-text-muted"> · {d.mood}</span>
                      <p className="text-text-secondary mt-0.5">"{d.mensaje}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estado reproductor */}
          <div className={clsx(
            "rounded-xl border p-4 text-center",
            isVibrra
              ? "bg-gold/5 border-gold/20"
              : "bg-surface border-border"
          )}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <Zap className={clsx("w-4 h-4", isVibrra ? "text-gold" : "text-text-muted")} />
              <span className={clsx(
                "text-sm font-bold",
                isVibrra ? "text-gold" : "text-text-muted"
              )}>
                {isVibrra ? "VIBRRA activo" : "Modo manual"}
              </span>
            </div>
            <p className="text-xs text-text-muted">
              {isVibrra
                ? "La extensión controla la reproducción"
                : "Reproducción pausada — activa VIBRRA para continuar"
              }
            </p>
          </div>
        </div>
      </div>

      {/* ── Sticky bottom bar ─────────────────────────── */}
      <div className="sticky bottom-0 bg-bg border-t border-border -mx-4 lg:-mx-6 px-4 lg:px-6 py-4 space-y-3">
        {/* Share URL */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-card-dark rounded-lg p-3 font-mono text-sm text-text-secondary truncate">
            {shareUrl}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className={clsx(
              "flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-colors cursor-pointer",
              copied
                ? "bg-success/15 text-success"
                : "bg-surface border border-border text-text-primary hover:border-gold"
            )}
          >
            <Copy className="w-4 h-4" />
            {copied ? "Copiado" : t("share.copiar")}
          </button>
        </div>

        {/* Share buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleWhatsApp}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-whatsapp text-white text-sm font-semibold hover:bg-whatsapp/90 transition-colors cursor-pointer"
          >
            {t("share.whatsapp")}
          </button>
        </div>
      </div>

      {/* ── Clear queue modal ─────────────────────────── */}
      <Modal
        open={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="Limpiar cola"
        size="sm"
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowClearModal(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleLimpiarCola}>
              Sí, limpiar
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          Se eliminarán las <span className="font-semibold text-text-primary">{playlist.length}</span> canciones
          de la cola. Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}
