#!/usr/bin/env node
/* Playwright regression for the five user-critical paths. */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}`;

async function importPlaywright() {
  try {
    const require = createRequire(import.meta.url);
    return require("playwright-core");
  } catch (e) {
    if (process.env.UI_REGRESSION_REQUIRED === "1") throw e;
    console.log("[SKIP] playwright-core is unavailable; set NODE_PATH to run this regression");
    return null;
  }
}

function startServer() {
  if (!fs.existsSync(path.join(DIST, "index.html"))) {
    console.error("[FAIL] dist/index.html is missing; run node tools/build-pages.mjs first");
    process.exit(1);
  }
  const child = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1", "--directory", DIST], {
    stdio: ["ignore", "pipe", "pipe"]
  });
  return new Promise((resolve, reject) => {
    const fail = () => reject(new Error("local HTTP server failed to start"));
    child.once("exit", fail);
    child.stderr.once("data", chunk => {
      if (String(chunk).includes("Serving HTTP")) {
        child.off("exit", fail);
        resolve(child);
      }
    });
    setTimeout(() => {
      child.off("exit", fail);
      resolve(child);
    }, 1200);
  });
}

async function expectVisible(page, selector, label) {
  try {
    await page.waitForSelector(selector, { state: "visible", timeout: 30000 });
    console.log("  ok   " + label);
  } catch (e) {
    throw new Error(label + " failed: " + selector + " is not visible");
  }
}

const playwright = await importPlaywright();
if (!playwright) process.exit(0);
const server = await startServer();
let browser;
let passed = 0;

try {
  browser = await playwright.chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  await context.route("**/*", route => {
    const url = new URL(route.request().url());
    if (url.origin === BASE) return route.continue();
    return route.abort();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  await page.goto(BASE + "/");
  await expectVisible(page, "#hero-search", "home search");
  try {
    await page.waitForSelector(".modal-mask", { timeout: 3000 });
    await page.getByRole("button", { name: "暂不设置" }).click();
  } catch (e) {}
  passed++;

  await page.goto(BASE + "/#/questions");
  await expectVisible(page, "#filter-toggle", "question filter toggle");
  try {
    await page.click("#filter-toggle", { timeout: 5000 });
  } catch (e) {
    await page.keyboard.press("Escape");
    await page.click("#filter-toggle");
  }
  await expectVisible(page, "#q-search", "question filters");
  const cards = await page.locator("#q-grid > *").count();
  if (!cards) throw new Error("question list has no cards");
  console.log("  ok   question list (" + cards + " cards)");
  passed++;

  await page.goto(BASE + "/#/roadmap");
  await page.waitForSelector("#main h1, #main h2", { timeout: 30000 });
  console.log("  ok   deferred roadmap route");
  passed++;

  await page.goto(BASE + "/#/quiz?n=5");
  await expectVisible(page, "#quiz-start", "quiz start");
  await page.click("#quiz-start");
  for (let i = 0; i < 5; i++) {
    await expectVisible(page, "#qans-input", "quiz answer " + (i + 1));
    await page.fill("#qans-input", "回归测试回答");
    await page.click("#qa");
    await expectVisible(page, "#qmark", "quiz self grading " + (i + 1));
    await page.click('#qmark button[data-m="bad"]');
    if (i < 4) await page.waitForSelector("#qans-input", { timeout: 30000 });
  }
  await expectVisible(page, "h1", "quiz result");
  passed++;

  await page.goto(BASE + "/#/review");
  await page.waitForSelector(".rv-card, .empty", { timeout: 30000 });
  console.log("  ok   review bank");
  passed++;

  await page.goto(BASE + "/#/question/1");
  await expectVisible(page, "#show-answer", "question deep link");
  passed++;

  await page.evaluate(() => {
    window.__testModal = U.modal({ title: "焦点回归", closable: true });
  });
  const focused = await page.evaluate(() => document.activeElement && document.activeElement.closest(".modal"));
  if (!focused) throw new Error("modal did not receive focus");
  await page.keyboard.press("Escape");
  const closed = await page.evaluate(() => !document.querySelector(".modal-mask"));
  if (!closed) throw new Error("modal Escape did not close");
  console.log("  ok   modal focus and Escape");
  passed++;

  console.log("UI_REGRESSION_OK: " + passed + "/7 passed");
} finally {
  if (browser) await browser.close().catch(() => {});
  server.kill("SIGTERM");
}
