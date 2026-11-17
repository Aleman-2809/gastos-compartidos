import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import "@testing-library/jest-dom/vitest";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/services/**", "src/components/**", "src/app/api/**"],
      exclude: [
        "src/lib/repositorio-firestore.ts",
        "src/lib/firebase-cliente.ts",
        "src/lib/firebase-admin.ts",
        "**/*.test.*",
      ],
      thresholds: { statements: 90, branches: 80, functions: 90, lines: 90 },
    },
  },
});
