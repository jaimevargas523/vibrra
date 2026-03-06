"use client";

import { useState } from "react";
import { ArrowFatUp, X, CurrencyDollar } from "@phosphor-icons/react";

interface Props {
  cancion: { titulo: string; artista: string; imagen?: string };
  saldo: number;
  onConfirm: (monto: number) => void;
  onClose: () => void;
}

const MONTOS = [500, 1000, 2000, 5000];

export function BottomSheetPuja({ cancion, saldo, onConfirm, onClose }: Props) {
  const [seleccionado, setSeleccionado] = useState<number | null>(null);

  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        {/* Handle */}
        <div style={handle} />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ArrowFatUp size={20} weight="duotone" color="#FFE566" />
            <span style={{ fontWeight: 700, fontSize: 15 }}>Pujar por esta canción</span>
          </div>
          <button onClick={onClose} style={closeBtn}>
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Song preview */}
        <div style={songPreview}>
          {cancion.imagen && (
            <img src={cancion.imagen} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" as const }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{cancion.titulo}</p>
            <p style={{ fontSize: 11, color: "#777" }}>{cancion.artista}</p>
          </div>
        </div>

        {/* Info */}
        <p style={{ fontSize: 11, color: "#9A9590", marginBottom: 16, lineHeight: 1.5 }}>
          Las pujas son a ciegas. No sabrás cuánto pujaron otros.
          Mientras más pujes, más chances de subir en la cola.
        </p>

        {/* Price grid */}
        <div style={priceGrid}>
          {MONTOS.map((monto) => {
            const activo = seleccionado === monto;
            const sinSaldo = monto > saldo;
            return (
              <button
                key={monto}
                disabled={sinSaldo}
                onClick={() => setSeleccionado(monto)}
                style={{
                  ...priceChip,
                  ...(activo ? priceChipActivo : {}),
                  ...(sinSaldo ? { opacity: 0.3, cursor: "not-allowed" } : {}),
                }}
              >
                <CurrencyDollar size={14} weight="duotone" color={activo ? "#080808" : "#9A9590"} />
                <span>${monto.toLocaleString("es-CO")}</span>
              </button>
            );
          })}
        </div>

        {/* Saldo */}
        <p style={{ fontSize: 11, color: "#5A5A5A", textAlign: "center" as const, marginTop: 12 }}>
          Tu saldo: <span style={{ color: "#FFE566", fontWeight: 600 }}>${saldo.toLocaleString("es-CO")}</span>
        </p>

        {/* Confirm */}
        <button
          disabled={!seleccionado}
          onClick={() => seleccionado && onConfirm(seleccionado)}
          style={{
            ...confirmBtn,
            opacity: seleccionado ? 1 : 0.4,
            cursor: seleccionado ? "pointer" : "not-allowed",
          }}
        >
          <ArrowFatUp size={16} weight="fill" />
          Pujar {seleccionado ? `$${seleccionado.toLocaleString("es-CO")}` : ""}
        </button>
      </div>
    </div>
  );
}

// ── Styles ──

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.6)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  zIndex: 200,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
};

const sheet: React.CSSProperties = {
  width: "100%",
  maxWidth: 430,
  background: "#141414",
  borderRadius: "20px 20px 0 0",
  border: "1px solid rgba(255,255,255,.06)",
  borderBottom: "none",
  padding: "12px 20px calc(20px + env(safe-area-inset-bottom))",
  fontFamily: "var(--font-montserrat), sans-serif",
  color: "#F0EDE8",
};

const handle: React.CSSProperties = {
  width: 36,
  height: 4,
  borderRadius: 2,
  background: "#333",
  margin: "0 auto 16px",
};

const closeBtn: React.CSSProperties = {
  background: "rgba(255,255,255,.06)",
  border: "none",
  borderRadius: 8,
  padding: 6,
  color: "#777",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
};

const songPreview: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  padding: 12,
  background: "rgba(255,255,255,.03)",
  borderRadius: 12,
  marginBottom: 14,
};

const priceGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 8,
};

const priceChip: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "12px 0",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,.08)",
  background: "rgba(255,255,255,.03)",
  color: "#9A9590",
  fontFamily: "var(--font-montserrat), sans-serif",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  transition: "all .15s",
};

const priceChipActivo: React.CSSProperties = {
  background: "linear-gradient(135deg, #FFE566, #D4A017)",
  border: "1px solid #D4A017",
  color: "#080808",
  boxShadow: "0 2px 12px rgba(212,160,23,.3)",
};

const confirmBtn: React.CSSProperties = {
  width: "100%",
  marginTop: 16,
  padding: 14,
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(135deg, #FFE566, #D4A017)",
  color: "#080808",
  fontFamily: "var(--font-montserrat), sans-serif",
  fontWeight: 700,
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
};
