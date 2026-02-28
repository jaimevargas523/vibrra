import { useState } from "react";
import { Save, Check, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";

import { Button } from "@/components/ui/Button";
import { CityCombobox } from "@/components/ui/CityCombobox";
import { usePais } from "@/hooks/api/usePais";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { apiPut } from "@/lib/api-client";
import type { EstablecimientoDetail } from "@/hooks/api/useEstablecimiento";

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

/* ── Tab ─────────────────────────────────────────────────────── */

interface Props {
  establecimiento: EstablecimientoDetail;
}

export function TabConfiguracion({ establecimiento: est }: Props) {
  const { data: pais } = usePais();
  const fmt = useCurrencyFormatter();
  const queryClient = useQueryClient();
  const countryCode = pais?.code ?? "CO";

  /* ── Local form state ──────────────────────────────── */
  const [name, setName] = useState(est.name);
  const [description, setDescription] = useState(est.description ?? "");
  const [address, setAddress] = useState(est.address);
  const [city, setCity] = useState(est.city);
  const [departamento, setDepartamento] = useState(est.departamento ?? "");
  const [zona, setZona] = useState(est.zona ?? "");
  const [slug, setSlug] = useState(est.slug ?? (est.name ?? "").toLowerCase().replace(/\s+/g, "-"));

  const [precioConexion, setPrecioConexion] = useState(String(est.precioConexion ?? 0));
  const [precioNominacion, setPrecioNominacion] = useState(String(est.precioNominacion ?? 1000));
  const [precioPujaMin, setPrecioPujaMin] = useState(String(est.precioPujaMin ?? 500));
  const [precioDedicatoria, setPrecioDedicatoria] = useState(String(est.precioDedicatoria ?? 2000));

  const [modoMusica, setModoMusica] = useState(est.modoMusica ?? true);
  const [visibleMapa, setVisibleMapa] = useState(est.visibleMapa ?? true);
  const [activo, setActivo] = useState(est.isActive);

  const [saved, setSaved] = useState(false);

  /* ── Mutation ──────────────────────────────────────── */
  const mutation = useMutation({
    mutationFn: () =>
      apiPut(`/api/negocios/${est.id}`, {
        nombre: name,
        descripcion: description,
        direccion: address,
        ciudad: city,
        departamento,
        zona,
        slug,
        precio_conexion: Number(precioConexion) || 0,
        precio_nominacion: Number(precioNominacion) || 0,
        precio_puja_minima: Number(precioPujaMin) || 0,
        precio_dedicatoria: Number(precioDedicatoria) || 0,
        modo_musica: modoMusica,
        visible_mapa: visibleMapa,
        activo,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["establecimiento", est.id] });
      queryClient.invalidateQueries({ queryKey: ["establecimientos"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const symbol = pais?.moneda?.symbol ?? "$";

  const inputClass =
    "w-full bg-card-dark border border-border rounded-lg px-4 py-3 text-text-primary text-sm focus:border-gold outline-none placeholder-text-muted transition-colors";

  return (
    <div className="space-y-6 pb-24">
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
            value={name}
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
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-1.5">
              CIUDAD
            </label>
            <CityCombobox
              countryCode={countryCode}
              value={city}
              onChange={(c, dep) => {
                setCity(c);
                setDepartamento(dep);
              }}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-1.5">
              DEPARTAMENTO
            </label>
            <input
              type="text"
              value={departamento}
              readOnly
              className={clsx(inputClass, "text-text-muted cursor-default")}
            />
          </div>
        </div>

        <div>
          <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-1.5">
            ZONA
          </label>
          <input
            type="text"
            value={zona}
            onChange={(e) => setZona(e.target.value)}
            placeholder="Ej: Zona Rosa, Poblado, Centro"
            className={inputClass}
          />
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
              value={slug}
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
                {symbol}
              </span>
              <input
                type="number"
                value={precioConexion}
                onChange={(e) => setPrecioConexion(e.target.value)}
                className={clsx(inputClass, "pl-7")}
              />
            </div>
            <p className="text-[10px] text-text-disabled mt-1">Default: {fmt(0)}</p>
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-1.5">
              NOMINACION
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">
                {symbol}
              </span>
              <input
                type="number"
                value={precioNominacion}
                onChange={(e) => setPrecioNominacion(e.target.value)}
                className={clsx(inputClass, "pl-7")}
              />
            </div>
            <p className="text-[10px] text-text-disabled mt-1">Default: {fmt(1000)}</p>
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-1.5">
              PUJA MINIMA
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">
                {symbol}
              </span>
              <input
                type="number"
                value={precioPujaMin}
                onChange={(e) => setPrecioPujaMin(e.target.value)}
                className={clsx(inputClass, "pl-7")}
              />
            </div>
            <p className="text-[10px] text-text-disabled mt-1">Default: {fmt(500)}</p>
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-[1.5px] text-text-muted font-semibold block mb-1.5">
              DEDICATORIA
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">
                {symbol}
              </span>
              <input
                type="number"
                value={precioDedicatoria}
                onChange={(e) => setPrecioDedicatoria(e.target.value)}
                className={clsx(inputClass, "pl-7")}
              />
            </div>
            <p className="text-[10px] text-text-disabled mt-1">Default: {fmt(2000)}</p>
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

      {/* ── Error message ─────────────────────────────── */}
      {mutation.isError && (
        <div className="bg-error/10 border border-error/30 rounded-xl p-3 text-sm text-error">
          {mutation.error instanceof Error
            ? mutation.error.message
            : "Error al guardar cambios."}
        </div>
      )}

      {/* ── Sticky save button ────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-bg border-t border-border px-4 py-3 flex justify-end z-20">
        <div className="max-w-2xl mx-auto w-full">
          <Button
            className="w-full"
            size="lg"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : saved ? (
              <Check className="w-5 h-5" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saved ? "Guardado" : mutation.isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </div>
  );
}
