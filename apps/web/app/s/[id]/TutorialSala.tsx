"use client";

import { useEffect } from "react";
import { ArrowFatUp, Prohibit } from "@phosphor-icons/react";
import { debeMostrarTutorial, registrarVistaTutorial } from "./useTutorialSala";
import "./sala.css";

interface Props {
  onCerrar: () => void;
}

/**
 * Tutorial de entrada a la sala. Explica los gestos de swipe con
 * animaciones CSS — sin texto instruccional pesado.
 *
 * Reglas:
 *   - Se muestra máximo 2 veces en toda la vida del usuario
 *   - El conteo se persiste en localStorage (clave: vibrra_tutorial_sala_vistas)
 *   - Al montar, el conteo aumenta en 1
 *   - Si el usuario ya vio 2 veces, este componente no renderiza nada
 */
export function TutorialSala({ onCerrar }: Props) {
  // Guard: si ya vio suficientes veces, no renderizar
  if (!debeMostrarTutorial()) return null;

  // Registrar la vista cuando el componente se monta
  useEffect(() => {
    registrarVistaTutorial();
  }, []);

  return (
    <div className="tutorial-overlay" role="dialog" aria-modal="true" aria-label="Tutorial de gestos">
      <p className="tutorial-title">Cómo interactuar</p>
      <p className="tutorial-subtitle">Desliza las canciones para actuar</p>

      <div className="tutorial-gestures">
        {/* Swipe derecho = PUJAR */}
        <div className="gesture-row">
          <div className="gesture-demo bid-demo" aria-hidden="true">
            {/* Fondo dorado que aparece al deslizar */}
            <div className="swipe-bg left-reveal">
              <div className="reveal-label">
                <ArrowFatUp size={16} weight="fill" color="#080808" />
                <span>PUJAR</span>
              </div>
            </div>
            {/* Card animada que se desliza a la derecha */}
            <div className="gesture-card">
              <span className="gesture-card-emoji">🎸</span>
              <div className="gesture-card-info">
                <div className="gesture-card-title">Ojos Marrones</div>
                <div className="gesture-card-artist">Lasso</div>
              </div>
            </div>
          </div>
          <div className="gesture-label">
            <div className="gesture-label-title gold">→ Pujar</div>
            <div className="gesture-label-sub">Sube tu canción en la cola</div>
          </div>
        </div>

        {/* Swipe izquierdo = VETAR */}
        <div className="gesture-row">
          <div className="gesture-label" style={{ textAlign: "right" }}>
            <div className="gesture-label-title red">Vetar ←</div>
            <div className="gesture-label-sub">Bloquea la canción esta noche</div>
          </div>
          <div className="gesture-demo veto-demo" aria-hidden="true">
            {/* Fondo rojo que aparece al deslizar */}
            <div className="swipe-bg right-reveal">
              <div className="reveal-label">
                <Prohibit size={16} weight="fill" color="#fff" />
                <span>VETAR</span>
              </div>
            </div>
            {/* Card animada que se desliza a la izquierda */}
            <div className="gesture-card">
              <span className="gesture-card-emoji">🎤</span>
              <div className="gesture-card-info">
                <div className="gesture-card-title">top diesel</div>
                <div className="gesture-card-artist">Beélé</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button className="tutorial-btn" onClick={onCerrar}>
        ¡Entendido, a jugar!
      </button>
      <button className="tutorial-skip" onClick={onCerrar}>
        Saltar tutorial
      </button>
    </div>
  );
}
