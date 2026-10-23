import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";

// Resolve the project root as a POSIX-style path with a trailing slash so the
// "@/" alias replacement produces valid module ids on every platform.
const root = fileURLToPath(new URL(".", import.meta.url)).replace(/\\/g, "/");

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["__tests__/**/*.test.ts"],
  },
  resolve: {
    alias: [
      // Longest-prefix first: "@/" maps to the project root.
      { find: /^@\//, replacement: root },
    ],
  },
});
