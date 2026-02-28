"use client";

import { useEffect, useState } from "react";
import { fmtCOP } from "@/lib/calc";
import styles from "@/styles/hero.module.css";

interface HeroTeaserClientProps {
  eyebrow: string;
  headline: string;
  sub: string;
}

const TARGET = 1_176_000;
const STEPS = 60;
const INTERVAL_MS = 25;

export function HeroTeaserClient({
  eyebrow,
  headline,
  sub,
}: HeroTeaserClientProps) {
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / STEPS;
      const eased = 1 - Math.pow(1 - progress, 3);
      setAmount(Math.round(TARGET * eased));
      if (step >= STEPS) clearInterval(timer);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <a href="#calculadora" className={styles.calcTeaser}>
      <div className={styles.calcTeaserLeft}>
        <div className={styles.calcTeaserEyebrow}>{eyebrow}</div>
        <div className={styles.calcTeaserHeadline}>{headline}</div>
      </div>
      <div className={styles.calcTeaserPreview}>
        <div className={styles.calcTeaserAmount}>{fmtCOP(amount)}</div>
        <div className={styles.calcTeaserSub}>{sub}</div>
      </div>
      <div className={styles.calcTeaserArrow}>↓</div>
    </a>
  );
}
