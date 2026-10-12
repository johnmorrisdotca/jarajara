/** The checked public examples shared by the design writer and its comment-only refresh. */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

export function riichiDocLines(style) {
  return [
    `/** The ${style.words} riichi tiles, drawn in a box 300 by 400.`,
    " *",
    " * @example",
    " * ```ts",
    ` * import { ${style.constant} } from "@johnmorrisdotca/jarajara/designs/${style.file}";`,
    " * import { tileSvg } from \"@johnmorrisdotca/jarajara/faces\";",
    ` * console.log(${style.constant}.name, tileSvg("F", { design: ${style.constant} })?.length);`,
    " * ```",
    " */",
  ];
}

// Refresh the same writer's comments while keeping every existing SVG drawing byte for byte.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes("--refresh")) {
  for (const style of [{file:"riichi",words:"regular",constant:"RIICHI"},{file:"riichi-black",words:"black",constant:"RIICHI_BLACK"}]) {
    const file = `src/designs/${style.file}.ts`;
    const before = readFileSync(file,"utf8");
    const old = `/** The ${style.words} riichi tiles, drawn in a box 300 by 400. */`;
    if (before.includes(riichiDocLines(style).join("\n"))) continue;
    if (!before.includes(old)) throw new Error(`Expected original design comment: ${file}`);
    writeFileSync(file,before.replace(old,riichiDocLines(style).join("\n")));
  }
}
