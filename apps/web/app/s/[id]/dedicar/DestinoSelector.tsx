"use client";

import { DESTINOS, MOODS } from "./constants";

interface Props {
  selected: string;
  mood: string;
  aliasDestinatario: string;
  onSelect: (destino: string) => void;
  onAliasChange: (alias: string) => void;
}

export function DestinoSelector({ selected, mood, aliasDestinatario, onSelect, onAliasChange }: Props) {
  const m = MOODS.find((x) => x.key === mood) ?? MOODS[0];

  return (
    <div>
      <div style={{ display: "flex", gap: 8, padding: "0 18px" }}>
        {DESTINOS.map((d) => {
          const active = selected === d.key;
          return (
            <button
              key={d.key}
              className="dest-btn"
              onClick={() => onSelect(d.key)}
              style={{
                borderColor: active ? m.colorA : undefined,
                background: active ? `${m.colorA}12` : undefined,
                boxShadow: active ? `0 0 0 1px ${m.colorA}1F` : undefined,
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>{d.emoji}</span>
              <span
                style={{
                  fontFamily: "var(--font-syne), sans-serif",
                  fontSize: 10,
                  fontWeight: 700,
                  color: active ? m.colorA : "var(--soft)",
                  textAlign: "center",
                  lineHeight: 1.3,
                }}
              >
                {d.label}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-dm-mono), monospace",
                  fontSize: 10,
                  color: active ? "var(--gold-mid)" : "var(--muted)",
                }}
              >
                ${d.precio.toLocaleString("es-CO")}
              </span>
            </button>
          );
        })}
      </div>

      {/* Alias input (solo si destino == persona) */}
      {selected === "persona" && (
        <div className="alias-slide" style={{ padding: "10px 18px 0" }}>
          <input
            type="text"
            value={aliasDestinatario}
            onChange={(e) => onAliasChange(e.target.value)}
            placeholder="@alias de la persona"
            maxLength={30}
            className="msg-input"
            style={{ padding: "12px 14px", fontSize: 13, borderColor: `${m.colorA}40` }}
          />
        </div>
      )}
    </div>
  );
}
