import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    // PGlite boots an in-memory PostgreSQL/WASM instance per fixture. Running
    // that integration matrix beside interaction-heavy UI suites can starve
    // jsdom timers and turn deterministic 5 s assertions into flaky timeouts.
    fileParallelism: false,
    setupFiles: ["./tests/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "src/tests/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      reporter: ["text", "html"],
      exclude: ["src/content/**", "src/app/**"],
    },
  },
});
