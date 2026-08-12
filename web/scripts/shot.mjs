import { chromium } from "playwright-core";
import { readdirSync } from "node:fs";
import { join } from "node:path";
function chromePath() {
  const base = "/opt/pw-browsers";
  const d = readdirSync(base).find((x) => /^chromium-\d+$/.test(x));
  return d ? join(base, d, "chrome-linux", "chrome") : undefined;
}
const OUT = process.argv[2];
const b = await chromium.launch({ headless: true, executablePath: chromePath() });
const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
await p.goto("http://127.0.0.1:3000/", { waitUntil: "networkidle" });
await p.screenshot({ path: `${OUT}/landing.png`, fullPage: true });
await b.close();
console.log("landing shot ok");
