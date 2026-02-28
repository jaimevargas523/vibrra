import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Store,
  Plus,
  Settings,
  Music,
  QrCode,
  RefreshCw,
  MapPin,
  ImagePlus,
} from "lucide-react";
import clsx from "clsx";

import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { StatusDot } from "@/components/ui/StatusDot";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

import { useEstablecimientos, type EstablecimientoListItem } from "@/hooks/api/useEstablecimientos";
import { useSessionStore } from "@/stores/session.store";

/* ── Fallback data ───────────────────────────────────────────── */

const fallbackEstablishments: EstablecimientoListItem[] = [
  {
    id: "e1",
    name: "La Terraza Rooftop",
    address: "Cra 7 #85-24",
    city: "Bogota",
    type: "bar",
    isActive: true,
    imageUrl: null,
    totalSesiones: 42,
    totalRecaudado: 3250000,
  },
  {
    id: "e2",
    name: "Bar El Dorado",
    address: "Cll 10 #43-12",
    city: "Medellin",
    type: "bar",
    isActive: true,
    imageUrl: null,
    totalSesiones: 18,
    totalRecaudado: 1420000,
  },
];

const emojiOptions = [
  "\uD83C\uDF1F", "\uD83C\uDFB5", "\uD83C\uDFB6", "\uD83C\uDF7A", "\uD83C\uDF78",
  "\uD83C\uDF7E", "\uD83C\uDF89", "\uD83D\uDD25", "\uD83D\uDC8E", "\uD83C\uDFAD",
  "\uD83C\uDFE0", "\uD83C\uDF0A",
];

const estEmojis: Record<string, string> = {
  bar: "\uD83C\uDF7A",
  restaurant: "\uD83C\uDF7D",
  club: "\uD83C\uDF89",
  default: "\uD83C\uDFB5",
};

export default function EstablecimientosPage() {
  const { t } = useTranslation("establecimientos");
  const { data: establecimientos, isLoading } = useEstablecimientos();
  const isLive = useSessionStore((s) => s.isLive);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState(emojiOptions[0]);

  const estData = establecimientos ?? fallbackEstablishments;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Establecimientos"
        subtitle={`${estData.length} establecimiento${estData.length !== 1 ? "s" : ""}`}
        actions={
          <Button variant="secondary" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" />
            Agregar establecimiento
          </Button>
        }
      />

      {/* ── Grid ──────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-48" />
          ))}
        </div>
      ) : estData.length === 0 ? (
        <EmptyState
          icon={<Store className="w-16 h-16" />}
          title="Sin establecimientos"
          description="Agrega tu primer establecimiento para empezar a recibir pujas de canciones."
          action={{
            label: "Agregar establecimiento",
            onClick: () => setShowModal(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {estData.map((est) => {
            const emoji = estEmojis[est.type] ?? estEmojis.default;
            const live = isLive && est.id === estData[0]?.id;

            return (
              <div
                key={est.id}
                className="bg-surface rounded-xl border border-border overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="flex items-center justify-center w-11 h-11 rounded-full bg-surface-elevated text-xl shrink-0">
                      {emoji}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-text-primary truncate">
                        {est.name}
                      </h3>
                      <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {est.address} &middot; {est.city}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {live && (
                          <Badge variant="live" size="sm" pulsing>
                            EN SESION
                          </Badge>
                        )}
                        <Badge
                          variant={est.isActive ? "success" : "neutral"}
                          size="sm"
                        >
                          {est.isActive ? "ACTIVO" : "INACTIVO"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Separator + Actions */}
                <div className="border-t border-border grid grid-cols-4">
                  <Link
                    to={`/anfitrion/establecimientos/${est.id}`}
                    className="flex items-center justify-center gap-1.5 py-3 text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Config</span>
                  </Link>
                  <button
                    type="button"
                    className="flex items-center justify-center gap-1.5 py-3 text-xs text-text-secondary border-l border-border hover:bg-surface-hover hover:text-text-primary transition-colors"
                  >
                    <Music className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Musica</span>
                  </button>
                  <Link
                    to="/anfitrion/qrs"
                    className="flex items-center justify-center gap-1.5 py-3 text-xs text-text-secondary border-l border-border hover:bg-surface-hover hover:text-text-primary transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">QR</span>
                  </Link>
                  <button
                    type="button"
                    className="flex items-center justify-center gap-1.5 py-3 text-xs text-text-secondary border-l border-border hover:bg-surface-hover hover:text-text-primary transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sync</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add establishment modal ───────────────────── */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Nuevo establecimiento"
        size="lg"
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button>Crear establecimiento</Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Photo upload */}
          <div className="flex justify-center">
            <button
              type="button"
              className="w-[140px] h-[140px] rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-gold/50 transition-colors cursor-pointer"
            >
              <ImagePlus className="w-8 h-8 text-text-muted" />
              <span className="text-xs text-text-muted">Subir foto</span>
            </button>
          </div>

          {/* Emoji selector */}
          <div>
            <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-2">
              EMOJI
            </label>
            <div className="flex flex-wrap gap-2">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={clsx(
                    "w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all cursor-pointer",
                    selectedEmoji === emoji
                      ? "bg-gold/15 border-2 border-gold"
                      : "bg-surface-elevated border border-border hover:border-border-light"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-1.5">
              NOMBRE *
            </label>
            <input
              type="text"
              placeholder="Ej: La Terraza Rooftop"
              className="w-full bg-card-dark border border-border rounded-lg px-4 py-3 text-text-primary text-sm focus:border-gold outline-none placeholder-text-muted"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-1.5">
              DESCRIPCION
            </label>
            <textarea
              rows={2}
              placeholder="Describe brevemente tu establecimiento"
              className="w-full bg-card-dark border border-border rounded-lg px-4 py-3 text-text-primary text-sm focus:border-gold outline-none placeholder-text-muted resize-none"
            />
          </div>

          {/* Address */}
          <div>
            <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-1.5">
              DIRECCION
            </label>
            <input
              type="text"
              placeholder="Ej: Cra 7 #85-24"
              className="w-full bg-card-dark border border-border rounded-lg px-4 py-3 text-text-primary text-sm focus:border-gold outline-none placeholder-text-muted"
            />
          </div>

          {/* City + Zone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-1.5">
                CIUDAD
              </label>
              <input
                type="text"
                placeholder="Ej: Bogota"
                className="w-full bg-card-dark border border-border rounded-lg px-4 py-3 text-text-primary text-sm focus:border-gold outline-none placeholder-text-muted"
              />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-1.5">
                ZONA
              </label>
              <input
                type="text"
                placeholder="Ej: Zona G"
                className="w-full bg-card-dark border border-border rounded-lg px-4 py-3 text-text-primary text-sm focus:border-gold outline-none placeholder-text-muted"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
