import {
  initializeApp,
  cert,
  getApps,
  type App,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

let app: App | undefined;

const DB_URL =
  process.env.FIREBASE_DATABASE_URL ||
  "https://vibrra-6cd01-default-rtdb.firebaseio.com";

function getApp(): App {
  if (app) return app;

  const existing = getApps();
  if (existing.length > 0) {
    app = existing[0]!;
    return app;
  }

  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (sa && sa.length > 2 && sa !== "{}") {
    try {
      const serviceAccount = JSON.parse(sa);
      app = initializeApp({
        credential: cert(serviceAccount),
        databaseURL: DB_URL,
      });
      return app;
    } catch {
      // Fall through to ADC
    }
  }

  // Production (App Hosting on Cloud Run): uses Application Default Credentials
  app = initializeApp({
    projectId: "vibrra-6cd01",
    databaseURL: DB_URL,
  });
  return app;
}

export function adminDb() {
  return getFirestore(getApp());
}

export function adminAuth() {
  return getAuth(getApp());
}
