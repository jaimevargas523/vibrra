import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Play,
  SkipForward,
  Trash2,
  Copy,
  Users,
  Music,
  DollarSign,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";
import clsx from "clsx";

import { StatusDot } from "@/components/ui/StatusDot";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";

import { useActiveSession } from "@/hooks/api/useActiveSession";
import { useSessionStore, type QueueItem } from "@/stores/session.store";
import { useEstablishmentStore } from "@/stores/establishment.store";
import { useSessionSocket } from "@/hooks/useSessionSocket";
import { formatCOP, formatDurationLive, formatRelativeTime } from "@/lib/format";

/* ── Mock data ───────────────────────────────────────────────── */

const mockQueue: QueueItem[] = [
  {
    id: "q1",
    songTitle: "Despacito",
    artistName: "Luis Fonsi",
    requestedBy: "Carlos M.",
    amount: 5000,
    status: "playing",
    createdAt: new Date(Date.now() - 180000).toISOString(),
  },
  {
    id: "q2",
    songTitle: "Vivir Mi Vida",
    artistName: "Marc Anthony",
    requestedBy: "Andrea L.",
    amount: 3000,
    status: "pending",
    createdAt: new Date(Date.now() - 120000).toISOString(),
  },
  {
    id: "q3",
    songTitle: "La Bicicleta",
    artistName: "Shakira & Carlos Vives",
    requestedBy: "Julian R.",
    amount: 8000,
    status: "pending",
    createdAt: new Date(Date.now() - 60000).toISOString(),
  },
  {
    id: "q4",
    songTitle: "Felices los 4",
    artistName: "Maluma",
    requestedBy: "Sofia P.",
    amount: 2000,
    status: "pending",
    createdAt: new Date(Date.now() - 45000).toISOString(),
  },
  {
    id: "q5",
    songTitle: "Hawai",
    artistName: "Maluma",
    requestedBy: "Diego A.",
    amount: 4500,
    status: "pending",
    createdAt: new Date(Date.now() - 30000).toISOString(),
  },
];

const mockMiniChart = Array.from({ length: 30 }, (_, i) => ({
  t: i,
  value: Math.floor(Math.random() * 8000 + 2000),
}));

/* ── Live timer ──────────────────────────────────────────────── */

function LiveTimer({ startedAt }: { startedAt: string }) {
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
  const { data: activeSession } = useActiveSession();
  const {
    isLive,
    sessionId,
    queue: storeQueue,
    connectedUsers,
    totalRecaudado,
    startedAt,
    currentSong,
  } = useSessionStore();
  const establishments = useEstablishmentStore((s) => s.establishments);
  const selectedEst = useEstablishmentStore((s) => s.getSelected());
  const selectEst = useEstablishmentStore((s) => s.select);

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useSessionSocket(sessionId, selectedEst?.id ?? null);

  const hasSession = isLive || !!activeSession;
  const sessionStartedAt = startedAt || activeSession?.startedAt;
  const liveUsers = connectedUsers || activeSession?.connectedUsers || 0;
  const liveRecaudado = totalRecaudado || activeSession?.totalRecaudado || 0;
  const queue = storeQueue.length > 0 ? storeQueue : mockQueue;
  const slug = selectedEst?.name?.toLowerCase().replace(/\s+/g, "-") ?? "terraza-rooftop";
  const shareUrl = `vibrra.live/s/${slug}`;

  const playingItem = queue.find((q) => q.status === "playing");
  const pendingItems = queue.filter((q) => q.status === "pending");
  const maxBid = queue.length > 0 ? Math.max(...queue.map((q) => q.amount)) : 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${shareUrl}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── No active session state ────────────────────────── */
  if (!hasSession) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <div className="flex justify-center mb-6">
          <Play className="w-16 h-16 text-text-muted" />
        </div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          No hay sesion activa
        </h2>
        <p className="text-sm text-text-secondary mb-6">
          Inicia una sesion para que tus clientes puedan pedir canciones y hacer pujas en tiempo real.
        </p>

        {establishments.length > 1 && (
          <div className="mb-4">
            <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-2">
              ESTABLECIMIENTO
            </label>
            <select
              value={selectedEst?.id ?? ""}
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
          className="h-14 w-full bg-green text-black font-bold rounded-xl text-base hover:bg-green/90 transition-colors cursor-pointer"
        >
          Iniciar sesion
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
            <Badge variant="live" pulsing>EN SESION</Badge>
          </div>
          <span className="text-sm text-text-secondary">
            {selectedEst?.name ?? activeSession?.establishmentName ?? "Establecimiento"}
          </span>
          {sessionStartedAt && <LiveTimer startedAt={sessionStartedAt} />}
          <Badge variant="info" size="sm">
            <Users className="w-3 h-3" />
            {liveUsers}
          </Badge>
        </div>
      </div>

      {/* ── Two panels ────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left panel - Queue */}
        <div className="lg:w-3/5 space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold">
              COLA DE CANCIONES
            </span>
            <Badge variant="neutral" size="sm">{queue.length}</Badge>
          </div>

          {queue.length === 0 ? (
            <EmptyState
              icon={<Music className="w-12 h-12" />}
              title="Cola vacia"
              description="Las canciones pedidas por tus clientes apareceran aqui"
            />
          ) : (
            <div className="space-y-2">
              {/* Song #1 - currently playing */}
              {playingItem && (
                <div className="relative bg-surface-elevated rounded-xl border-l-[3px] border-gold p-4 overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gold font-mono">1</span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-text-primary">
                            {playingItem.songTitle}
                          </p>
                          <Badge variant="gold" size="sm" pulsing>
                            SONANDO
                          </Badge>
                        </div>
                        <p className="text-sm text-text-secondary">
                          {playingItem.artistName}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {playingItem.requestedBy} &middot;{" "}
                          {formatRelativeTime(new Date(playingItem.createdAt))}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-gold text-right font-semibold">
                        {formatCOP(playingItem.amount)}
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="p-1.5 rounded-lg text-text-muted hover:bg-warning/10 hover:text-warning transition-colors"
                        >
                          <SkipForward className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 rounded-lg text-text-muted hover:bg-error/10 hover:text-error transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-border">
                    <div
                      className="h-full bg-gold rounded-full animate-pulse"
                      style={{ width: "45%" }}
                    />
                  </div>
                </div>
              )}

              {/* Remaining songs */}
              {pendingItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-surface rounded-xl border border-border p-4 hover:bg-surface-hover transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-text-muted font-mono">
                        {idx + 2}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">
                          {item.songTitle}
                        </p>
                        <p className="text-sm text-text-secondary">
                          {item.artistName}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {item.requestedBy} &middot;{" "}
                          {formatRelativeTime(new Date(item.createdAt))}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-gold text-right font-semibold">
                        {formatCOP(item.amount)}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          className="p-1.5 rounded-lg text-text-muted hover:bg-success/10 hover:text-success transition-colors"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 rounded-lg text-text-muted hover:bg-warning/10 hover:text-warning transition-colors"
                        >
                          <SkipForward className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 rounded-lg text-text-muted hover:bg-error/10 hover:text-error transition-colors"
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
                USUARIOS EN VIVO
              </span>
              <p className="text-[32px] font-bold text-green mt-1 leading-tight">
                {liveUsers || 47}
              </p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4">
              <span className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold">
                RECAUDADO
              </span>
              <p className="text-[32px] font-bold font-mono text-gold mt-1 leading-tight">
                {formatCOP(liveRecaudado || 185000)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface rounded-xl border border-border p-4">
                <span className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold">
                  TOTAL PUJAS
                </span>
                <p className="text-xl font-bold text-text-primary mt-1">
                  {queue.length || 24}
                </p>
              </div>
              <div className="bg-surface rounded-xl border border-border p-4">
                <span className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold">
                  PUJA MAXIMA
                </span>
                <p className="text-xl font-bold font-mono text-gold mt-1">
                  {formatCOP(maxBid || 15000)}
                </p>
              </div>
            </div>
          </div>

          {/* Mini area chart */}
          <div className="bg-surface rounded-xl border border-border p-4">
            <span className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold">
              ACTIVIDAD EN TIEMPO REAL
            </span>
            <div className="mt-2 h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockMiniChart}>
                  <defs>
                    <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D4A017" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#D4A017" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#D4A017"
                    strokeWidth={2}
                    fill="url(#goldGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
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
              "flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-colors",
              copied
                ? "bg-success/15 text-success"
                : "bg-surface border border-border text-text-primary hover:border-gold"
            )}
          >
            <Copy className="w-4 h-4" />
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>

        {/* Share + close buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-whatsapp text-white text-sm font-semibold hover:bg-whatsapp/90 transition-colors"
          >
            WhatsApp
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-instagram text-white text-sm font-semibold hover:bg-instagram/90 transition-colors"
          >
            Instagram
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors"
          >
            TikTok
          </button>
          <div className="flex-1" />
          <Button variant="danger" onClick={() => setShowCloseModal(true)}>
            Cerrar sesion
          </Button>
        </div>
      </div>

      {/* ── Close session modal ───────────────────────── */}
      <Modal
        open={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        title="Cerrar sesion"
        size="sm"
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowCloseModal(false)}>
              Cancelar
            </Button>
            <Button variant="danger">
              Si, cerrar sesion
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          Hay <span className="font-semibold text-text-primary">{liveUsers || 47}</span> usuarios
          conectados y <span className="font-semibold text-text-primary">{pendingItems.length}</span> canciones
          pendientes en la cola. Al cerrar la sesion, se perderan las pujas pendientes.
        </p>
        <p className="text-sm text-warning mt-3">
          Esta accion no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}
