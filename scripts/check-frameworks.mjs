// Proves the claim in the README: the packed package works in React, Vue, Svelte, Angular and a plain page, with
// nothing for the consumer to configure. It packs the package, makes a small project for each in a scratch folder,
// installs the tarball and each framework's own tools there (never here: the package has no dependencies), and
// builds it. Then it opens each built page in Chromium and WebKit, and plays a game of Awase on the Tiny layout to
// its end by tapping the tiles the hint names, and checks that the page's own listener heard the layout clear and
// that all seven tags were defined. A tile with `flip` is tapped too, which only turns over where the framework
// reached the attribute: React, Vue and Svelte set a property where the element has one of the name. The components
// are the ones the README shows.
//
//   pnpm test:frameworks [scratch folder]        (JARAJARA_FRAMEWORKS=vue,react for some of them)
//
// Run it before a release that names a framework. It needs the network and a few minutes.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
import process from "node:process";

import { chromium, webkit } from "@playwright/test";

const root = resolve(process.argv[2] ?? mkdtempSync(join(tmpdir(), "jarajara-frameworks-")));
rmSync(root, { recursive: true, force: true });
mkdirSync(root, { recursive: true });
const run = (cwd, command, args) => execFileSync(command, args, { cwd, stdio: "pipe", shell: process.platform === "win32", env: { ...process.env, NG_CLI_ANALYTICS: "false" } }).toString();
const write = (dir, files) => {
  for (const [name, text] of Object.entries(files)) {
    mkdirSync(join(dir, name, ".."), { recursive: true });
    writeFileSync(join(dir, name), typeof text === "string" ? text : JSON.stringify(text, null, 2));
  }
};

run(process.cwd(), "npm", ["pack", "--ignore-scripts", "--pack-destination", root]);
const tarball = join(root, readdirSync(root).find((name) => name.endsWith(".tgz")));
const jarajara = `file:${tarball}`;
const page = (script) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>jarajara</title></head><body><div id="app"></div>${script}</body></html>`;
// What each page says of itself: how many of the seven tags the package defined, and whether the layout was cleared.
const TAGS = `["tile", "rack", "layout", "table", "viewer", "group", "set"].filter((name) => customElements.get("jarajara-" + name)).length`;

const projects = {
  vue: {
    out: "dist",
    files: {
      "package.json": { name: "check-vue", private: true, type: "module", dependencies: { "@johnmorrisdotca/jarajara": jarajara, vue: "^3.5.0" }, devDependencies: { vite: "^7.0.0", "@vitejs/plugin-vue": "^6.0.0" } },
      "vite.config.js": `import vue from "@vitejs/plugin-vue";\nexport default { base: "./", plugins: [vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith("jarajara-") } } })] };\n`,
      "index.html": page(`<script type="module" src="/src/main.js"></script>`),
      "src/main.js": `import { createApp } from "vue";\nimport Game from "./Game.vue";\ncreateApp(Game, { seed: 7 }).mount("#app");\n`,
      "src/Game.vue": `<script setup>
import { onMounted, ref } from "vue";
import "@johnmorrisdotca/jarajara/element/define";

defineProps({ seed: Number });
const cleared = ref(false);
const tags = ref(0);
onMounted(() => { tags.value = ${TAGS}; });
</script>

<template>
  <p id="tags">{{ tags }} tags</p>
  <p id="status">{{ cleared ? "Cleared" : "Playing" }}</p>
  <jarajara-tile id="tile" code="east" flip></jarajara-tile>
  <jarajara-layout id="game" size="4" level="easy" :seed="seed" controls @jarajara-clear="cleared = true"></jarajara-layout>
</template>
`,
    },
  },
  svelte: {
    out: "dist",
    files: {
      "package.json": { name: "check-svelte", private: true, type: "module", dependencies: { "@johnmorrisdotca/jarajara": jarajara, svelte: "^5.0.0" }, devDependencies: { vite: "^7.0.0", "@sveltejs/vite-plugin-svelte": "^6.0.0" } },
      "vite.config.js": `import { svelte } from "@sveltejs/vite-plugin-svelte";\nexport default { base: "./", plugins: [svelte()] };\n`,
      "index.html": page(`<script type="module" src="/src/main.js"></script>`),
      "src/main.js": `import { mount } from "svelte";\nimport Game from "./Game.svelte";\nmount(Game, { target: document.getElementById("app"), props: { seed: 7 } });\n`,
      "src/Game.svelte": `<script>
  import "@johnmorrisdotca/jarajara/element/define";

  let { seed } = $props();
  let game;
  let cleared = $state(false);
  let tags = $state(0);
  $effect(() => {
    tags = ${TAGS};
    const listen = () => (cleared = true);
    game.addEventListener("jarajara-clear", listen);
    return () => game.removeEventListener("jarajara-clear", listen);
  });
</script>

<p id="tags">{tags} tags</p>
<p id="status">{cleared ? "Cleared" : "Playing"}</p>
<jarajara-tile id="tile" code="east" flip></jarajara-tile>
<jarajara-layout bind:this={game} id="game" size="4" level="easy" seed={seed} controls></jarajara-layout>
`,
    },
  },
  angular: {
    out: "dist/check-angular/browser",
    files: {
      "package.json": {
        name: "check-angular",
        private: true,
        dependencies: { "@johnmorrisdotca/jarajara": jarajara, "@angular/common": "^20.0.0", "@angular/compiler": "^20.0.0", "@angular/core": "^20.0.0", "@angular/platform-browser": "^20.0.0", rxjs: "^7.8.0", tslib: "^2.8.0" },
        devDependencies: { "@angular/build": "^20.0.0", "@angular/cli": "^20.0.0", "@angular/compiler-cli": "^20.0.0", typescript: "~5.8.0" },
      },
      "angular.json": {
        version: 1,
        projects: {
          "check-angular": {
            projectType: "application",
            root: "",
            sourceRoot: "src",
            architect: { build: { builder: "@angular/build:application", options: { outputPath: "dist/check-angular", index: "src/index.html", browser: "src/main.ts", tsConfig: "tsconfig.json", baseHref: "./" }, configurations: { production: {} }, defaultConfiguration: "production" } },
          },
        },
      },
      "tsconfig.json": { compilerOptions: { target: "ES2022", module: "ES2022", moduleResolution: "bundler", strict: true, experimentalDecorators: true, skipLibCheck: true, lib: ["ES2022", "dom"] }, files: ["src/main.ts"] },
      "src/index.html": page(`<check-root></check-root>`),
      "src/game.ts": `import { Component, CUSTOM_ELEMENTS_SCHEMA, input, signal } from "@angular/core";
import "@johnmorrisdotca/jarajara/element/define";

@Component({
  selector: "game",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: \`
    <p id="tags">{{ tags() }} tags</p>
    <p id="status">{{ cleared() ? "Cleared" : "Playing" }}</p>
    <jarajara-tile id="tile" code="east" flip></jarajara-tile>
    <jarajara-layout id="game" size="4" level="easy" [attr.seed]="seed()" controls (jarajara-clear)="cleared.set(true)"></jarajara-layout>
  \`,
})
export class Game {
  seed = input.required<number>();
  cleared = signal(false);
  tags = signal(${TAGS});
}
`,
      "src/main.ts": `import { Component, provideZonelessChangeDetection } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { Game } from "./game";

@Component({
  selector: "check-root",
  imports: [Game],
  template: \`<game [seed]="seed" />\`,
})
class App {
  seed = 7;
}

bootstrapApplication(App, { providers: [provideZonelessChangeDetection()] });
`,
    },
  },
  react: {
    out: "dist",
    files: {
      "package.json": { name: "check-react", private: true, type: "module", dependencies: { "@johnmorrisdotca/jarajara": jarajara, react: "^19.0.0", "react-dom": "^19.0.0" }, devDependencies: { vite: "^7.0.0", "@vitejs/plugin-react": "^5.0.0" } },
      "vite.config.js": `import react from "@vitejs/plugin-react";\nexport default { base: "./", plugins: [react()] };\n`,
      "index.html": page(`<script type="module" src="/src/main.jsx"></script>`),
      "src/Game.jsx": `import { useEffect, useRef, useState } from "react";
import "@johnmorrisdotca/jarajara/element/define";

export function Game({ seed }) {
  const game = useRef(null);
  const [cleared, setCleared] = useState(false);
  const [tags, setTags] = useState(0);
  useEffect(() => {
    setTags(${TAGS});
    const listen = () => setCleared(true);
    game.current?.addEventListener("jarajara-clear", listen);
    return () => game.current?.removeEventListener("jarajara-clear", listen);
  }, []);
  return (
    <>
      <p id="tags">{tags} tags</p>
      <p id="status">{cleared ? "Cleared" : "Playing"}</p>
      <jarajara-tile id="tile" code="east" flip />
      <jarajara-layout ref={game} id="game" size="4" level="easy" seed={seed} controls />
    </>
  );
}
`,
      "src/main.jsx": `import { createRoot } from "react-dom/client";
import { Game } from "./Game.jsx";

createRoot(document.getElementById("app")).render(<Game seed={7} />);
`,
    },
  },
  // No framework and no bundler: a script tag and the files as they are published.
  plain: {
    out: ".",
    build: (dir) => run(dir, "npm", ["install", "--no-audit", "--no-fund", "--ignore-scripts", "--install-links"]),
    files: {
      "package.json": { name: "check-plain", private: true, dependencies: { "@johnmorrisdotca/jarajara": jarajara } },
      "index.html": page(`<p id="tags"></p>
<p id="status">Playing</p>
<jarajara-tile id="tile" code="east" flip></jarajara-tile>
<jarajara-layout id="game" size="4" level="easy" seed="7" controls></jarajara-layout>
<script type="module">
  import "./node_modules/@johnmorrisdotca/jarajara/dist/element-define.js";

  document.getElementById("tags").textContent = ${TAGS} + " tags";
  document.getElementById("game").addEventListener("jarajara-clear", () => (document.getElementById("status").textContent = "Cleared"));
</script>`),
    },
  },
};

const only = process.env.JARAJARA_FRAMEWORKS?.split(",");
const built = [];
for (const [name, project] of Object.entries(projects)) {
  if (only !== undefined && !only.includes(name)) continue;
  const dir = join(root, name);
  write(dir, project.files);
  const started = Date.now();
  try {
    if (project.build !== undefined) project.build(dir);
    else {
      run(dir, "npm", ["install", "--no-audit", "--no-fund"]);
      run(dir, "npx", name === "angular" ? ["ng", "build"] : ["vite", "build"]);
    }
    if (!existsSync(join(dir, project.out, "index.html"))) throw new Error(`no index.html in ${project.out}`);
    built.push([name, join(dir, project.out)]);
    console.log(`built   ${name.padEnd(8)} in ${Math.round((Date.now() - started) / 1000)} s`);
  } catch (error) {
    console.log(`FAILED  ${name}: ${String(error.stderr ?? error.stdout ?? error.message).split("\n").slice(-12).join("\n")}`);
    process.exitCode = 1;
  }
}

// Open each built page and play the layout to its end: tap the two tiles the hint names, until none is left.
const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json" };
for (const [engine, launcher] of [["chromium", chromium], ["webkit", webkit]]) {
  const browser = await launcher.launch();
  for (const [name, out] of built) {
    const context = await browser.newContext({ viewport: { width: 390, height: 800 }, reducedMotion: "reduce" });
    const tab = await context.newPage();
    const errors = [];
    tab.on("pageerror", (error) => errors.push(String(error)));
    await tab.route("http://check.test/**", (route) => {
      let file = join(out, decodeURIComponent(new URL(route.request().url()).pathname));
      if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
      if (!existsSync(file)) return route.fulfill({ status: 404, body: "" });
      return route.fulfill({ body: readFileSync(file), contentType: types[extname(file)] ?? "application/octet-stream" });
    });
    await tab.goto("http://check.test/");
    let status = "nothing";
    let tags = "nothing";
    let tiles = 0;
    let taken = 0;
    let turned = "nothing";
    try {
      // The tiles are in the element's shadow root, which a locator reaches and document.querySelectorAll does not.
      await tab.locator("#game [data-slot]").first().waitFor({ timeout: 8000 });
      tiles = await tab.locator("#game [data-slot]").count();
      await tab.locator("#tile").click();
      await tab.waitForFunction(() => document.querySelector("#tile")?.getAttribute("aria-label") === "tile, face down", null, { timeout: 3000 });
      turned = "face down";
      for (let step = 0; step < 20; step += 1) {
        const pair = await tab.locator("#game").evaluate((layout) => layout.hint());
        if (pair === null) break;
        for (const slot of pair) await tab.locator(`#game [data-slot="${slot}"]`).dispatchEvent("click");
        taken += 1;
      }
      await tab.waitForFunction(() => document.querySelector("#status")?.textContent === "Cleared", null, { timeout: 5000 });
    } catch {
      // Nothing was drawn, or it could not be played: reported below.
    }
    status = (await tab.locator("#status").textContent().catch(() => null)) ?? "nothing";
    tags = (await tab.locator("#tags").textContent().catch(() => null)) ?? "nothing";
    const ok = errors.length === 0 && tiles === 8 && taken === 4 && turned === "face down" && status.trim() === "Cleared" && tags.trim() === "7 tags";
    console.log(`${ok ? "played " : "FAILED "} ${name.padEnd(8)} in ${engine}: ${tiles} tiles, a tile turned ${turned}, ${taken} pairs taken, the page says “${status.trim()}” and “${tags.trim()}”${errors.length > 0 ? ` ${errors.join("; ")}` : ""}`);
    if (!ok) process.exitCode = 1;
    await context.close();
  }
  await browser.close();
}
console.log(`scratch projects are in ${root}`);
