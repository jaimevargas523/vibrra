"use client";

import { MOODS } from "./constants";

interface Props {
  selected: string;
  onSelect: (key: string) => void;
}

export function MoodSelector({ selected, onSelect }: Props) {
  return (
    <div className="scroll-rail">
      <div className="mood-rail" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 18px 4px" }}>
        {MOODS.map((m) => {
          const active = selected === m.key;
          return (
            <button
              key={m.key}
              className="mood-btn"
              onClick={() => onSelect(m.key)}
              style={{
                borderColor: active ? m.colorA : undefined,
                background: active ? `${m.colorA}15` : undefined,
                transform: active ? "scale(1.05)" : undefined,
              }}
            >
              <span style={{ fontSize: 22, lineHeight: 1 }}>{m.emoji}</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: active ? 800 : 700,
                  color: active ? m.colorA : undefined,
                  whiteSpace: "nowrap",
                }}
              >
                {m.nombre}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
