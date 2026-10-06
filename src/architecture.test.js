import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** The Architecture page's tree (docs/ARCHITECTURE.md, linked from the README) names every source file, and nothing that is not one, so it cannot fall behind the code. */
describe("the Architecture page", () => {
  it("names exactly the files under src/", () => {
    const readme = readFileSync("docs/ARCHITECTURE.md", "utf8");
    const section = readme;
    const tree = section.slice(section.indexOf("```text"), section.indexOf("```", section.indexOf("```text") + 7));
    const named = [...tree.matchAll(/[├└]── ([\w.-]+\.ts)\b/g)].map((match) => match[1]).sort();
    const files = (readdirSync("src", { recursive: true }))
      .filter((path) => path.endsWith(".ts") && !/\.(test|fixture)\./.test(path))
      .map((path) => path.split(/[\\/]/).at(-1))
      .sort();
    expect(named).toEqual(files);
  });
});
