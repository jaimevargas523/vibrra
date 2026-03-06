"use client";

import { PLANTILLAS } from "./constants";

interface Props {
  onSelect: (texto: string) => void;
}

export function PlantillasRail({ onSelect }: Props) {
  return (
    <div className="scroll-rail">
      <div className="tpl-rail" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 18px 4px" }}>
        {PLANTILLAS.map((texto, i) => (
          <button key={i} className="tpl-card" onClick={() => onSelect(texto)}>
            <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, color: "var(--soft)", lineHeight: 1.4 }}>
              {texto}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
