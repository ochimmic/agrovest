#!/usr/bin/env node
/**
 * Simple static contrast / dark-mode regression check.
 *
 * Scans src/ for patterns that have historically caused dark-mode
 * contrast bugs. Exits non-zero with a report when any are found.
 *
 * Add new rules here as new patterns are discovered.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");

// Files to skip (generated, ui primitives we don't author, the design tokens
// file itself which legitimately mentions raw colors).
const IGNORE = [
  "src/routeTree.gen.ts",
  "src/styles.css",
  "src/components/ui/", // shadcn primitives — semantic tokens already
];

// Rules target *regression* patterns proven to break dark mode in this
// codebase. Keep them precise — broad heuristics produce noise because
// many `text-white`/`bg-white` usages are intentional inside dark
// gradient hero containers.
const RULES = [
  {
    id: "hsl-var-token",
    message:
      "`hsl(var(--token))` does not work — design tokens are defined in oklch. Use `var(--color-<token>)` instead.",
    test: (line) => /hsl\(\s*var\(--/.test(line),
  },
  {
    id: "navy-on-white-text",
    message:
      "`bg-navy` + `text-white` (or `bg-primary` + `text-white`) breaks in dark mode — `--navy` remaps to a light color, leaving white-on-white. Use `text-primary-foreground`.",
    test: (line) =>
      /\b(bg-navy|bg-primary)\b/.test(line) && /\btext-white\b/.test(line),
  },
  {
    id: "text-navy-on-dark-surface",
    message:
      "`text-navy` on a fixed-dark surface (bg-navy / bg-graphite / gradient-navy / from-navy) collapses to light-on-light in dark mode. Use a literal dark color like `text-[oklch(0.27_0.07_268)]` or `text-primary-foreground`.",
    test: (line) =>
      /\btext-navy\b/.test(line) &&
      /(bg-navy|bg-graphite|gradient-navy|from-navy|from-\[oklch\(0\.2)/.test(
        line,
      ),
  },
  {
    id: "hardcoded-black-text",
    message:
      "Hardcoded `text-black` — invisible on dark mode. Use `text-foreground`.",
    test: (line) => /\btext-black\b/.test(line),
  },
  {
    id: "arbitrary-gray-text",
    message:
      "Arbitrary gray text utility (text-gray-* / text-slate-* / text-zinc-* / text-neutral-* / text-stone-*) — use `text-muted-foreground` or `text-foreground` so dark mode adapts.",
    test: (line) =>
      /\btext-(gray|slate|zinc|neutral|stone)-(300|400|500|600|700|800|900)\b/.test(
        line,
      ),
  },
  {
    id: "muted-foreground-low-opacity",
    message:
      "`text-muted-foreground/<50` is below WCAG AA on most surfaces. Use `text-muted-foreground` directly.",
    test: (line) =>
      /text-muted-foreground\/(?:[0-4]?\d)(?!\d)/.test(line),
  },
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const rel = relative(ROOT, p);
    if (IGNORE.some((i) => rel === i || rel.startsWith(i))) continue;
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (/\.(tsx?|css)$/.test(name)) out.push(p);
  }
  return out;
}

const findings = [];
for (const file of walk(SRC)) {
  const text = readFileSync(file, "utf8");
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    // strip line comments to reduce false positives
    const stripped = line.replace(/\/\/.*$/, "");
    for (const rule of RULES) {
      if (rule.test(stripped)) {
        findings.push({
          file: relative(ROOT, file),
          line: i + 1,
          rule: rule.id,
          message: rule.message,
          snippet: line.trim().slice(0, 140),
        });
      }
    }
  });
}

if (findings.length === 0) {
  console.log("✓ contrast-check: no dark-mode contrast issues found");
  process.exit(0);
}

const byRule = findings.reduce((acc, f) => {
  (acc[f.rule] ||= []).push(f);
  return acc;
}, {});

console.error(`✗ contrast-check: ${findings.length} potential issue(s)\n`);
for (const [rule, items] of Object.entries(byRule)) {
  console.error(`[${rule}] — ${items[0].message}`);
  for (const f of items) {
    console.error(`  ${f.file}:${f.line}  ${f.snippet}`);
  }
  console.error("");
}
process.exit(1);
