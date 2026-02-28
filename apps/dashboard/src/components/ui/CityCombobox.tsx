import { useState, useMemo, useRef, useEffect } from "react";
import { City, State } from "country-state-city";
import { MapPin } from "lucide-react";
import clsx from "clsx";

interface CityOption {
  name: string;
  stateCode: string;
  stateName: string;
  label: string; // "Medellin, Antioquia"
}

interface Props {
  countryCode: string;
  value: string;
  onChange: (city: string, state: string) => void;
  className?: string;
}

const MAX_RESULTS = 50;

export function CityCombobox({ countryCode, value, onChange, className }: Props) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build state lookup map
  const stateMap = useMemo(() => {
    const map = new Map<string, string>();
    const states = State.getStatesOfCountry(countryCode);
    for (const s of states) {
      map.set(s.isoCode, s.name);
    }
    return map;
  }, [countryCode]);

  // Build city options
  const allCities = useMemo<CityOption[]>(() => {
    const raw = City.getCitiesOfCountry(countryCode) ?? [];
    return raw.map((c) => {
      const stateName = stateMap.get(c.stateCode) ?? c.stateCode;
      return {
        name: c.name,
        stateCode: c.stateCode,
        stateName,
        label: `${c.name}, ${stateName}`,
      };
    });
  }, [countryCode, stateMap]);

  // Filter by query
  const filtered = useMemo(() => {
    if (!query.trim()) return allCities.slice(0, MAX_RESULTS);
    const q = query.toLowerCase();
    return allCities
      .filter((c) => c.label.toLowerCase().includes(q))
      .slice(0, MAX_RESULTS);
  }, [query, allCities]);

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar ciudad..."
          className={clsx(className, "pl-9")}
        />
      </div>

      {open && filtered.length > 0 && (
        <ul className="absolute z-30 w-full mt-1 max-h-56 overflow-y-auto rounded-lg border border-border bg-surface shadow-lg">
          {filtered.map((city) => (
            <li key={`${city.name}-${city.stateCode}`}>
              <button
                type="button"
                onClick={() => {
                  setQuery(city.name);
                  onChange(city.name, city.stateName);
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface-hover transition-colors cursor-pointer"
              >
                <span className="text-text-primary">{city.name}</span>
                <span className="text-text-muted ml-1.5 text-xs">{city.stateName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
