// Validate docs: load 4 direction files + docs-data.js, confirm window.DOCS assembles,
// order is correct, no skeletons inside the 4 real ones, and all chapters have terms.
global.window = {};
const path = require("path");
const fs = require("fs");

const base = path.join(__dirname, "..", "js", "docs");
const order = ["java", "network", "dba", "frontend"];
for (const id of order) require(path.join(base, id + ".js"));
require(path.join(__dirname, "..", "js", "docs-data.js"));

const DOCS = global.window.DOCS;
if (!DOCS) { console.log("FAIL: window.DOCS not set"); process.exit(1); }

const wantOrder = ["ops", "java", "network", "dba", "frontend", "devops", "security"];
const gotOrder = DOCS.dirs.map(d => d.id);
console.log("dir count:", DOCS.dirs.length);
console.log("order:", gotOrder.join(" -> "));

let ok = true;
if (gotOrder.join(",") !== wantOrder.join(",")) {
  console.log("WARN: order mismatch"); ok = false;
}

let totalCh = 0, skeletonInside = 0, missingTerms = 0;
for (const d of DOCS.dirs) {
  const isReal = order.includes(d.id);
  for (const lvl of d.levels || []) {
    for (const ch of lvl.chapters || []) {
      totalCh++;
      if (d.skeleton || ch.body === "" || ch.minutes === 0) {
        if (isReal) { skeletonInside++; }
        else continue; // skeletons expected for devops/security
      }
      if (isReal && (!Array.isArray(ch.terms) || ch.terms.length === 0)) missingTerms++;
    }
  }
}
console.log("total chapters:", totalCh);
console.log("real-dir empty chapters (should be 0):", skeletonInside);
console.log("real-dir chapters missing terms (should be 0):", missingTerms);

if (skeletonInside || missingTerms) ok = false;
// devops/security should remain skeletons
const devSkeleton = DOCS.dirs.find(d => d.id === "devops");
if (!devSkeleton || !devSkeleton.skeleton) { console.log("WARN: devops not skeleton"); ok = false; }

console.log(ok ? "ASSEMBLE_OK" : "ASSEMBLE_HAS_ISSUES");
process.exit(ok ? 0 : 1);
