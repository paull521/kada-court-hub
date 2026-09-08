import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

// Playwright does not read .env.local the way Next does. Node's own loader is
// enough and keeps the credentials in the one gitignored file they already
// live in; CI has no such file and reads the same names from GitHub secrets.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const PORT = 3001;

export default defineConfig({
  testDir: "tests/visual",
  // Vitest owns tests/**/*.test.ts. Visual specs are .spec.ts so the two
  // runners never pick up each other's files. The setup project names
  // auth.setup.ts itself - if it matched here too, mobile and desktop would
  // run it with a session already loaded and find no login form to fill.
  testMatch: /.*\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  outputDir: "test-results",

  // {platform} is not decoration. Font hinting and antialiasing differ
  // between macOS and the Linux CI runner, so a baseline shot on one will
  // never match the other. Keeping both sets side by side is the fix.
  snapshotPathTemplate: "tests/visual/__screenshots__/{projectName}-{platform}/{arg}{ext}",

  expect: {
    toHaveScreenshot: {
      // Antialiasing differs by a pixel here and there even on identical
      // renders. Fail on layout movement, not on a softened edge.
      threshold: 0.2,
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
      caret: "hide",
    },
  },

  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "off",
    video: "off",
  },

  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      // Below the 900px breakpoint: the phone layout in globals.css.
      // iPhone 13 for the viewport, but pinned to Chromium - the two projects
      // should differ by width alone, so a diff means the CSS moved and never
      // that WebKit and Chromium disagree.
      name: "mobile",
      use: {
        ...devices["iPhone 13"],
        browserName: "chromium",
        // The phone reports 3x, which is 9x the pixels and 9x the bytes in a
        // baseline that only has to show where the boxes are.
        deviceScaleFactor: 1,
        storageState: "tests/visual/.auth/user.json",
      },
      dependencies: ["setup"],
    },
    {
      // Above it: everything app/desktop.css adds.
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 900 },
        storageState: "tests/visual/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],

  // A production build, not the dev server: no dev indicator in the corner,
  // no HMR client, and the same output Vercel serves.
  webServer: {
    command: `npm run build && npx next start --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
