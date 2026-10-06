// The documents and the demo, held to the source. Plain JavaScript, so that reading files needs no Node types.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import process from "node:process";

import { describe, expect, it } from "vitest";

import { AWASE_SAME_BLOCK, SEED_MOST } from "./awase.ts";
import { AWASE_CHALLENGES, AWASE_CHALLENGE_NUMBERS } from "./challenge.ts";
import { CLI_STRINGS, LAYOUT_NAMES_JA } from "./cliWords.ts";
import { runCli } from "./cli.ts";
import { JarajaraGroup, JarajaraLayout, JarajaraRack, JarajaraSet, JarajaraTable, JarajaraTile, JarajaraViewer, MOST_SOUNDING } from "./element.ts";
import { JARAJARA_CLOTHS } from "./cloth.ts";
import { ALL_LAYOUTS } from "./layouts.ts";
import { copiesOf, setInventory } from "./names.ts";
import { AWASE_TABLE } from "./table.ts";
import { MAHJONG_FACES } from "./tiles.ts";
import { MOST_SOUNDS_AT_ONCE } from "./tile-sounds.ts";
import { STRINGS } from "./ui/strings.ts";
import { VERSION } from "./version.ts";
import * as everything from "./index.ts";
import * as awaseEntry from "./awase-entry.ts";
import * as tableEntry from "./table-entry.ts";
import * as facesEntry from "./faces-entry.ts";
import * as elementEntry from "./element.ts";
import * as tileSoundsEntry from "./tile-sounds.ts";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const readme = readFileSync("README.md", "utf8");
// What would make the README too long for npm is in pages under docs/, linked from it: the tags' tables and the command line's reference.
const elementsDoc = readFileSync("docs/ELEMENTS.md", "utf8");
const commandLineDoc = readFileSync("docs/COMMAND-LINE.md", "utf8");

/** A README section's text, from its heading (of the level given) to the next heading of the same or a higher level. */
const section = (heading, level = 2, text = readme) => {
  const mark = "#".repeat(level);
  const from = text.indexOf(`\n${mark} ${heading}\n`);
  if (from < 0) throw new Error(`no “${mark} ${heading}” in the text`);
  const after = text.slice(from + 5);
  const next = after.search(new RegExp(`\\n#{1,${level}} `));
  return text.slice(from, next < 0 ? undefined : from + 5 + next);
};

/** The cells of every table row in a piece of text, header and rule rows left out. */
const rows = (text) =>
  text
    .split("\n")
    .filter((line) => line.startsWith("|") && !/^\|[\s|:-]+\|$/.test(line))
    .map((line) => line.split(/(?<!\\)\|/).slice(1, -1).map((cell) => cell.replace(/\\\|/g, "|").trim()));

/** Every file under a folder whose name ends as given. */
const filesUnder = (folder, ending) => readdirSync(folder, { recursive: true }).filter((path) => String(path).endsWith(ending)).map((path) => `${folder}/${path}`);

describe("the documents", () => {
  it("say the version package.json says, in the code and at the top of the changelog", () => {
    expect(VERSION).toBe(pkg.version);
    expect(readFileSync("CHANGELOG.md", "utf8")).toMatch(new RegExp(`^## \\[${pkg.version.replace(/\./g, "\\.")}\\] - \\d{4}-\\d{2}-\\d{2}$`, "m"));
    expect(readFileSync("CHANGELOG.md", "utf8")).toContain("## [Unreleased]");
  });

  it("name in the README every entry package.json exports, and no other", () => {
    const exported = Object.keys(pkg.exports).filter((key) => key !== ".").map((key) => `${pkg.name}/${key.slice(2)}`);
    for (const entry of exported) expect(readme, entry).toContain(`\`${entry}\``);
    for (const named of readme.matchAll(/`(@johnmorrisdotca\/jarajara\/[\w/-]+)`/g)) expect(exported, named[1]).toContain(named[1]);
  });

  it("name in the README's API table only names that an entry exports", () => {
    const names = new Set([...Object.keys(everything), ...Object.keys(awaseEntry), ...Object.keys(tableEntry), ...Object.keys(facesEntry), ...Object.keys(elementEntry), ...Object.keys(tileSoundsEntry)]);
    // The recordings and the designs are entries of their own that a test would have to load whole; they are named in the table by what they hold.
    const outside = new Set(["TILE_SOUND_DATA", "RIICHI", "RIICHI_BLACK"]);
    for (const row of rows(section("API")).slice(1)) {
      for (const match of row[1].matchAll(/`([A-Za-z_][\w]*)(?:\(|`)/g)) expect(names.has(match[1]) || outside.has(match[1]), match[1]).toBe(true);
    }
  });

  it("name in the README every tag, and every attribute of every tag, in a table of its own", () => {
    const tags = { "jarajara-tile": [JarajaraTile, "<jarajara-tile>"], "jarajara-rack": [JarajaraRack, "<jarajara-rack>"], "jarajara-layout": [JarajaraLayout, "<jarajara-layout>"], "jarajara-table": [JarajaraTable, "<jarajara-table>"] };
    const define = readFileSync("src/element-define.ts", "utf8");
    for (const tag of ["tile", "rack", "layout", "table", "viewer", "group", "set"]) {
      expect(define, tag).toContain(`jarajara-${tag}`);
      expect(readme, tag).toContain(`\`<jarajara-${tag}`);
    }
    for (const [, [element, heading]] of Object.entries(tags)) {
      const cells = rows(section(`\`${heading}\``, 2, elementsDoc)).map((row) => row[0]);
      for (const attribute of element.observedAttributes) expect(cells.join(" "), `${heading} ${attribute}`).toMatch(new RegExp(`\`${attribute}\``));
    }
    const shared = rows(section("`<jarajara-viewer>`, `<jarajara-group>` and `<jarajara-set>`", 2, elementsDoc));
    for (const [name, element] of [["viewer", JarajaraViewer], ["group", JarajaraGroup], ["set", JarajaraSet]]) {
      for (const attribute of element.observedAttributes) {
        const row = shared.find((cells) => cells[0].split(/,\s*/).includes(`\`${attribute}\``) && (cells[1].includes(name) || cells[1] === "all three"));
        expect(row, `${name} ${attribute}`).toBeDefined();
      }
    }
  });

  it("make an attribute that is also a method or a read-only value settable, so React, Vue and Svelte can set it", () => {
    for (const [element, names] of [[JarajaraTile, ["flip"]], [JarajaraRack, ["group", "mark", "tiles", "lifted"]], [JarajaraLayout, ["undo", "seed", "cells", "mirror"]]]) {
      for (const name of names) expect(Object.getOwnPropertyDescriptor(element.prototype, name)?.set, `${element.name}.${name}`).toBeTypeOf("function");
    }
  });

  it("list the layouts, their tiles and layers, the faces, and the challenges", () => {
    const table = rows(section("The layouts"));
    for (const layout of ALL_LAYOUTS) {
      const row = table.find((cells) => cells[0] === String(layout.size));
      expect(row, layout.key).toBeDefined();
      expect(row[1].toLowerCase(), layout.key).toBe(layout.key);
      expect(row[2], layout.key).toBe(String(layout.slots.length));
      expect(row[3], layout.key).toBe(String(Math.max(...layout.slots.map((slot) => slot.z)) + 1));
    }
    expect(table.length - 1).toBe(ALL_LAYOUTS.length);
    expect(readme).toContain(`${MAHJONG_FACES.length} tiles in ${MAHJONG_FACES.length === 42 ? "42" : "?"} faces`.replace(/^\d+/, "144"));
    for (const challenge of AWASE_CHALLENGES) expect(rows(section("Options and challenges", 3)).some((cells) => cells[0] === `\`${challenge}\``), challenge).toBe(true);
    const challenges = section("Options and challenges", 3);
    const n = AWASE_CHALLENGE_NUMBERS;
    expect(challenges).toContain(`${n.sparkMsPerTile / 1000} s a tile`);
    expect(challenges).toContain(`adds ${n.sparkBonusMs / 1000} s`);
    expect(challenges).toContain(`(${n.rushPairs}, fewer on a small layout) in three minutes`);
    expect(n.rushMs).toBe(180_000);
    expect(challenges).toContain(`Start with ${n.sandStartMs / 1000} s, every pair adds ${n.sandPairMs / 1000} s (a quick one ${n.sandComboMs / 1000} s more), to a limit of a minute`);
    expect(n.sandReserveMs).toBe(60_000);
    expect(challenges).toContain("up to three");
    expect(n.combo.at(-1)).toBe(3);
  });

  it("show the command line's output as the command line prints it, and list its commands and options as its usage does", () => {
    const text = `${section("The command line")}\n${commandLineDoc}`;
    const block = text.slice(text.indexOf("```text") + 8, text.indexOf("```", text.indexOf("```text") + 8));
    const commands = block.split(/^\$ jarajara /m).slice(1);
    expect(commands.length).toBeGreaterThanOrEqual(6);
    for (const entry of commands) {
      const [first, ...lines] = entry.split("\n");
      const result = runCli(first.split(" "), { env: {} });
      expect(`${first}\n${lines.join("\n")}`, first).toBe(`${first}\n${result.out}`.replace(/\n$/, "") + "\n");
    }
    const usage = CLI_STRINGS.en.usage;
    for (const row of rows(text).filter((cells) => /^`[a-z]+( <|`)/.test(cells[0]))) expect(usage, row[0]).toContain(`  ${row[0].replace(/`/g, "").split(" ")[0]}`);
    for (const option of usage.matchAll(/(?:^|\s)(--[a-z]+)/gm)) expect(text, option[1]).toContain(option[1]);
    for (const code of ["0 when all went well", "1 when what was asked for could not be done", "2 when the command itself was wrong"]) expect(text).toContain(code);
  });

  it("have the bin the command line is, and run it in CI on three systems and two versions of Node", () => {
    expect(pkg.bin).toEqual({ jarajara: "bin/jarajara.mjs" });
    expect(pkg.files).toContain("bin");
    expect(existsSync("bin/jarajara.mjs")).toBe(true);
    const ci = readFileSync(".github/workflows/ci.yml", "utf8");
    expect(ci).toContain("pnpm test:cli");
    expect(ci).toContain("node: [22, 24]");
    for (const system of ["ubuntu-latest", "macos-latest", "windows-latest"]) expect(ci).toContain(system);
    expect(readFileSync(".github/workflows/release.yml", "utf8")).toContain("scripts/check-cli.mjs");
  });

  it("keep the family's stylesheet byte for byte, as its first line's hash says", () => {
    const [first, ...rest] = readFileSync("demo/family.css", "utf8").split("\n");
    const hash = /sha256 of every line after this one: ([0-9a-f]{64})/.exec(first)?.[1];
    expect(createHash("sha256").update(rest.join("\n")).digest("hex")).toBe(hash);
  });

  it("keep the family's template naming this package among the family, as the footer lists it", () => {
    expect(readFileSync("scripts/family-template.mjs", "utf8")).toContain(`{ id: "jarajara", name: "Jarajara", kana: "ジャラジャラ" }`);
  });
});

describe("the README's promises", () => {
  it("has the sections a package of this family has, each with something in it", () => {
    for (const heading of ["In 30 seconds", "Who it is for", "Features", "Use it in your project", "API", "The command line", "Theming", "Limits", "Browser support", "Accessibility", "Languages", "Roadmap", "Architecture", "The name", "Where it comes from, and where it is used", "Development", "Contributing", "Changes", "Licence"]) {
      expect(section(heading).length, heading).toBeGreaterThan(heading.length + 40);
    }
  });

  it("installs the package it is, and every version it names is the one in package.json", () => {
    expect(readme).toContain(`npm install ${pkg.name}`);
    const major = pkg.version.split(".")[0];
    const named = [...readme.matchAll(/@johnmorrisdotca\/jarajara@([\w.-]+)/g)].map((match) => match[1]);
    expect(named.length).toBeGreaterThan(0);
    for (const version of named) expect(version).toBe(major);
    expect(readme).not.toMatch(/\bjarajara@\d+\.\d+/);
  });

  it("links only to files that exist", () => {
    const targets = [...readme.matchAll(/\]\((?!https?:|#|mailto:)([^)\s#]+)/g)].map((match) => match[1]);
    expect(targets.length).toBeGreaterThan(5);
    for (const target of targets) expect(existsSync(target), target).toBe(true);
    for (const picture of readme.matchAll(/src="(docs\/[^"]+)"/g)) expect(existsSync(picture[1]), picture[1]).toBe(true);
  });

  it("links only to anchors a heading makes", () => {
    const slug = (heading) => heading.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").trim().replace(/\s/g, "-");
    const made = new Set([...readme.matchAll(/^#{1,6} (.+)$/gm)].map((match) => slug(match[1])));
    for (const link of readme.matchAll(/\]\(#([^)]+)\)/g)) expect(made.has(link[1]), link[1]).toBe(true);
  });

  it("lists every package of the family, with its kana, as the demo's footer does", () => {
    const template = readFileSync("scripts/family-template.mjs", "utf8");
    const family = [...template.matchAll(/\{ id: "([\w-]+)", name: "(\w+)", kana: "([^"]+)" \}/g)].map((match) => ({ id: match[1], name: match[2], kana: match[3] }));
    expect(family.length).toBeGreaterThanOrEqual(16);
    const block = readme.slice(readme.indexOf("### The family"), readme.indexOf("\n## ", readme.indexOf("### The family")));
    for (const { id, name, kana } of family) expect(block, id).toContain(`- [${name}](https://github.com/johnmorrisdotca/${id}) (${kana}`);
    const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty", "twenty-one", "twenty-two", "twenty-three", "twenty-four"];
    expect(block).toContain(`one of ${words[family.length]} packages`);
    expect([...block.matchAll(/^- \[/gm)]).toHaveLength(family.length);
  });

  it("gives every custom property the tags read, with its default, and every cloth with its three colours", () => {
    const found = new Map();
    for (const file of filesUnder("src/ui", ".ts").filter((path) => !path.endsWith(".test.ts"))) {
      for (const match of readFileSync(file, "utf8").matchAll(/var\(--jarajara-([a-z-]+)(?:,\s*([^)]*))?\)/g)) {
        const defaults = found.get(match[1]) ?? new Set();
        if (match[2]?.trim()) defaults.add(match[2].trim());
        found.set(match[1], defaults);
      }
    }
    // Two are worked out by the tags themselves from the tile's width and the rack's length: not for a page to set.
    for (const inner of ["w", "across"]) found.delete(inner);
    const table = Object.fromEntries(rows(section("Theming")).filter((row) => row[0].startsWith("`--jarajara-")).map((row) => [row[0].replace(/`/g, "").replace("--jarajara-", ""), row]));
    expect(Object.keys(table).sort()).toEqual([...found.keys()].sort());
    for (const [name, defaults] of found) if (defaults.size > 0 && ![...defaults].some((value) => value.includes("$"))) expect([...defaults].some((value) => table[name][2].includes(value)), name).toBe(true);
    const cloths = Object.fromEntries(rows(section("Theming")).filter((row) => /^`(green|blue|red|black|wood)`$/.test(row[0])).map((row) => [row[0].replace(/`/g, ""), row]));
    expect(Object.keys(cloths).sort()).toEqual(Object.keys(JARAJARA_CLOTHS).sort());
    for (const [name, cloth] of Object.entries(JARAJARA_CLOTHS)) expect(cloths[name].slice(1), name).toEqual([`\`${cloth.felt}\``, `\`${cloth.deep}\``, `\`${cloth.ink}\``]);
    const parts = new Set(filesUnder("src", ".ts").flatMap((file) => [...readFileSync(file, "utf8").matchAll(/part="([a-z-]+)"/g)].map((match) => match[1])));
    const named = [...section("Theming").matchAll(/`part` names \(([^)]+)\)/g)][0][1];
    expect([...named.matchAll(/`([a-z-]+)`/g)].map((match) => match[1]).sort()).toEqual([...parts].sort());
  });

  it("states the limits as the code has them", () => {
    const limits = section("Limits");
    expect(limits).toContain(`from 1 to ${SEED_MOST.toLocaleString("en-US")}`);
    expect(limits).toContain(`${AWASE_SAME_BLOCK.from.toLocaleString("en-US")} to ${(AWASE_SAME_BLOCK.from + AWASE_SAME_BLOCK.size - 1).toLocaleString("en-US")}`);
    expect(limits).toContain(`${AWASE_TABLE.least} to ${AWASE_TABLE.most} players, a name up to ${AWASE_TABLE.nameMost} characters`);
    expect(limits).toContain(`${MOST_SOUNDING} from one element, and ${MOST_SOUNDS_AT_ONCE} from one call`);
    expect(limits).toContain(`${MAHJONG_FACES.length === 42 ? "144 tiles in 42 faces" : "?"}`);
    expect(setInventory()).toHaveLength(42);
    expect(setInventory().reduce((sum, { face }) => sum + copiesOf(face.code), 0)).toBe(144);
    const sizes = ALL_LAYOUTS.map((layout) => layout.size).sort((a, b) => a - b);
    expect(limits).toContain(`thirteen, ${Math.min(...ALL_LAYOUTS.map((l) => l.slots.length))} to ${Math.max(...ALL_LAYOUTS.map((l) => l.slots.length))} tiles, widths 4, 8 to 17, 20 and 26`);
    expect(sizes).toEqual([4, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 20, 26]);
    expect(limits).toContain(`${AWASE_CHALLENGES.length === 7 ? "seven" : "?"}`);
    expect(readFileSync("src/ui/elementKit.ts", "utf8")).toContain("Math.min(600, width)");
    expect(readFileSync("src/ui/viewerElements.ts", "utf8")).toContain("Math.min(600, width)");
    // "Over a hundred kilobytes" and "tens of kilobytes", as the files are.
    for (const file of ["src/designs/riichi.ts", "src/designs/riichi-black.ts"]) expect(statSync(file).size, file).toBeGreaterThan(100_000);
    expect(statSync("src/sounds.ts").size).toBeGreaterThan(10_000);
    expect(statSync("src/sounds.ts").size).toBeLessThan(100_000);
  });

  it("names the features the browser support rests on, as the code uses them, and the Node it runs on as package.json and CI have it", () => {
    const source = filesUnder("src/ui", ".ts").map((file) => readFileSync(file, "utf8")).join("\n");
    for (const feature of ["color-mix", ":has(", "container-type", "attachShadow", "matrix3d"]) expect(source, feature).toContain(feature);
    expect(section("Browser support")).toMatch(/custom elements, shadow DOM, container queries, `:has\(\)` and `color-mix\(\)`/);
    expect(pkg.engines.node).toBe(">=22");
    expect(section("Browser support")).toContain("Node 22 or later");
    expect(readFileSync("src/cloth.ts", "utf8")).toContain("Object.hasOwn");
    const config = readFileSync("playwright.config.mjs", "utf8");
    for (const project of ["chromium-phone", "chromium-desk", "webkit-phone"]) expect(config, project).toContain(project);
    expect(config).not.toContain("firefox");
    expect(JSON.stringify(pkg)).not.toMatch(/"node":\s*">=20"/);
    expect(readme).not.toMatch(/Node 20/);
  });

  it("claims for the framework recipes only what the framework check does: five pages, two engines, and every framework named", () => {
    const check = readFileSync("scripts/check-frameworks.mjs", "utf8");
    for (const name of ["react", "vue", "svelte", "angular", "plain", "chromium", "webkit"]) expect(check.toLowerCase(), name).toContain(name);
    expect(pkg.scripts["test:frameworks"]).toContain("check-frameworks.mjs");
    expect(readFileSync(".github/workflows/ci.yml", "utf8")).toContain("pnpm test:frameworks");
    expect(existsSync("e2e/properties.demo.mjs")).toBe(true);
    for (const snippet of ["React 19", "Vue 3", "Svelte 5", "Angular"]) expect(section("Use it in your project"), snippet).toContain(snippet);
  });

  it("keeps docs/strings-ja.md as the words of the tags and the command line, English beside Japanese, and the layouts' Japanese names (pnpm docs:make rewrites it)", () => {
    const cell = (text) => text.replace(/\|/g, "\\|").replace(/\n/g, " ");
    const table = (strings, skip = []) => ["| Name | English | Japanese |", "| --- | --- | --- |", ...Object.keys(strings.en).filter((key) => !skip.includes(key)).map((key) => `| \`${key}\` | ${cell(strings.en[key])} | ${cell(strings.ja[key] ?? "")} |`)];
    const lines = [
      "# Jarajara's words, in English and Japanese",
      "",
      "Made from `src/ui/strings.ts` and `src/cliWords.ts` by `pnpm docs:make`; a test fails if the two differ, so this list is never out of date.",
      "",
      "**The Japanese has not yet been reviewed by a native reader.** If a line reads wrongly or unnaturally, please",
      "open a *Fix a translation* issue with the string's name. `{name}` and the other braces are filled in when shown. The tiles' own",
      "names are `faceWords` and `faceWordsJa` in `src/names.ts`, and the demo page's words are `WORDS` in `demo/words.js`.",
      "",
      "## The tags",
      "",
      ...table(STRINGS),
      "",
      "## The command line",
      "",
      "The usage text (`--help`) is a block of prose of its own, in `usage`, and is left out here.",
      "",
      ...table(CLI_STRINGS, ["usage"]),
      "",
      "## The layouts' names",
      "",
      "| Key | English | Japanese |",
      "| --- | --- | --- |",
      ...ALL_LAYOUTS.map((layout) => `| \`${layout.key}\` | ${layout.key[0].toUpperCase()}${layout.key.slice(1)} | ${LAYOUT_NAMES_JA[layout.key]} |`),
    ];
    const made = `${lines.join("\n")}\n`;
    if (process.env.UPDATE_DOCS === "1") writeFileSync("docs/strings-ja.md", made);
    expect(readFileSync("docs/strings-ja.md", "utf8")).toBe(made);
    expect(readme).toContain("[docs/strings-ja.md](./docs/strings-ja.md)");
  });

  it("has the files a visitor looks for: issue templates of its own, a pull request template, a security policy", () => {
    for (const file of ["report-a-bug", "suggest-a-feature", "fix-a-translation", "add-my-project", "suggest-a-layout"]) expect(existsSync(`.github/ISSUE_TEMPLATE/${file}.md`), file).toBe(true);
    for (const file of [".github/ISSUE_TEMPLATE/config.yml", ".github/pull_request_template.md", "SECURITY.md", "CONTRIBUTING.md", "CODE_OF_CONDUCT.md", "LICENSE"]) expect(existsSync(file), file).toBe(true);
    expect(readme).toContain("issues/new?template=fix-a-translation.md");
    expect(readme).toContain("issues/new?template=suggest-a-layout.md");
    expect(readFileSync(".github/ISSUE_TEMPLATE/fix-a-translation.md", "utf8")).toContain("docs/strings-ja.md");
  });

  it("says in the layout template which widths are taken, as the layouts have them", () => {
    const sizes = ALL_LAYOUTS.map((layout) => layout.size).sort((a, b) => a - b);
    const template = readFileSync(".github/ISSUE_TEMPLATE/suggest-a-layout.md", "utf8");
    expect(sizes).toEqual([4, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 20, 26]);
    expect(template).toContain("Widths 4, 8 to 17, 20 and 26 are taken; 5 to 7, 18, 19, 21 to 25, and 27 or more, are free.");
  });

  it("keeps SECURITY.md and CODE_OF_CONDUCT.md equal to the family's master text, a copy of which is kept in scripts/community", () => {
    for (const file of ["SECURITY.md", "CODE_OF_CONDUCT.md"]) expect(readFileSync(file, "utf8"), file).toBe(readFileSync(`scripts/community/${file}`, "utf8"));
  });

  it("tells a contributor the family's house rules and Node 22", () => {
    const contributing = readFileSync("CONTRIBUTING.md", "utf8");
    expect(contributing).toContain("## House rules, shared by every package of the family");
    expect(contributing).toContain("Needs Node 22 or later.");
    for (const script of ["test:package", "test:cli", "test:demo", "test:frameworks", "docs:make"]) {
      expect(contributing, script).toContain(`pnpm ${script}`);
      expect(pkg.scripts[script], script).toBeDefined();
    }
  });
});
