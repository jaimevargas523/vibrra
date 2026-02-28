"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "@/styles/animations.module.css";

interface RevealSectionProps {
  children: ReactNode;
  delay?: 0 | 1 | 2 | 3 | 4 | 5;
  className?: string;
  as?: "div" | "section";
}

export function RevealSection({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: RevealSectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add(styles.visible);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const delayClass = delay > 0 ? styles[`revealDelay${delay}`] : "";

  return (
    <Tag
      ref={ref}
      className={`${styles.reveal} ${delayClass} ${className ?? ""}`}
    >
      {children}
    </Tag>
  );
}
