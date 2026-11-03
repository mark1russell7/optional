// The panel of the laws: the settings, and one card for each law with a strip of its cases.
import { byId, h } from "@mark1russell7/site-pages/chrome";
import { checkLaws, FILTER_FNS, FLAT_FNS, MAP_FNS, type Case, type LawResult, type Settings } from "./laws.ts";

const COUNTS = [100, 200, 500, 1000] as const;

function options(select: HTMLSelectElement, items: readonly { readonly id: string; readonly label: string }[], current: string): void {
  select.replaceChildren(...items.map((item) => h("option", { value: item.id, selected: item.id === current }, item.label)));
}

/** The panel of the laws. It checks the laws again at each change of a setting. */
export class LawPanel {
  private readonly seed = byId<HTMLInputElement>("seed");
  private readonly count = byId<HTMLSelectElement>("count");
  private readonly typed = byId<HTMLInputElement>("typed");
  private readonly broken = byId<HTMLInputElement>("broken");
  private readonly mapF = byId<HTMLSelectElement>("map-f");
  private readonly mapG = byId<HTMLSelectElement>("map-g");
  private readonly flatF = byId<HTMLSelectElement>("flat-f");
  private readonly flatG = byId<HTMLSelectElement>("flat-g");
  private readonly filterP = byId<HTMLSelectElement>("filter-p");
  private readonly filterQ = byId<HTMLSelectElement>("filter-q");
  /** The case that each law shows in its detail line, by the ID of the law. */
  private readonly selected = new Map<string, number>();
  private round = 1;

  constructor() {
    this.count.replaceChildren(...COUNTS.map((n) => h("option", { value: n, selected: n === 200 }, `${n} cases`)));
    options(this.mapF, MAP_FNS, "double");
    options(this.mapG, MAP_FNS, "inc");
    options(this.flatF, FLAT_FNS, "sqrt");
    options(this.flatG, FLAT_FNS, "divide");
    options(this.filterP, FILTER_FNS, "even");
    options(this.filterQ, FILTER_FNS, "positive");
    for (const el of [this.seed, this.typed]) el.addEventListener("input", () => this.check());
    for (const el of [this.count, this.mapF, this.mapG, this.flatF, this.flatG, this.filterP, this.filterQ, this.broken]) el.addEventListener("change", () => this.check());
    byId("new-seed").addEventListener("click", () => {
      this.round += 1;
      this.seed.value = `optional-${this.round}`;
      this.check();
    });
    byId("run-laws").addEventListener("click", () => this.check());
    byId("law-list").addEventListener("click", (event) => {
      const cell = (event.target as Element).closest<HTMLElement>(".cell");
      const law = cell?.closest<HTMLElement>(".law");
      if (!cell || !law) return;
      this.selected.set(law.dataset["law"]!, Number(cell.dataset["i"]));
      this.check(false);
    });
    this.check();
  }

  private settings(): Settings {
    const typedText = this.typed.value.trim();
    const typed = typedText === "" ? undefined : Number(typedText);
    const badTyped = typed !== undefined && !Number.isFinite(typed);
    if (badTyped) this.typed.setAttribute("aria-invalid", "true");
    else this.typed.removeAttribute("aria-invalid");
    return {
      seed: this.seed.value,
      count: Number(this.count.value),
      mapF: this.mapF.value,
      mapG: this.mapG.value,
      flatF: this.flatF.value,
      flatG: this.flatG.value,
      filterP: this.filterP.value,
      filterQ: this.filterQ.value,
      typed: badTyped ? undefined : typed,
      broken: this.broken.checked,
    };
  }

  /** This function checks the laws and draws the cards. With `fresh`, each card shows its first failed case again. */
  check(fresh = true): void {
    const settings = this.settings();
    if (fresh) this.selected.clear();
    const results = checkLaws(settings);
    byId("law-list").replaceChildren(...results.map((law) => this.card(law)));
    const passing = results.filter((r) => r.passed === r.cases.length).length;
    const summary = byId("law-summary");
    summary.dataset["ok"] = String(passing === results.length);
    summary.textContent = `${passing} of ${results.length} laws pass on ${settings.count} cases of the seed "${settings.seed}"${settings.broken ? ", with the broken map and flatMap" : ""}.`;
  }

  private card(law: LawResult): HTMLElement {
    const ok = law.passed === law.cases.length;
    const firstBad = law.cases.findIndex((c) => !c.ok);
    const index = this.selected.get(law.id) ?? (firstBad >= 0 ? firstBad : 0);
    const shown = law.cases[index]!;
    const cells = h(
      "div",
      { class: "cells", role: "img", "aria-label": `${law.passed} of ${law.cases.length} cases pass` },
      ...law.cases.map((c, i) => h("span", { class: cellClass(c, i === index), "data-i": i, title: `${c.input}: ${c.ok ? "pass" : "fail"}` })),
    );
    return h(
      "article",
      { class: "law", "data-law": law.id, "data-ok": String(ok) },
      h(
        "header",
        {},
        h("span", { class: "family" }, law.family === "functor" ? "Functor" : law.family === "monad" ? "Monad" : "Filter"),
        h("h3", {}, law.name),
        h("span", { class: "badge" }, ok ? "pass" : "fail", " ", h("span", { class: "count" }, `${law.passed} / ${law.cases.length}`)),
      ),
      h("p", { class: "eq" }, h("code", {}, law.left), h("span", { class: "equals" }, " = "), h("code", {}, law.right)),
      cells,
      detail(shown, index),
    );
  }
}

function cellClass(c: Case, on: boolean): string {
  return ["cell", c.ok ? "pass" : "fail", c.absent ? "absent" : "present", c.typed ? "typed" : "", on ? "on" : ""].filter((x) => x !== "").join(" ");
}

function detail(c: Case, index: number): HTMLElement {
  return h(
    "p",
    { class: "case", "data-ok": String(c.ok) },
    h("span", { class: "which" }, c.typed ? "Your value" : `Case ${index + 1}`),
    " ",
    h("code", {}, c.input),
    h("span", { class: "sides" }, " left ", h("code", {}, c.left), c.ok ? " = " : " ≠ ", "right ", h("code", {}, c.right)),
  );
}
