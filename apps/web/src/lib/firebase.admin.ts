import "server-only";
import { cert, getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

function parseServiceAccountFromEnv() {
  const raw = process.env.FIREBASE_ADMIN_KEY_JSON || "";
  if (!raw.trim()) return null;

  try {
    const parsed = JSON.parse(raw);

    if (parsed.private_key && typeof parsed.private_key === "string") {
      parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
    }

    return parsed;
  } catch {
    throw new Error("FIREBASE_ADMIN_KEY_JSON geçersiz JSON.");
  }
}

export function initAdmin() {
  if (getApps().length) return getApps()[0];

  const projectId =
    process.env.GCLOUD_PROJECT ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "altincinew";

  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || "";
  const serviceAccount = parseServiceAccountFromEnv();

  // Local emulator
  if (emulatorHost) {
    return initializeApp({ projectId });
  }

  // Prod / gerçek servis hesabı
  if (serviceAccount) {
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id || projectId,
    });
  }

  // Cloud environments (App Hosting, Cloud Run, vs) fallback
  return initializeApp({
    credential: applicationDefault(),
    projectId: projectId,
  });
}

export function adminDb() {
  initAdmin();
  return getFirestore();
}

export function adminAuth() {
  initAdmin();
  return getAuth();
}

export function adminBucket() {
  initAdmin();
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  return getStorage().bucket(bucketName || undefined);
}
