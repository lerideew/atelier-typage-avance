#!/usr/bin/env node
// Lance les quatre tests d'étape sur le exercice.ts courant et imprime la
// position du participant en une seule commande, ex : "1 ✅  2 ✅  3 🔴  4 🔴".
// Ne remplace pas `test:N`, qui garde le détail des erreurs tsc.

import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const bin = path.join(ROOT, "node_modules", "typescript", "bin", "tsc");

function passes(step) {
  try {
    execFileSync(process.execPath, [bin, "-p", `tests/etape-${step}.json`], {
      cwd: ROOT,
      stdio: "ignore"
    });
    return true;
  } catch {
    return false;
  }
}

const results = [1, 2, 3, 4].map((step) => `${step} ${passes(step) ? "✅" : "🔴"}`);
console.log(results.join("  "));
