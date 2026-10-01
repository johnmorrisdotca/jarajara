// The table panel: <jarajara-table> with two to four players.
export function initTable(ctx) {
  const table = document.getElementById("table-demo");
  const players = document.getElementById("table-players");
  players.replaceChildren(...[2, 3, 4].map((count) => Object.assign(document.createElement("option"), { value: String(count), textContent: String(count) })));
  const code = () => ctx.show("table-code", `<jarajara-table players="${players.value}" people="1" size="8" cloth="green"></jarajara-table>\n\ntable.deal();   // deal again\ntable.addEventListener("jarajara-table", (event) => event.detail.scores);`);
  players.addEventListener("change", () => {
    table.setAttribute("players", players.value);
    code();
  });
  document.getElementById("table-deal").addEventListener("click", () => table.deal());
  code();
  ctx.cloth([table]);
}
