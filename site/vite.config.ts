import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import { readProbe } from "./src/probe-script.ts";

// The Pages workflow sets SITE_BASE to "/optional". A local build uses the root.
const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
const base = env["SITE_BASE"] ? `${env["SITE_BASE"].replace(/\/$/, "")}/` : "/";
const pkg = JSON.parse(readFileSync(fileURLToPath(new URL("../package.json", import.meta.url)), "utf8")) as { version: string };

/** This plugin writes the probe of the site check to `dist/check-probe.js`, as JavaScript. */
function probe(): Plugin {
  return {
    name: "optional-probe",
    apply: "build",
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "check-probe.js", source: readProbe() });
    },
  };
}

// The site has one page: the playground, the laws and the API. The deploy adds `status/` and `releases/`.
export default defineConfig({
  base,
  plugins: [probe()],
  build: { target: "es2022" },
  define: {
    __BUILD__: JSON.stringify({ sha: (env["GITHUB_SHA"] ?? "local").slice(0, 7), date: new Date().toISOString().slice(0, 10), version: pkg.version }),
  },
});
