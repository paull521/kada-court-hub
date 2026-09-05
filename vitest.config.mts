import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": root,
      // lib/ modules import "server-only" as a guardrail. It throws outside a
      // React Server Component, so tests alias it to a no-op. Component tests
      // opt into jsdom with a "@vitest-environment jsdom" docblock.
      "server-only": `${root}tests/support/server-only.ts`,
    },
  },
  test: {
    globals: true,
    include: ["tests/**/*.test.{ts,tsx}"],
    environment: "node",
    setupFiles: ["tests/support/setup.ts"],
    restoreMocks: true,
  },
});
