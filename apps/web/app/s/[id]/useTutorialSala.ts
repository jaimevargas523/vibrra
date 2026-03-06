"use client";

import { useState } from "react";

const TUTORIAL_KEY = "vibrra_tutorial_sala_vistas";
const MAX_VISTAS = 2;

/**
 * Retorna true si el tutorial debe mostrarse.
 * El tutorial se muestra máximo MAX_VISTAS veces y nunca más.
 */
export function debeMostrarTutorial(): boolean {
  if (typeof window === "undefined") return false;
  const vistas = parseInt(localStorage.getItem(TUTORIAL_KEY) ?? "0", 10);
  return vistas < MAX_VISTAS;
}

/**
 * Registra una vista del tutorial.
 * Debe llamarse cuando el tutorial se muestra al usuario.
 */
export function registrarVistaTutorial(): void {
  const vistas = parseInt(localStorage.getItem(TUTORIAL_KEY) ?? "0", 10);
  localStorage.setItem(TUTORIAL_KEY, String(vistas + 1));
}

/**
 * Controla la visibilidad del tutorial en la sala.
 * El tutorial se abre automáticamente si debeMostrarTutorial() = true.
 */
export function useTutorialSala() {
  const [mostrarTutorial, setMostrarTutorial] = useState(debeMostrarTutorial);

  const cerrarTutorial = () => setMostrarTutorial(false);

  return { mostrarTutorial, cerrarTutorial };
}
