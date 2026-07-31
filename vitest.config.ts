import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: [
      "src/**/*.test.{ts,tsx}",
      "src/tests/**/*.{test,spec}.{ts,tsx}",
    ],
    coverage: {
      reporter: ["text", "html"],
      exclude: ["src/content/**", "src/app/**"],
    },
  },
});
