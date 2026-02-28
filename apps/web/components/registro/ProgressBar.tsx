"use client";

import s from "@/styles/registro.module.css";

export function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = current >= total ? 100 : ((current + 1) / (total + 1)) * 100;
  return (
    <div className={s.progressBar}>
      <div className={s.progressFill} style={{ width: `${pct}%` }} />
    </div>
  );
}
