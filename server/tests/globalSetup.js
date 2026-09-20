import { execSync } from "node:child_process";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.join(dir, "..");

export default function setup() {
  dotenv.config({ path: path.join(serverRoot, ".env.test"), override: true });

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "Missing DATABASE_URL for tests. Copy server/.env.test.example to server/.env.test."
    );
  }
  if (/pannypal(?!_test)/.test(process.env.DATABASE_URL)) {
    throw new Error(
      "Test setup refuses to run against the local dev database. Point DATABASE_URL at a dedicated test database."
    );
  }

  execSync(
    "node_modules/.bin/prisma db push --skip-generate --accept-data-loss",
    {
      cwd: serverRoot,
      env: process.env,
      stdio: "inherit",
    }
  );
}