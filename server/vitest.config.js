import { defineConfig } from "vitest/config";
import dotenv from "dotenv";

const parsed = dotenv.config({ path: ".env.test" }).parsed || {};

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    pool: "forks",
    maxWorkers: 1,
    env: { ...parsed, NODE_ENV: "test" },
    globalSetup: "./tests/globalSetup.js",
    setupFiles: ["./tests/setup.js"],
    include: ["tests/**/*.test.js"],
    testTimeout: 20000,
    hookTimeout: 60000,
  },
});