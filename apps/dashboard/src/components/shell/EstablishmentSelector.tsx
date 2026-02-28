import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useEstablishmentStore } from "@/stores/establishment.store";
import clsx from "clsx";

/** Simple emoji avatar derived from establishment type or name initial */
function getAvatar(name: string): string {
  const first = name.charAt(0).toUpperCase();
  const emojiMap: Record<string, string> = {
    B: "\uD83C\uDF7A", // bar
    R: "\uD83C\uDF7D\uFE0F", // restaurant
    D: "\uD83C\uDFB5", // disco
    C: "\u2615", // cafe
  };
  return emojiMap[first] ?? "\uD83C\uDFE2";
}

export function EstablishmentSelector() {
  const { selectedId, establishments, select, getSelected } =
    useEstablishmentStore();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = getSelected();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // If only one establishment, render non-interactive
  if (establishments.length <= 1) {
    return (
      <div className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="text-lg leading-none">
            {selected ? getAvatar(selected.name) : "\uD83C\uDFE2"}
          </span>
          <span className="text-sm font-medium text-text-primary truncate">
            {selected?.name ?? "Sin establecimiento"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative px-4 py-3">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg border transition-colors cursor-pointer",
          open
            ? "border-gold bg-gold-muted"
            : "border-border hover:border-border-light bg-transparent",
        )}
      >
        <span className="text-lg leading-none">
          {selected ? getAvatar(selected.name) : "\uD83C\uDFE2"}
        </span>
        <span className="text-sm font-medium text-text-primary truncate flex-1 text-left">
          {selected?.name ?? "Seleccionar"}
        </span>
        <ChevronDown
          className={clsx(
            "w-4 h-4 text-text-muted transition-transform shrink-0",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-4 right-4 top-full mt-1 bg-surface-elevated border border-border rounded-xl shadow-lg z-50 py-1 max-h-60 overflow-y-auto">
          {establishments.map((est) => (
            <button
              key={est.id}
              type="button"
              onClick={() => {
                select(est.id);
                setOpen(false);
              }}
              className={clsx(
                "flex items-center gap-2.5 w-full px-3 py-2.5 text-sm transition-colors text-left",
                est.id === selectedId
                  ? "text-gold bg-gold-muted"
                  : "text-text-secondary hover:bg-surface-hover hover:text-text-primary",
              )}
            >
              <span className="text-base leading-none">
                {getAvatar(est.name)}
              </span>
              <span className="truncate flex-1">{est.name}</span>
              {est.id === selectedId && (
                <Check className="w-4 h-4 text-gold shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
