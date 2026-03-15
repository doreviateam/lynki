import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Uniquement les tests unitaires dans tests/unit/
    include: ["tests/unit/**/*.test.ts"],
    exclude: ["tests/e2e/**", "node_modules/**"],
    environment: "node",
    globals: false,
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
