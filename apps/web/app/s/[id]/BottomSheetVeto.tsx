"use client";

import { Prohibit, X, WarningCircle } from "@phosphor-icons/react";

interface Props {
  cancion: { titulo: string; artista: string; imagen?: string };
  precioVeto: number;
  saldo: number;
  onConfirm: () => void;
  onClose: () => void;
}

export function BottomSheetVeto({ cancion, precioVeto, saldo, onConfirm, onClose }: Props) {
  const sinSaldo = precioVeto > saldo;

  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        {/* Handle */}
        <div style={handle} />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Prohibit size={20} weight="duotone" color="#E74C3C" />
            <span style={{ fontWeight: 700, fontSize: 15 }}>Vetar canción</span>
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

        {/* Warning */}
        <div style={warningBox}>
          <WarningCircle size={18} weight="duotone" color="#E74C3C" />
          <p style={{ fontSize: 12, color: "#CC9999", lineHeight: 1.5, flex: 1 }}>
            El veto elimina esta canción de la cola. Se necesitan varios vetos para que surta efecto. Esta acción no se puede deshacer.
          </p>
        </div>

        {/* Price */}
        <div style={priceBox}>
          <span style={{ fontSize: 12, color: "#9A9590" }}>Costo del veto</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: "#E74C3C", fontFamily: "var(--font-playfair), serif" }}>
            ${precioVeto.toLocaleString("es-CO")}
          </span>
        </div>

        {/* Saldo */}
        <p style={{ fontSize: 11, color: "#5A5A5A", textAlign: "center" as const, marginTop: 8 }}>
          Tu saldo: <span style={{ color: "#FFE566", fontWeight: 600 }}>${saldo.toLocaleString("es-CO")}</span>
        </p>

        {sinSaldo && (
          <p style={{ fontSize: 11, color: "#E74C3C", textAlign: "center" as const, marginTop: 6 }}>
            Saldo insuficiente
          </p>
        )}

        {/* Confirm */}
        <button
          disabled={sinSaldo}
          onClick={onConfirm}
          style={{
            ...confirmBtn,
            opacity: sinSaldo ? 0.4 : 1,
            cursor: sinSaldo ? "not-allowed" : "pointer",
          }}
        >
          <Prohibit size={16} weight="fill" />
          Confirmar veto — ${precioVeto.toLocaleString("es-CO")}
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

const warningBox: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "flex-start",
  padding: 12,
  background: "rgba(231,76,60,.06)",
  border: "1px solid rgba(231,76,60,.15)",
  borderRadius: 10,
  marginBottom: 16,
};

const priceBox: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 4,
  padding: 16,
  background: "rgba(255,255,255,.03)",
  borderRadius: 12,
};

const confirmBtn: React.CSSProperties = {
  width: "100%",
  marginTop: 16,
  padding: 14,
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(135deg, #E74C3C, #C0392B)",
  color: "#fff",
  fontFamily: "var(--font-montserrat), sans-serif",
  fontWeight: 700,
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
};
