"use client";

import { useCallback, useRef } from "react";

/**
 * Hook that enables Enter key to move focus to the next input within a form container.
 * On the last field, it calls the provided onSubmit callback.
 */
export function useEnterNavigation(onSubmit: () => void) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "Enter") return;
      // Don't intercept Enter on buttons or selects (they have their own behavior)
      const target = e.target as HTMLElement;
      if (target.tagName === "BUTTON" || target.tagName === "SELECT") return;

      e.preventDefault();

      const container = containerRef.current;
      if (!container) return;

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(
          'input:not([type="hidden"]):not([type="file"]):not(:disabled), select:not(:disabled)'
        )
      );

      const currentIndex = focusable.indexOf(target as HTMLElement);
      if (currentIndex < 0) return;

      if (currentIndex < focusable.length - 1) {
        focusable[currentIndex + 1].focus();
      } else {
        onSubmit();
      }
    },
    [onSubmit],
  );

  return { containerRef, handleKeyDown };
}
