#!/usr/bin/env node
// Rejoue la matrice de progression de l'atelier : copie chaque état de corrigé
// (départ, étape 1..4) sur `exercice.ts` dans une copie temporaire du projet,
// puis mesure `tsc`, les quatre tests, et la sortie de `node`.
//
// Sert à valider toute affirmation chiffrée de ANIMATION.md/ENONCE.md avant de
// l'écrire (nombre d'erreurs, couleur d'un test à telle étape). Ne modifie
// jamais le `exercice.ts` du dépôt : tout se joue dans un dossier temporaire.

import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync, copyFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const EXPECTED_OUTPUT = ["singleton : true", "transient : false", "Connected! { ok: true }"];

// état -> { check: nombre d'erreurs attendu, tests: couleur attendue par étape }
const STATES = [
  { label: "départ", source: "exercice.ts", check: 4, tests: [false, false, false, false] },
  { label: "étape 1", source: "corriges/etape-1.ts", check: 2, tests: [true, false, false, false] },
  { label: "étape 2", source: "corriges/etape-2.ts", check: 1, tests: [true, true, false, false] },
  { label: "étape 3", source: "corriges/etape-3.ts", check: 0, tests: [true, true, true, false] },
  { label: "étape 4", source: "corriges/etape-4.ts", check: 0, tests: [true, true, true, true] }
];

function countErrors(output) {
  return (output.match(/error TS\d+/g) || []).length;
}

function run(cwd, args) {
  try {
    const output = execFileSync(process.execPath, [...args], { cwd, encoding: "utf8" });
    return { ok: true, output };
  } catch (err) {
    return { ok: false, output: (err.stdout || "") + (err.stderr || "") };
  }
}

function runTsc(cwd, tscArgs) {
  const bin = path.join(ROOT, "node_modules", "typescript", "bin", "tsc");
  try {
    const output = execFileSync(process.execPath, [bin, ...tscArgs], { cwd, encoding: "utf8" });
    return { pass: true, output };
  } catch (err) {
    const output = (err.stdout || "") + (err.stderr || "");
    return { pass: false, output };
  }
}

function runNode(cwd, file) {
  try {
    const output = execFileSync(process.execPath, [file], { cwd, encoding: "utf8" });
    return output.trim().split("\n");
  } catch (err) {
    return [`ERREUR: ${err.message}`];
  }
}

const tmp = mkdtempSync(path.join(tmpdir(), "rtk-atelier-verify-"));
let failures = [];

try {
  // Copie du projet, sans node_modules (on réutilise celui du dépôt via un lien symbolique).
  cpSync(ROOT, tmp, {
    recursive: true,
    filter: (src) => !src.includes(`${path.sep}node_modules${path.sep}`) && !src.endsWith(`${path.sep}node_modules`)
  });
  cpSync(path.join(ROOT, "node_modules"), path.join(tmp, "node_modules"), { recursive: true });

  console.log("État        check  test:1  test:2  test:3  test:4  node");
  console.log("----------  -----  ------  ------  ------  ------  ----");

  for (const state of STATES) {
    copyFileSync(path.join(ROOT, state.source), path.join(tmp, "exercice.ts"));

    const checkResult = runTsc(tmp, []);
    const errCount = countErrors(checkResult.output);

    const testResults = [1, 2, 3, 4].map((n) => runTsc(tmp, ["-p", `tests/etape-${n}.json`]).pass);

    const nodeOutput = runNode(tmp, path.join(tmp, "exercice.ts"));
    const nodeOk = JSON.stringify(nodeOutput) === JSON.stringify(EXPECTED_OUTPUT);

    const row = [
      state.label.padEnd(10),
      String(errCount).padStart(5),
      ...testResults.map((r) => (r ? "🟢" : "🔴").padStart(6)),
      nodeOk ? "✅" : "❌"
    ];
    console.log(row.join("  "));

    if (errCount !== state.check) {
      failures.push(`[${state.label}] check attendu=${state.check} mesuré=${errCount}`);
    }
    testResults.forEach((r, i) => {
      if (r !== state.tests[i]) {
        failures.push(`[${state.label}] test:${i + 1} attendu=${state.tests[i]} mesuré=${r}`);
      }
    });
    if (!nodeOk) {
      failures.push(`[${state.label}] sortie node différente: ${JSON.stringify(nodeOutput)}`);
    }
  }

  // test:corrige doit toujours être à 0 erreur, indépendamment de exercice.ts.
  const corrigeResult = runTsc(tmp, ["-p", "tsconfig.corrige.json"]);
  console.log(`\ntest:corrige -> ${corrigeResult.pass ? "✅" : "❌"}`);
  if (!corrigeResult.pass) {
    failures.push(`test:corrige devrait passer sans erreur:\n${corrigeResult.output}`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error("\n❌ Écarts détectés par rapport à la matrice attendue :\n");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log("\n✅ La matrice de progression est conforme.");
