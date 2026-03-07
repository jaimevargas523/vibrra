"use client";

import { useState, useRef, useCallback } from "react";

interface PhonePrefix {
  code: string;
  label: string;
}

interface PhoneInputProps {
  prefixes: PhonePrefix[];
  defaultPrefix: string;
  onSubmit: (fullNumber: string) => void;
  disabled?: boolean;
}

const PHONE_PREFIXES: PhonePrefix[] = [
  { code: "+57", label: "\u{1F1E8}\u{1F1F4} +57" },
  { code: "+1", label: "\u{1F1FA}\u{1F1F8} +1" },
  { code: "+52", label: "\u{1F1F2}\u{1F1FD} +52" },
  { code: "+55", label: "\u{1F1E7}\u{1F1F7} +55" },
  { code: "+34", label: "\u{1F1EA}\u{1F1F8} +34" },
  { code: "+51", label: "\u{1F1F5}\u{1F1EA} +51" },
  { code: "+56", label: "\u{1F1E8}\u{1F1F1} +56" },
  { code: "+54", label: "\u{1F1E6}\u{1F1F7} +54" },
  { code: "+593", label: "\u{1F1EA}\u{1F1E8} +593" },
  { code: "+507", label: "\u{1F1F5}\u{1F1E6} +507" },
  { code: "+58", label: "\u{1F1FB}\u{1F1EA} +58" },
  { code: "+506", label: "\u{1F1E8}\u{1F1F7} +506" },
  { code: "+502", label: "\u{1F1EC}\u{1F1F9} +502" },
  { code: "+591", label: "\u{1F1E7}\u{1F1F4} +591" },
  { code: "+595", label: "\u{1F1F5}\u{1F1FE} +595" },
  { code: "+598", label: "\u{1F1FA}\u{1F1FE} +598" },
  { code: "+503", label: "\u{1F1F8}\u{1F1FB} +503" },
  { code: "+504", label: "\u{1F1ED}\u{1F1F3} +504" },
  { code: "+505", label: "\u{1F1F3}\u{1F1EE} +505" },
];

export { PHONE_PREFIXES };

export function PhoneInput({ prefixes, defaultPrefix, onSubmit, disabled }: PhoneInputProps) {
  const [prefix, setPrefix] = useState(defaultPrefix);
  const [number, setNumber] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const digits = number.replace(/\D/g, "");
  const isValid = digits.length >= 7 && digits.length <= 15;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d\s]/g, "");
    setNumber(raw);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!isValid || disabled) return;
    onSubmit(`${prefix}${digits}`);
  }, [prefix, digits, isValid, disabled, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div className="phone-input-container">
      <div className="phone-input-row">
        <select
          className="phone-prefix-select"
          value={prefix}
          onChange={(e) => setPrefix(e.target.value)}
          disabled={disabled}
        >
          {prefixes.map((p) => (
            <option key={p.code} value={p.code}>
              {p.label}
            </option>
          ))}
        </select>
        <input
          ref={inputRef}
          type="tel"
          className="phone-number-input"
          placeholder="300 123 4567"
          value={number}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoFocus
          inputMode="tel"
          autoComplete="tel-national"
        />
      </div>
      <button
        className="phone-submit-btn"
        onClick={handleSubmit}
        disabled={!isValid || disabled}
      >
        {disabled ? (
          <span className="spin-icon" style={{ display: "inline-block" }}>&#9696;</span>
        ) : (
          "Enviar codigo"
        )}
      </button>
    </div>
  );
}
