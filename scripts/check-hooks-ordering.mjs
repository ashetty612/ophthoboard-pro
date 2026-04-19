#!/usr/bin/env node
/**
 * Backup review system: scans all client components for the specific pattern
 * that caused React error #310 — hooks called after a conditional `return`.
 *
 * This is a belt-and-braces check on top of ESLint's react-hooks/rules-of-hooks.
 * It is intentionally strict-but-shallow: it walks each component source file
 * and flags any `use*(` call that appears after a top-level `return (` or
 * `return <Tag ...>`. Run as part of CI / pre-push:
 *
 *   node scripts/check-hooks-ordering.mjs
 *
 * Exit code 1 on violation, 0 on success.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC_ROOT = join(__dirname, "..", "src");

const HOOK_CALL = /(?:^|[^A-Za-z0-9_.])use[A-Z][A-Za-z0-9_]*\s*\(/;
const HOOK_NAME = /(use[A-Z][A-Za-z0-9_]*)\s*\(/;
// Top-level JSX-ish early return inside a component body
const EARLY_RETURN = /^\s{2,}(if\s*\([^)]*\)\s*\{)?[\s]*return\s*(\(|<|[A-Z])/;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if ([".tsx", ".ts"].includes(extname(entry))) out.push(full);
  }
  return out;
}

function findComponentStart(lines) {
  // Find the default export function (single client component per file convention)
  for (let i = 0; i < lines.length; i++) {
    if (/^export\s+default\s+function\s+[A-Z]/.test(lines[i])) return i;
  }
  return -1;
}

function analyze(file) {
  const src = readFileSync(file, "utf8");
  if (!src.includes('"use client"') && !src.includes("'use client'")) return [];

  const lines = src.split("\n");
  const compStart = findComponentStart(lines);
  if (compStart < 0) return [];

  let braceDepth = 0;
  let inComponent = false;
  let sawEarlyReturn = false;
  let earlyReturnLine = -1;
  const violations = [];

  for (let i = compStart; i < lines.length; i++) {
    const line = lines[i];

    // Track entering/leaving the component's top-level function body
    for (const ch of line) {
      if (ch === "{") {
        braceDepth++;
        if (!inComponent) inComponent = true;
      } else if (ch === "}") {
        braceDepth--;
        if (braceDepth === 0 && inComponent) return violations; // end of component
      }
    }

    if (!inComponent || braceDepth !== 1) continue;
    // We're at the top level of the component body

    if (!sawEarlyReturn && EARLY_RETURN.test(line)) {
      sawEarlyReturn = true;
      earlyReturnLine = i + 1;
      continue;
    }

    if (sawEarlyReturn && HOOK_CALL.test(line)) {
      const hookName = line.match(HOOK_NAME)?.[1] || "use?";
      violations.push({
        file,
        line: i + 1,
        hook: hookName,
        code: line.trim().slice(0, 120),
        firstReturnLine: earlyReturnLine,
      });
    }
  }
  return violations;
}

const files = walk(SRC_ROOT);
const allViolations = [];
for (const f of files) {
  for (const v of analyze(f)) allViolations.push(v);
}

if (allViolations.length === 0) {
  console.log("✓ Hooks-ordering check passed (no hooks after early returns).");
  process.exit(0);
}

console.error("✗ Hooks-ordering violations found (React error #310 risk):\n");
for (const v of allViolations) {
  console.error(
    `  ${v.file.replace(SRC_ROOT + "/", "src/")}:${v.line}  ${v.hook}(...) called after return on line ${v.firstReturnLine}`
  );
  console.error(`    ${v.code}\n`);
}
console.error(
  "Fix: move all React hook calls to the top of the component, BEFORE any conditional `return`."
);
process.exit(1);
