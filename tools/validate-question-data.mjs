#!/usr/bin/env node
/* Fail the release build when published question data has structural defects. */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "data", "published.json");
const errors = [];
const warnings = [];

function titleKey(value) {
  return String(value || "")
    .replace(/\s+/g, "")
    .replace(/[？?！!，,。．.；;：:、·\-—＿_（）()[\]【】"']/g, "")
    .toLowerCase();
}

if (!fs.existsSync(DATA)) {
  console.error("[FAIL] data/published.json is missing");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(DATA, "utf8"));
const categories = new Set((data.categories || []).map(c => Number(c.id)).filter(Number.isFinite));
const questions = Array.isArray(data.questions) ? data.questions : [];

if (!questions.length) errors.push("questions is empty");

const byTitle = new Map();
questions.forEach((q, index) => {
  const id = q && q.id;
  const title = q && String(q.title || "").trim();
  const answer = q && String(q.answer || "").trim();
  const body = q && String(q.body || "").trim();
  const where = `question #${index + 1}${id != null ? " (id " + id + ")" : ""}`;

  if (id == null || !Number.isFinite(Number(id))) errors.push(`${where}: missing numeric id`);
  if (!title) errors.push(`${where}: missing title`);
  else if (title.length < 5) errors.push(`${where}: title is shorter than 5 characters`);
  else if (title.length > 400) errors.push(`${where}: title is longer than 400 characters`);

  if (!answer) errors.push(`${where}: missing answer`);
  else if (answer.length < 30) errors.push(`${where}: answer is shorter than 30 characters`);

  const categoryId = q && Number(q.categoryId);
  if (!Number.isFinite(categoryId) || !categories.has(categoryId)) {
    errors.push(`${where}: categoryId ${q && q.categoryId} is not in categories`);
  }

  if (q && q.status && q.status !== "published") warnings.push(`${where}: status is ${q.status}`);
  if (q && !q.source) warnings.push(`${where}: source is empty`);
  if (q && q.updatedAt != null) {
    const validTime = typeof q.updatedAt === "number" ? Number.isFinite(q.updatedAt) : !Number.isNaN(Date.parse(q.updatedAt));
    if (!validTime) errors.push(`${where}: invalid updatedAt`);
  }

  if (((answer.match(/^```/gm) || []).length) % 2) errors.push(`${where}: unbalanced code fence in answer`);
  if (((body.match(/^```/gm) || []).length) % 2) errors.push(`${where}: unbalanced code fence in body`);

  if (title) {
    const key = titleKey(title);
    if (!key) return;
    if (!byTitle.has(key)) byTitle.set(key, []);
    byTitle.get(key).push({ id, title, index: index + 1 });
  }
});

for (const group of byTitle.values()) {
  if (group.length > 1) {
    const ids = group.map(x => x.id == null ? "#" + x.index : x.id).join(", ");
    errors.push(`duplicate title (ids ${ids}): ${group[0].title}`);
  }
}

if (warnings.length) {
  console.warn("[WARN] " + warnings.length + " non-blocking data findings");
  warnings.slice(0, 20).forEach(w => console.warn("  " + w));
}

if (errors.length) {
  console.error("[FAIL] " + errors.length + " data quality errors");
  errors.slice(0, 100).forEach(e => console.error("  " + e));
  process.exit(1);
}

console.log(`[OK] question data validated: ${questions.length} questions, ${categories.size} categories`);
