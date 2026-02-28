import {
  initializeApp,
  cert,
  getApps,
  type App,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { env } from "./env.js";

let app: App | undefined;

function getApp(): App {
  if (app) return app;

  const existing = getApps();
  if (existing.length > 0) {
    app = existing[0]!;
    return app;
  }

  try {
    const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
    app = initializeApp({
      credential: cert(serviceAccount),
      databaseURL: env.FIREBASE_DATABASE_URL,
    });
  } catch {
    console.warn(
      "Firebase Admin: could not parse service account. Running in mock-only mode.",
    );
    app = initializeApp({ projectId: "vibrra-6cd01" });
  }

  return app;
}

/** Firestore instance. */
export function adminDb() {
  return getFirestore(getApp());
}

/** Firebase Auth instance. */
export function adminAuth() {
  return getAuth(getApp());
}
