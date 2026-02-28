import { useState } from "react";
import { useParams, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Save } from "lucide-react";
import clsx from "clsx";

import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

import { useEstablecimiento } from "@/hooks/api/useEstablecimiento";

/* ── Toggle component ────────────────────────────────────────── */

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-muted mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={clsx(
          "relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer",
          checked ? "bg-gold" : "bg-border"
        )}
      >
        <span
          className={clsx(
            "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm",
            checked && "translate-x-5"
          )}
        />
      </button>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */

export default function EstablecimientoDetallePage() {
  const { t } = useTranslation("establecimientos");
  const { id } = useParams<{ id: string }>();
  const { data: est, isLoading } = useEstablecimiento(id ?? null);

  /* ── Local form state ──────────────────────────────── */
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zone, setZone] = useState("");
  const [slug, setSlug] = useState("");

  const [priceConexion, setPriceConexion] = useState("0");
  const [priceNominacion, setPriceNominacion] = useState("1000");
  const [pricePujaMin, setPricePujaMin] = useState("500");
  const [priceDedicatoria, setPriceDedicatoria] = useState("2000");

  const [modoMusica, setModoMusica] = useState(true);
  const [visibleMapa, setVisibleMapa] = useState(true);
  const [activo, setActivo] = useState(true);

  const [showDangerConfirm, setShowDangerConfirm] = useState(false);

  /* Sync form when data loads */
  const loaded = !!est;
  if (loaded && name === "" && est) {
    // Hydrate form once
    setTimeout(() => {
      setName(est.name);
      setDescription(est.description ?? "");
      setAddress(est.address);
      setCity(est.city);
      setZone("");
      setSlug(est.name.toLowerCase().replace(/\s+/g, "-"));
      setActivo(est.isActive);
    }, 0);
  }

  /* Fallback defaults */
  const displayName = name || "La Terraza Rooftop";
  const displaySlug = slug || "terraza-rooftop";

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton variant="card" className="h-64" />
        <Skeleton variant="card" className="h-48" />
      </div>
    );
  }

  const inputClass =
    "w-full bg-card-dark border border-border rounded-lg px-4 py-3 text-text-primary text-sm focus:border-gold outline-none placeholder-text-muted transition-colors";

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      {/* Back link */}
      <Link
        to="/anfitrion/establecimientos"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Establecimientos
      </Link>

      <PageHeader
        title={displayName}
        subtitle="Configuracion del establecimiento"
      />

      {/* ── INFORMACION BASICA ────────────────────────── */}
      <section className="bg-surface rounded-xl border border-border p-5 space-y-4">
        <span className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold">
          INFORMACION BASICA
        </span>

        <div>
          <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-1.5">
            NOMBRE
          </label>
          <input
            type="text"
            value={name || displayName}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-1.5">
            DESCRIPCION
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe tu establecimiento"
            className={clsx(inputClass, "resize-none")}
          />
        </div>

        <div>
          <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-1.5">
            DIRECCION
          </label>
          <input
            type="text"
            value={address || "Cra 7 #85-24"}
            onChange={(e) => setAddress(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-1.5">
              CIUDAD
            </label>
            <input
              type="text"
              value={city || "Bogota"}
              onChange={(e) => setCity(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-1.5">
              ZONA
            </label>
            <input
              type="text"
              value={zone || "Zona G"}
              onChange={(e) => setZone(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-1.5">
            SLUG (URL)
          </label>
          <div className="flex items-center">
            <span className="text-sm text-text-muted bg-card-dark border border-r-0 border-border rounded-l-lg px-3 py-3 shrink-0">
              vibrra.live/s/
            </span>
            <input
              type="text"
              value={slug || displaySlug}
              onChange={(e) => setSlug(e.target.value)}
              className={clsx(inputClass, "rounded-l-none")}
            />
          </div>
        </div>
      </section>

      {/* ── PRECIOS ───────────────────────────────────── */}
      <section className="bg-surface rounded-xl border border-border p-5 space-y-4">
        <span className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold">
          PRECIOS
        </span>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-1.5">
              CONEXION
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">
                $
              </span>
              <input
                type="number"
                value={priceConexion}
                onChange={(e) => setPriceConexion(e.target.value)}
                className={clsx(inputClass, "pl-7")}
              />
            </div>
            <p className="text-[10px] text-text-disabled mt-1">Default: $0</p>
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-1.5">
              NOMINACION
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">
                $
              </span>
              <input
                type="number"
                value={priceNominacion}
                onChange={(e) => setPriceNominacion(e.target.value)}
                className={clsx(inputClass, "pl-7")}
              />
            </div>
            <p className="text-[10px] text-text-disabled mt-1">Default: $1.000</p>
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-1.5">
              PUJA MINIMA
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">
                $
              </span>
              <input
                type="number"
                value={pricePujaMin}
                onChange={(e) => setPricePujaMin(e.target.value)}
                className={clsx(inputClass, "pl-7")}
              />
            </div>
            <p className="text-[10px] text-text-disabled mt-1">Default: $500</p>
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-1.5">
              DEDICATORIA
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">
                $
              </span>
              <input
                type="number"
                value={priceDedicatoria}
                onChange={(e) => setPriceDedicatoria(e.target.value)}
                className={clsx(inputClass, "pl-7")}
              />
            </div>
            <p className="text-[10px] text-text-disabled mt-1">Default: $2.000</p>
          </div>
        </div>
      </section>

      {/* ── CONFIGURACION ─────────────────────────────── */}
      <section className="bg-surface rounded-xl border border-border p-5">
        <span className="text-[9px] uppercase tracking-[2px] text-text-muted font-semibold block mb-2">
          CONFIGURACION
        </span>
        <div className="divide-y divide-border">
          <Toggle
            label="Modo musica"
            description="Permite a los usuarios pedir canciones durante la sesion"
            checked={modoMusica}
            onChange={setModoMusica}
          />
          <Toggle
            label="Visible en mapa"
            description="Muestra tu establecimiento en el mapa publico de VIBRRA"
            checked={visibleMapa}
            onChange={setVisibleMapa}
          />
          <Toggle
            label="Activo"
            description="Un establecimiento inactivo no puede abrir sesiones"
            checked={activo}
            onChange={setActivo}
          />
        </div>
      </section>

      {/* ── ZONA DE PELIGRO ───────────────────────────── */}
      <section className="border border-error/30 rounded-xl p-4">
        <span className="text-[9px] uppercase tracking-[2px] text-error font-semibold block mb-3">
          ZONA DE PELIGRO
        </span>
        <p className="text-sm text-text-secondary mb-3">
          Desactivar un establecimiento impedira abrir nuevas sesiones. Los datos historicos
          se conservaran.
        </p>
        {!showDangerConfirm ? (
          <Button variant="danger" onClick={() => setShowDangerConfirm(true)}>
            Desactivar establecimiento
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <Button variant="danger">
              Confirmar desactivacion
            </Button>
            <Button variant="ghost" onClick={() => setShowDangerConfirm(false)}>
              Cancelar
            </Button>
          </div>
        )}
      </section>

      {/* ── Sticky save button ────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-bg border-t border-border px-4 py-3 flex justify-end z-20">
        <div className="max-w-2xl mx-auto w-full">
          <Button className="w-full" size="lg">
            <Save className="w-5 h-5" />
            Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  );
}
