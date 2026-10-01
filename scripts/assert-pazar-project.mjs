import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const EXPECTED_PROJECT = "pazar-16c7b";
const FORBIDDEN_PROJECTS = new Set(["altincinew"]);

const root = resolve(import.meta.dirname, "..");
const rc = JSON.parse(readFileSync(resolve(root, ".firebaserc"), "utf8"));
const configuredProject = String(rc?.projects?.default || "").trim();
const selectedProject = String(
  process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.FIREBASE_PROJECT_ID ||
    configuredProject
).trim();

if (FORBIDDEN_PROJECTS.has(configuredProject) || FORBIDDEN_PROJECTS.has(selectedProject)) {
  console.error("Deploy engellendi: PAZAR projesi Altıncı Firebase projesini kullanamaz.");
  process.exit(1);
}

if (configuredProject !== EXPECTED_PROJECT || selectedProject !== EXPECTED_PROJECT) {
  console.error(
    `Deploy engellendi: beklenen Firebase projesi ${EXPECTED_PROJECT}, seçili proje ${selectedProject || "yok"}.`
  );
  process.exit(1);
}

console.log(`Firebase hedefi doğrulandı: ${EXPECTED_PROJECT}`);
