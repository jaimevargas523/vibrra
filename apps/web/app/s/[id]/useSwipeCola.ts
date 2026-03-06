"use client";

import { useEffect, useRef, useCallback } from "react";

const THRESHOLD = 80;

interface UseSwipeColaParams {
  cancionId: string;
  onPujar: (cancionId: string) => void;
  onVetar: (cancionId: string) => void;
}

/**
 * Maneja el gesto de swipe horizontal sobre un ítem de la cola.
 * Compatible con touch (móvil) y mouse (desktop/preview).
 *
 * - Umbral de activación: 80px de desplazamiento horizontal
 * - Si el movimiento vertical supera al horizontal antes de 10px, cancela
 * - Al soltar sin llegar al umbral, la card regresa con animación spring
 * - Al superar el umbral derecho  → llama onPujar(cancionId)
 * - Al superar el umbral izquierdo → llama onVetar(cancionId)
 * - Durante el drag se aplica opacidad al fondo de reveal proporcional al dx
 */
export function useSwipeCola({ cancionId, onPujar, onVetar }: UseSwipeColaParams) {
  const itemRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const onPujarRef = useRef(onPujar);
  const onVetarRef = useRef(onVetar);
  onPujarRef.current = onPujar;
  onVetarRef.current = onVetar;

  useEffect(() => {
    const item = itemRef.current;
    if (!item) return;

    let startX = 0;
    let startY = 0;
    let dx = 0;
    let isDragging = false;

    const getReveals = () => ({
      left: wrapperRef.current?.querySelector<HTMLElement>(".swipe-reveal-left"),
      right: wrapperRef.current?.querySelector<HTMLElement>(".swipe-reveal-right"),
    });

    const onStart = (x: number, y: number) => {
      startX = x;
      startY = y;
      dx = 0;
      isDragging = true;
      item.classList.remove("snapping");
    };

    const onMove = (x: number, y: number) => {
      if (!isDragging) return;
      const diffX = x - startX;
      const diffY = y - startY;

      // Cancelar si el movimiento es más vertical que horizontal
      if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffX) < 10) {
        isDragging = false;
        return;
      }

      dx = diffX;
      item.style.transform = `translateX(${dx}px)`;

      const pct = Math.min(Math.abs(dx) / THRESHOLD, 1);
      const { left, right } = getReveals();

      if (dx > 0) {
        if (left) left.style.opacity = String(pct);
        if (right) right.style.opacity = "0";
      } else {
        if (right) right.style.opacity = String(pct);
        if (left) left.style.opacity = "0";
      }
    };

    const onEnd = () => {
      if (!isDragging) return;
      isDragging = false;

      // Animación spring de retorno
      item.classList.add("snapping");
      item.style.transform = "translateX(0)";

      const { left, right } = getReveals();
      if (left) left.style.opacity = "0";
      if (right) right.style.opacity = "0";

      if (dx > THRESHOLD) {
        onPujarRef.current(cancionId);
      } else if (dx < -THRESHOLD) {
        onVetarRef.current(cancionId);
      }

      dx = 0;
    };

    // Touch events
    const onTouchStart = (e: TouchEvent) => onStart(e.touches[0].clientX, e.touches[0].clientY);
    const onTouchMove = (e: TouchEvent) => onMove(e.touches[0].clientX, e.touches[0].clientY);

    item.addEventListener("touchstart", onTouchStart, { passive: true });
    item.addEventListener("touchmove", onTouchMove, { passive: true });
    item.addEventListener("touchend", onEnd);

    // Mouse events (para preview en desktop)
    const onMouseDown = (e: MouseEvent) => {
      onStart(e.clientX, e.clientY);
      const onMM = (e2: MouseEvent) => onMove(e2.clientX, e2.clientY);
      const onMU = () => {
        onEnd();
        document.removeEventListener("mousemove", onMM);
        document.removeEventListener("mouseup", onMU);
      };
      document.addEventListener("mousemove", onMM);
      document.addEventListener("mouseup", onMU);
    };

    item.addEventListener("mousedown", onMouseDown);

    return () => {
      item.removeEventListener("touchstart", onTouchStart);
      item.removeEventListener("touchmove", onTouchMove);
      item.removeEventListener("touchend", onEnd);
      item.removeEventListener("mousedown", onMouseDown);
    };
  }, [cancionId]);

  return { itemRef, wrapperRef };
}
