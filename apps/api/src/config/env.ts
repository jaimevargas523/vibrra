import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z
    .string()
    .default("4000")
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().positive()),
  FIREBASE_SERVICE_ACCOUNT: z.string().min(2),
  FIREBASE_DATABASE_URL: z.string().url(),
});

function validateEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.warn(
      "Environment validation warnings (running with defaults where possible):",
      parsed.error.flatten().fieldErrors,
    );
    // Return sensible defaults so the server can start in dev / mock mode
    return {
      PORT: parseInt(process.env["PORT"] ?? "4000", 10),
      FIREBASE_SERVICE_ACCOUNT: process.env["FIREBASE_SERVICE_ACCOUNT"] ?? "{}",
      FIREBASE_DATABASE_URL:
        process.env["FIREBASE_DATABASE_URL"] ??
        "https://vibrra-6cd01-default-rtdb.firebaseio.com",
    };
  }
  return parsed.data;
}

export const env = validateEnv();
