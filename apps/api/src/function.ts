import { onRequest } from "firebase-functions/v2/https";
import { initializeApp, getApps } from "firebase-admin/app";
import { app } from "./app.js";

if (getApps().length === 0) {
  initializeApp();
}

export const api = onRequest(
  { region: "us-central1", memory: "512MiB" },
  app,
);
