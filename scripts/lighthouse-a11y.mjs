#!/usr/bin/env node
/**
 * Runs Lighthouse accessibility audits for both light and dark themes.
 * Builds and starts with DISABLE_AUTH=1 so middleware skips basic auth.
 *
 * Usage: node scripts/lighthouse-a11y.mjs
 */
import { execSync, spawn } from "child_process";
import puppeteer from "puppeteer";
import lighthouse from "lighthouse";

const SERVER_PORT = 3456;
const URL = `http://localhost:${SERVER_PORT}`;
const THEMES = ["light", "dark"];
const MIN_SCORE = 0.9;
const testEnv = { ...process.env, DISABLE_AUTH: "1" };

function buildAndStart() {
  console.log("Building with auth disabled...");
  execSync("npx next build", { cwd: process.cwd(), env: testEnv, stdio: "ignore" });

  return new Promise((resolve, reject) => {
    const proc = spawn("npx", ["next", "start", "-p", String(SERVER_PORT)], {
      cwd: process.cwd(),
      env: testEnv,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const onData = (d) => {
      if (d.toString().includes("Ready")) resolve(proc);
    };
    proc.stdout.on("data", onData);
    proc.stderr.on("data", onData);
    proc.on("error", reject);
    setTimeout(() => reject(new Error("Server start timeout")), 30000);
  });
}

async function auditTheme(browser, theme) {
  console.log(`\n━━━ Lighthouse accessibility: ${theme.toUpperCase()} theme ━━━\n`);

  // Pre-navigate to set theme in localStorage
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: "networkidle0" });
  await page.evaluate((t) => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(t);
    localStorage.setItem("theme", t);
  }, theme);
  await page.close();

  const wsEndpoint = browser.wsEndpoint();
  const debugPort = new globalThis.URL(wsEndpoint).port;

  const result = await lighthouse(URL, {
    port: Number(debugPort),
    onlyCategories: ["accessibility"],
    output: "json",
    logLevel: "error",
  });

  if (result.lhr.runtimeError) {
    throw new Error(result.lhr.runtimeError.message);
  }

  const score = result.lhr.categories.accessibility.score;
  const pct = Math.round(score * 100);

  console.log(`  Score: ${pct}%`);

  const audits = result.lhr.audits;
  const failing = Object.values(audits).filter(
    (a) => a.score !== null && a.score < 1 && a.details?.items?.length > 0
  );
  if (failing.length > 0) {
    console.log(`  Issues:`);
    for (const audit of failing) {
      console.log(`    - ${audit.id}: ${audit.title}`);
    }
  }

  if (score < MIN_SCORE) {
    throw new Error(`Scored ${pct}%, minimum is ${MIN_SCORE * 100}%`);
  }

  return score;
}

async function main() {
  const server = await buildAndStart();
  console.log("Server ready.");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox"],
  });

  let failed = false;
  for (const theme of THEMES) {
    try {
      await auditTheme(browser, theme);
      console.log(`  ✓ PASSED\n`);
    } catch (e) {
      console.error(`  ✗ FAILED: ${e.message}\n`);
      failed = true;
    }
  }

  await browser.close();
  server.kill();

  console.log(failed ? "\nSome tests failed." : "\nAll accessibility tests passed.");
  process.exit(failed ? 1 : 0);
}

main();
