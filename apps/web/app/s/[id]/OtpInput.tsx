"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface OtpInputProps {
  onComplete: (code: string) => void;
  onResend: () => void;
  disabled?: boolean;
  error?: string | null;
}

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;

export function OtpInput({ onComplete, onResend, disabled, error }: OtpInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // Focus first input on mount
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = useCallback((index: number, value: string) => {
    // Only accept single digit
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    if (digit && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (digit && index === CODE_LENGTH - 1) {
      const code = next.join("");
      if (code.length === CODE_LENGTH) {
        onComplete(code);
      }
    }
  }, [digits, onComplete]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      const code = digits.join("");
      if (code.length === CODE_LENGTH) {
        onComplete(code);
      }
    }
  }, [digits, onComplete]);

  // Paste support
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);
    if (pasted.length === CODE_LENGTH) {
      onComplete(pasted);
    } else {
      inputsRef.current[pasted.length]?.focus();
    }
  }, [digits, onComplete]);

  const handleResend = useCallback(() => {
    if (resendTimer > 0) return;
    setDigits(Array(CODE_LENGTH).fill(""));
    setResendTimer(RESEND_SECONDS);
    inputsRef.current[0]?.focus();
    onResend();
  }, [resendTimer, onResend]);

  return (
    <div className="otp-container">
      <div className="otp-boxes">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputsRef.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            className={`otp-box ${error ? "otp-box-error" : ""}`}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            disabled={disabled}
            autoComplete="one-time-code"
          />
        ))}
      </div>
      {error && <p className="otp-error">{error}</p>}
      <button
        className="otp-resend-btn"
        onClick={handleResend}
        disabled={resendTimer > 0 || disabled}
      >
        {resendTimer > 0
          ? `Reenviar codigo en ${resendTimer}s`
          : "Reenviar codigo"}
      </button>
    </div>
  );
}
