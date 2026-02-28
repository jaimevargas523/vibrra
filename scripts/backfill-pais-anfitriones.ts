/**
 * Backfill script: Adds pais: "CO" to all Anfitriones documents that don't have it.
 *
 * Usage:
 *   npx tsx scripts/backfill-pais-anfitriones.ts
 *
 * Requires: apps/api/.env with FIREBASE_SERVICE_ACCOUNT
 */

import "dotenv/config";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { resolve } from "path";
import { config } from "dotenv";

// Load env from API .env
config({ path: resolve(__dirname, "../apps/api/.env") });

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

async function main() {
  console.log("Backfilling pais field on Anfitriones...");

  const snap = await db.collection("Anfitriones").get();
  let updated = 0;
  let skipped = 0;

  const batch = db.batch();

  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.pais) {
      skipped++;
      continue;
    }
    batch.update(doc.ref, { pais: "CO" });
    updated++;
  }

  if (updated > 0) {
    await batch.commit();
  }

  console.log(`Done! Updated: ${updated}, Skipped (already had pais): ${skipped}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
