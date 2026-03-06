"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "vibrra_fp";

export function useFingerprint() {
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setVisitorId(stored);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function generate() {
      const FingerprintJS = (await import("@fingerprintjs/fingerprintjs")).default;
      const fp = await FingerprintJS.load();
      const result = await fp.get();

      if (!cancelled) {
        localStorage.setItem(STORAGE_KEY, result.visitorId);
        setVisitorId(result.visitorId);
        setLoading(false);
      }
    }

    generate();
    return () => { cancelled = true; };
  }, []);

  return { visitorId, loading };
}
