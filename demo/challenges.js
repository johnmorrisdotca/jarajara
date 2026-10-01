// The challenges panel: what each challenge asks, and the options every game takes.
import { AWASE_CHALLENGES } from "./dist/awase-entry.js";

export function initChallenges(ctx) {
  const list = document.getElementById("challenge-list");
  const paint = () => {
    list.replaceChildren(
      ...AWASE_CHALLENGES.map((name) => {
        const item = document.createElement("li");
        item.setAttribute("data-testid", `challenge-${name}`);
        const title = document.createElement("strong");
        title.textContent = ctx.word("challenges")[name];
        const text = document.createElement("span");
        text.textContent = ctx.word("challengeNotes")[name];
        item.append(title, text);
        return item;
      }),
    );
  };
  paint();
  ctx.onLang(paint);
  ctx.show("challenge-code", `<jarajara-layout size="15" challenge="spark" hints="3" shuffles="1" timer controls></jarajara-layout>\n\nimport { startRun, runHint, runTake, readRun, dailyAwase } from "@johnmorrisdotca/jarajara/awase";\n\nlet run = startRun(deal, { challenge: "rush", hints: 3, undo: false });\nrun = runTake(run, a, b, Date.now());   // the new game, or null where the rules say no\nreadRun(run, Date.now());                // { state, remainingMs, goal, ... }\ndailyAwase("2026-10-01");                // the day's layout, level, seed and challenge`);
}
