// The table panel: <jarajara-table> with two to four players.
export function initTable(ctx) {
  const table = document.getElementById("table-demo");
  const players = document.getElementById("table-players");
  let count = 2;
  const code = () => ctx.show("table-code", `<jarajara-table players="${count}" people="1" size="8" cloth="green" box="landscape"></jarajara-table>\n\ntable.deal();   // deal again\ntable.addEventListener("jarajara-table", (event) => event.detail.scores);`);
  const paint = () => {
    players.replaceChildren(
      ...[2, 3, 4].map((value) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = String(value);
        button.dataset.value = String(value);
        button.setAttribute("aria-pressed", String(value === count));
        button.addEventListener("click", () => {
          count = value;
          table.setAttribute("players", String(value));
          paint();
          code();
        });
        return button;
      }),
    );
  };
  document.getElementById("table-deal").addEventListener("click", () => table.deal());
  paint();
  code();
  ctx.cloth([table]);
  ctx.soundy([table]);
}
