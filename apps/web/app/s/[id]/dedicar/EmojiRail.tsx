"use client";

import { EMOJIS_RAPIDOS } from "./constants";

interface Props {
  onInsert: (emoji: string) => void;
}

export function EmojiRail({ onInsert }: Props) {
  return (
    <div className="scroll-rail">
      <div className="emoji-rail" style={{ display: "flex", gap: 6, overflowX: "auto", padding: "0 18px 4px" }}>
        {EMOJIS_RAPIDOS.map((emoji, i) => (
          <button key={i} className="emoji-btn" onClick={() => onInsert(emoji)}>
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
