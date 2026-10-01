// The rack panel: <jarajara-rack> lined up on the table, and every thing a rack does.
import { tileName } from "./dist/index.js";

/** A hand of fourteen, written as hand notation: a run of each suit, a pair, and honours. */
const HANDS = ["234m567p3456s11z77z", "1199m1199p119s123z", "345m678p2345s5566z", "112233m445566p77z"];

export function initRack(ctx) {
  const rack = document.getElementById("rack");
  const note = document.getElementById("rack-note");
  let hand = 0;
  const say = (text) => {
    note.textContent = text;
  };
  const raised = () => rack.getAttribute("lifted") ?? "";
  const press = (id, action) => document.getElementById(id).addEventListener("click", () => action());

  const code = (text) => ctx.show("rack-code", text);
  const showHand = () => {
    rack.setAttribute("tiles", HANDS[hand % HANDS.length]);
    for (const name of ["face-down", "turned", "lifted", "marked", "order", "group"]) rack.removeAttribute(name);
    code(`<jarajara-rack tiles="${HANDS[hand % HANDS.length]}" capacity="14" pick></jarajara-rack>`);
    say("");
  };

  press("rack-hide", () => {
    code("rack.hide();");
    return rack.hide();
  });
  press("rack-show", () => {
    code("rack.show();");
    return rack.show();
  });
  press("rack-hide-slow", () => {
    code("rack.hide({ oneByOne: true });");
    return rack.hide({ oneByOne: true });
  });
  press("rack-toggle", () => {
    if (raised() === "") return say(ctx.word("rackNone"));
    say("");
    code(`rack.toggle([${raised().split(" ").join(", ")}]);   // the raised tiles, by their places`);
    const places = raised().split(" ").map(Number);
    rack.lower();
    return rack.toggle(places);
  });
  press("rack-sort", () => {
    code('rack.sort();   // "suit", "rank", "kind" or "code"');
    return rack.sort("suit");
  });
  press("rack-group-suit", () => {
    code('rack.group("suit");');
    return rack.group("suit");
  });
  press("rack-group-kind", () => {
    code('rack.group("kind");   // numbers, honours, bonus tiles');
    return rack.group("kind");
  });
  press("rack-ungroup", () => {
    code("rack.ungroup();   // the gaps close, the tiles stay in order");
    return rack.ungroup();
  });
  press("rack-unsort", () => {
    code("rack.unsort();");
    return rack.unsort();
  });
  press("rack-mix", () => {
    code("rack.mixUp();");
    return rack.mixUp();
  });
  press("rack-take", async () => {
    if (raised() === "") return say(ctx.word("rackNone"));
    say("");
    const at = Number(raised().split(" ")[0]);
    code(`const code = await rack.take(${at});   // the raised tile leaves, the rest close up`);
    rack.lower();
    return rack.take(at);
  });
  press("rack-add", () => {
    const all = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOP";
    const next = all[Math.floor(Math.random() * all.length)];
    code(`rack.add("${next}");   // ${tileName(next, "en")}, dropped in at the end`);
    return rack.add(next);
  });
  press("rack-new", () => {
    hand += 1;
    showHand();
  });
  press("rack-mark", () => {
    if (raised() === "") return say(ctx.word("rackNone"));
    say("");
    const places = raised().split(" ").map(Number);
    code(`rack.mark([${places.join(", ")}]);   // a dot on the corner, face up or face down`);
    rack.lower();
    rack.mark(places);
  });
  press("rack-unmark", () => {
    code("rack.unmark();");
    rack.unmark();
  });
  press("rack-spin", () => {
    code("rack.spin();   // or rack.spin([0, 3], { turns: 5 })");
    return rack.spin();
  });

  showHand();
  ctx.soundy([rack]);
}
