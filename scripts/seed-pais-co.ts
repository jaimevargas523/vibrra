/**
 * Seed script: Creates the Paises/CO document in Firestore
 * with all current Colombian configuration values.
 *
 * Usage:
 *   npx tsx scripts/seed-pais-co.ts
 *
 * Requires: apps/api/.env with FIREBASE_SERVICE_ACCOUNT
 */

import "dotenv/config";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { resolve } from "path";
import { config } from "dotenv";
import type { PaisConfig } from "@vibrra/shared";

// Load env from API .env
config({ path: resolve(__dirname, "../apps/api/.env") });

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

const paisCO: PaisConfig = {
  code: "CO",
  nombre: "Colombia",
  activo: true,

  moneda: {
    code: "COP",
    symbol: "$",
    locale: "es-CO",
  },

  fiscal: {
    iva: 0.19,
    comisionPlataforma: 0.15,
  },

  suscripcion: {
    precioMensual: 49000,
    saldoMinimoPorEstablecimiento: 20000,
    bonoActivacion: 30000,
  },

  recarga: {
    montos: [
      { id: "minimo", valor: 2000, etiqueta: "Minimo" },
      { id: "basico", valor: 5000, etiqueta: "Basico" },
      { id: "estandar", valor: 10000, etiqueta: "Estandar" },
      { id: "noche", valor: 20000, etiqueta: "Noche" },
      { id: "vip", valor: 50000, etiqueta: "VIP" },
    ],
    modos: [
      { id: "pesimista", emoji: "\uD83D\uDE10", label: "Pesimista" },
      { id: "moderada", emoji: "\uD83D\uDE0A", label: "Moderada" },
      { id: "generosa", emoji: "\uD83E\uDD29", label: "Generosa" },
    ],
    tablaBonos: {
      minimo: {
        pesimista: { canciones: 1, conexiones: 0 },
        moderada: { canciones: 1, conexiones: 1 },
        generosa: { canciones: 2, conexiones: 1 },
      },
      basico: {
        pesimista: { canciones: 2, conexiones: 0 },
        moderada: { canciones: 2, conexiones: 1 },
        generosa: { canciones: 4, conexiones: 1 },
      },
      estandar: {
        pesimista: { canciones: 2, conexiones: 0 },
        moderada: { canciones: 3, conexiones: 1 },
        generosa: { canciones: 5, conexiones: 1 },
      },
      noche: {
        pesimista: { canciones: 3, conexiones: 0 },
        moderada: { canciones: 4, conexiones: 1 },
        generosa: { canciones: 6, conexiones: 2 },
      },
      vip: {
        pesimista: { canciones: 5, conexiones: 1 },
        moderada: { canciones: 8, conexiones: 2 },
        generosa: { canciones: 10, conexiones: 3 },
      },
    },
    costoExtraGenerosa: 332,
    minimoBloqueado: 20000,
  },

  recargaAnfitrion: {
    planes: [
      { amount: 30000, bonusPercent: 5, bonus: 1500, total: 31500 },
      { amount: 50000, bonusPercent: 8, bonus: 4000, total: 54000 },
      { amount: 100000, bonusPercent: 12, bonus: 12000, total: 112000, recommended: true },
      { amount: 200000, bonusPercent: 15, bonus: 30000, total: 230000 },
    ],
    pasarela: {
      nombre: "Wompi",
      proveedores: ["Bancolombia"],
      metodos: ["Tarjeta credito/debito", "PSE", "Nequi", "Efecty"],
    },
  },

  documentosEstablecimiento: [
    { key: "sayco", labelKey: "docs.sayco" },
    { key: "licencia", labelKey: "docs.licencia" },
    { key: "matricula", labelKey: "docs.matricula" },
    { key: "bomberos", labelKey: "docs.bomberos" },
  ],

  legal: {
    terminos: {
      url: "/legal/CO/vibrra-terminos.html",
      version: "1.0",
    },
    politicaDatos: {
      url: "/legal/CO/vibrra-politica-datos.html",
      version: "1.0",
    },
  },
};

async function main() {
  console.log("Seeding Paises/CO...");
  await db.collection("Paises").doc("CO").set(paisCO);
  console.log("Done! Paises/CO created successfully.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
