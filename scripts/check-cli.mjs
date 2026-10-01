// Runs the built command line as a person would: as a child process, on whatever system this is. `pnpm test:cli`
// builds first. The rules of the command line are tested as plain data in src/cli.test.ts; this is the part only a
// real process can show: the exit code, the two streams, standard input, the environment.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { checkAwase, generateAwase } from "../dist/awase-entry.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bin = join(root, "bin", "jarajara.mjs");
const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
// An environment with no language of its own, so each case says what it means.
const bare = { ...process.env, LC_ALL: "", LC_MESSAGES: "", LANG: "en_US.UTF-8" };

let failed = 0;
function check(what, args, want, { input, env } = {}) {
  const ran = spawnSync(process.execPath, [bin, ...args], { input, encoding: "utf8", env: { ...bare, ...env } });
  const got = { code: ran.status, out: ran.stdout, err: ran.stderr };
  const problems = [];
  if (want.code !== undefined && got.code !== want.code) problems.push(`exit code ${got.code}, wanted ${want.code}`);
  for (const stream of ["out", "err"]) {
    const wanted = want[stream];
    if (wanted === undefined) continue;
    const ok = wanted instanceof RegExp ? wanted.test(got[stream]) : got[stream] === wanted;
    if (!ok) problems.push(`${stream} was ${JSON.stringify(got[stream])}, wanted ${wanted instanceof RegExp ? wanted : JSON.stringify(wanted)}`);
  }
  if (problems.length > 0) failed += 1;
  console.log(`${problems.length === 0 ? "ok  " : "FAIL"} ${what}${problems.map((p) => `\n       ${p}`).join("")}`);
  return got;
}

const deal = generateAwase(9, "easy", 41);
check("the version", ["--version"], { code: 0, out: `${version}\n`, err: "" });
check("help", ["--help"], { code: 0, out: /^jarajara: mahjong tiles[^]*Usage: jarajara/, err: "" });
check("nothing asked for is the help", [], { code: 0, out: /Usage: jarajara/, err: "" });
check("the layouts", ["layouts"], { code: 0, out: /^ 4 {2}tiny {9}8 tiles, 3 layers\n[^]*15 {2}turtle {5}144 tiles, 5 layers\n/, err: "" });
check("a seeded deal", ["deal", "--layout", "4", "--seed", "7"], { code: 0, out: /^Tiny, 8 tiles, medium, seed 7, usual rule\n\nLayer 1\ns u F F\n[^]*Tiles: suFFmsum\nOne way to clear it: 0704000506010302\n$/, err: "" });
check("no seed: one is drawn and named on standard error", ["deal", "--layout", "4"], { code: 0, out: /^Tiny, 8 tiles/, err: /^jarajara: no seed given; drew \d+\.\n$/ });
const made = check("a deal as JSON", ["deal", "--layout", "9", "--level", "easy", "--seed", "41", "--json"], { code: 0, out: /^\{\n {2}"generator": "jarajara /, err: "" });
try {
  const data = JSON.parse(made.out);
  if (data.givens !== deal.givens || data.solution !== deal.solution || data.layers.length !== 5) throw new Error("not the deal the package makes");
  console.log("ok   the JSON parses, and is the deal the package makes");
} catch (error) {
  failed += 1;
  console.log(`FAIL the JSON parses: ${error.message}`);
}
check("the deal's own answer clears it", ["check", deal.solution, "--layout", "9", "--level", "easy", "--seed", "41"], { code: 0, out: /^Cleared: 50 pairs and \d+ shuffles take every tile\.\n$/, err: "" });
check("the answer on standard input, with Windows line endings", ["check", "--stdin", "--layout", "9", "--givens", deal.givens], { code: 0, out: /^Cleared: /, err: "" }, { input: `${deal.solution}\r\n` });
check("half an answer is exit code 1", ["check", deal.solution.slice(0, 40), "--layout", "9", "--givens", deal.givens], { code: 1, out: "", err: "Not cleared: tiles are left on the layout.\n" });
check("empty standard input is exit code 2", ["check", "--stdin", "--layout", "9", "--givens", deal.givens], { code: 2, out: "" }, { input: "" });
check("the day's game", ["daily", "--date", "2026-10-01"], { code: 0, out: /^2026-10-01: \w+, (easy|medium|hard), seed \d+, challenge \w+\njarajara deal --layout \d+ --level \w+ --seed \d+\n$/, err: "" });
check("a tile by name", ["tile", "east", "wind"], { code: 0, out: "B  east wind  東  Winds 1, 4 in the set, written 1z\n", err: "" });
check("a tile nobody has heard of is exit code 1", ["tile", "no", "such", "tile"], { code: 1, out: "", err: "jarajara: no tile is called that.\n" });
check("computers at a table", ["play", "--players", "3", "--layout", "8", "--seed", "5"], { code: 0, out: /^Awase at a table of 3: Torii, medium, seed 5\. 32 pairs taken, \d+ shuffles\.\nComputer 1: /, err: "" });
check("a wrong option is exit code 2", ["--bogus"], { code: 2, out: "", err: /^jarajara: no option called --bogus\.\nTry jarajara --help\.\n$/ });
check("a wrong command is exit code 2", ["shuffle"], { code: 2, out: "", err: /no command called shuffle/ });
check("Japanese by flag", ["layouts", "--lang", "ja"], { code: 0, out: /亀/ });
check("Japanese by LANG", ["--help"], { code: 0, out: /^jarajara：麻雀牌/ }, { env: { LANG: "ja_JP.UTF-8" } });
check("Japanese by LC_ALL over LANG", ["--bogus"], { code: 2, err: /^jarajara: --bogusというオプションはありません。\n/ }, { env: { LC_ALL: "ja_JP.UTF-8", LANG: "en_US.UTF-8" } });
check("English by flag over LANG", ["--help", "--lang", "en"], { code: 0, out: /^jarajara: mahjong/ }, { env: { LANG: "ja_JP.UTF-8" } });

if (checkAwase(9, deal.givens, deal.solution).ok !== true) failed += 1;
if (failed > 0) {
  console.log(`${failed} failed`);
  process.exit(1);
}
console.log("the command line does what it says, on", process.platform, process.version);
