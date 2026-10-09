import { expect, test } from "@playwright/test";
import { serve } from "./demo.mjs";

test("the rack builder covers all attributes, writes host formats and restores its link", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await serve(page);
  await page.goto("http://jarajara.test/builder.html?lang=en");
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("#bld-stage jarajara-rack")).toHaveAttribute("tiles", "123m456p789s1112z");
  for (const format of ["element", "iframe", "module", "react", "vue", "svelte", "angular", "html", "url"]) {
    await page.locator(`#bld-formats [data-format="${format}"]`).click();
    await expect(page.locator("#bld-code")).not.toHaveText("");
  }
  await expect(page.locator("#bld-code")).toContainText("/embed/?tiles=");
  await page.locator('[data-lang="ja"]').click();
  await expect(page.locator("#bld-maker-says")).toContainText("手牌");
  await page.reload();
  await expect(page.locator("#bld-stage jarajara-rack")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("rack properties preserve methods and structured values; false aliases disable picking", async ({ page }) => {
  await serve(page);
  await page.goto("http://jarajara.test/embed/?tiles=123m&pick=off&face-down=no&theme=dark");
  const rack = page.locator("jarajara-rack");
  await expect(rack).toBeVisible();
  expect(await rack.locator('[role="button"]').count()).toBe(0);
  const value = await rack.evaluate((element) => {
    element.width = 70; element.label = "Example rack"; element.lifted = [0]; element.group = "suit"; element.mark = "•";
    return { tiles: element.tiles, lifted: element.lifted, group: typeof element.group, mark: typeof element.mark, width: element.getAttribute("width"), label: element.getAttribute("aria-label"), theme: element.style.colorScheme };
  });
  expect(value).toMatchObject({ tiles: ["a", "b", "c"], lifted: ["a"], group: "function", mark: "function", width: "70", label: "Example rack", theme: "dark" });
  await rack.evaluate(async (element) => { const { defineRack } = await import("../dist/element.js"); defineRack("article-rack"); defineRack("article-rack"); element.faceDown = "false"; });
  await expect(rack).toHaveAttribute("face-down", "false");
  expect(await page.evaluate(() => typeof customElements.get("article-rack"))).toBe("function");
});

test("the iframe validates complete tiles and renders labels as text without scrolling or storage", async ({ page }) => {
  await serve(page);
  const label = '<img src=x onerror="bad">';
  await page.goto(`http://jarajara.test/embed/?tiles=123m&label=${encodeURIComponent(label)}&width=Infinity&design=invalid&back-colour=red%22%3E`);
  await expect(page.locator("jarajara-rack")).toHaveAttribute("aria-label", label);
  await expect(page.locator("jarajara-rack")).not.toHaveAttribute("width", /.*/);
  await expect(page.locator("jarajara-rack")).not.toHaveAttribute("design", /.*/);
  expect(await page.locator("img").count()).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && document.documentElement.scrollHeight <= window.innerHeight && window.localStorage.length === 0)).toBe(true);
  await page.goto("http://jarajara.test/embed/?tiles=123m%20not-a-tile");
  await expect(page.getByRole("status")).toContainText("Use valid tiles");
  await expect(page.locator("jarajara-rack")).toHaveCount(0);
});

test("keyboard picking forwards the same JSON-safe native detail across the iframe", async ({ page }) => {
  await serve(page);
  await page.route("http://host.test/", (route) => route.fulfill({ contentType: "text/html", body: '<script>window.messages=[];addEventListener("message",event=>{if(event.origin==="http://jarajara.test")messages.push(event.data);});</script><iframe src="http://jarajara.test/embed/?tiles=123m&pick=one"></iframe>' }));
  await page.goto("http://host.test/");
  const rack = page.frameLocator("iframe").locator("jarajara-rack");
  await rack.locator('[role="button"]').first().press("Enter");
  await expect.poll(() => page.evaluate(() => window.messages.some((message) => message.type === "jarajara-pick"))).toBe(true);
  const message = await page.evaluate(() => window.messages.find((made) => made.type === "jarajara-pick"));
  expect(message.detail).toEqual({ index: 0, code: "a", lifted: true });
  expect(JSON.parse(JSON.stringify(message))).toEqual(message);
  await expect(rack.locator('[role="button"]').first()).toHaveAttribute("aria-pressed", "true");
});
