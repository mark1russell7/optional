// The pipeline playground: the controls of the builder, and the track that shows the value after each step.
import { byId, copyText, h } from "./chrome.ts";
import {
  code,
  ENDS,
  inputText,
  MAX_STEPS,
  parseInput,
  PRESETS,
  QUICK_INPUTS,
  run,
  STARTS,
  STEPS,
  type Input,
  type Pipeline,
  type State,
  type Station,
} from "./pipeline.ts";

/** The x positions of the lanes of the rail, in the units of its SVG (the rail is 80 units wide). */
const LANE: Readonly<Record<"value" | "some" | "none", number>> = { value: 40, some: 22, none: 58 };

function lane(state: State): number {
  if (state === "some") return LANE.some;
  if (state === "none" || state === "skipped" || state === "error" || state === "not-run") return LANE.none;
  return LANE.value;
}

const SVG = "http://www.w3.org/2000/svg";

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Readonly<Record<string, string>>): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG, tag);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
  return el;
}

/** This function draws the rail of one station: the line from the lane of the station before, and the dot. */
function rail(from: number, state: State, last: boolean): HTMLElement {
  const to = lane(state);
  const svg = svgEl("svg", { viewBox: "0 0 80 100", preserveAspectRatio: "none", "aria-hidden": "true", focusable: "false" });
  svg.append(
    svgEl("path", { class: `line in s-${state}`, d: `M ${from} 0 C ${from} 30, ${to} 20, ${to} 50`, "vector-effect": "non-scaling-stroke" }),
  );
  if (!last) svg.append(svgEl("path", { class: `line out s-${state}`, d: `M ${to} 50 L ${to} 100`, "vector-effect": "non-scaling-stroke" }));
  const dot = h("span", { class: `dot s-${state}`, style: `left: ${(to / 80) * 100}%` });
  return h("div", { class: "rail", "aria-hidden": "true" }, svg, dot);
}

const STATE_WORD: Readonly<Record<State, string>> = {
  some: "some",
  none: "none",
  skipped: "skipped",
  value: "value",
  error: "throws",
  "not-run": "not run",
};

/** A group of radio buttons. */
function radios<T extends { readonly id: string; readonly label: string }>(
  container: HTMLElement,
  items: readonly T[],
  current: () => string,
  choose: (id: string) => void,
): () => void {
  const buttons = items.map((item) => {
    const button = h("button", { type: "button", role: "radio", "data-id": item.id }, item.label);
    button.addEventListener("click", () => choose(item.id));
    return button;
  });
  container.replaceChildren(...buttons);
  container.addEventListener("keydown", (event) => {
    const step = ({ ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 } as Record<string, number>)[event.key];
    if (step === undefined) return;
    event.preventDefault();
    const index = items.findIndex((item) => item.id === current());
    const next = items[(index + step + items.length) % items.length]!;
    choose(next.id);
    buttons.find((b) => b.dataset["id"] === next.id)?.focus();
  });
  return () => {
    for (const button of buttons) {
      const on = button.dataset["id"] === current();
      button.setAttribute("aria-checked", String(on));
      button.tabIndex = on ? 0 : -1;
    }
  };
}

/** The playground of the page. It owns the pipeline, and it draws the track at each change. */
export class Playground {
  private pipeline: Pipeline;
  private readonly showStart: () => void;
  private readonly showEnd: () => void;
  private readonly value = byId<HTMLInputElement>("value");
  private readonly hint = byId("value-hint");

  constructor() {
    this.pipeline = PRESETS[0]!.pipeline;

    byId("presets").replaceChildren(
      ...PRESETS.map((preset) => {
        const button = h("button", { type: "button", class: "chip", "data-preset": preset.id }, preset.label);
        button.addEventListener("click", () => this.set(preset.pipeline, true));
        return button;
      }),
    );

    byId("quick").replaceChildren(
      ...QUICK_INPUTS.map((input) => {
        const text = inputText(input);
        const button = h("button", { type: "button", class: "chip mono", "data-input": text, "aria-label": `Input ${text}` }, text);
        button.addEventListener("click", () => this.set({ ...this.pipeline, input }, true));
        return button;
      }),
    );

    this.value.addEventListener("input", () => {
      const parsed = parseInput(this.value.value);
      if (parsed.ok) {
        this.value.removeAttribute("aria-invalid");
        this.set({ ...this.pipeline, input: parsed.input }, false);
      } else {
        this.value.setAttribute("aria-invalid", "true");
        this.hint.textContent = parsed.reason;
        this.hint.classList.add("bad");
      }
    });

    this.showStart = radios(byId("starts"), STARTS, () => this.pipeline.start, (id) => this.set({ ...this.pipeline, start: id }, false));
    this.showEnd = radios(byId("ends"), ENDS, () => this.pipeline.end, (id) => this.set({ ...this.pipeline, end: id }, false));

    byId("palette").replaceChildren(
      ...STEPS.map((step) => {
        const button = h("button", { type: "button", class: `chip add k-${step.fn.kind}`, "data-add": step.id }, h("span", { "aria-hidden": "true" }, "+ "), step.label);
        button.setAttribute("aria-label", `Add the step ${step.label}`);
        button.addEventListener("click", () => {
          if (this.pipeline.steps.length >= MAX_STEPS) return;
          this.set({ ...this.pipeline, steps: [...this.pipeline.steps, step.id] }, false);
        });
        return button;
      }),
    );

    const copy = byId<HTMLButtonElement>("copy-code");
    copy.addEventListener("click", () => void copyText(copy, code(this.pipeline)));

    this.render(true);
  }

  /** This function sets a new pipeline and draws it. With `fill`, the input box gets the text of the input. */
  set(pipeline: Pipeline, fill: boolean): void {
    this.pipeline = pipeline;
    this.render(fill);
  }

  private render(fill: boolean): void {
    const p = this.pipeline;
    if (fill) {
      this.value.value = inputText(p.input);
      this.value.removeAttribute("aria-invalid");
    }
    this.hint.classList.remove("bad");
    this.hint.textContent = "A number, null, undefined or throw (a read that throws).";
    for (const chip of document.querySelectorAll<HTMLButtonElement>("#quick .chip")) {
      chip.setAttribute("aria-pressed", String(chip.dataset["input"] === inputText(p.input)));
    }
    for (const chip of document.querySelectorAll<HTMLButtonElement>("#presets .chip")) {
      const preset = PRESETS.find((entry) => entry.id === chip.dataset["preset"]);
      chip.setAttribute("aria-pressed", String(preset !== undefined && same(preset.pipeline, p)));
    }
    this.showStart();
    this.showEnd();
    this.renderSteps();
    this.renderTrack();
    byId("code").textContent = code(p);
  }

  private renderSteps(): void {
    const list = byId("steps");
    const steps = this.pipeline.steps;
    if (steps.length === 0) {
      list.replaceChildren(h("li", { class: "empty" }, "No steps. Add one below."));
    } else {
      list.replaceChildren(
        ...steps.map((id, i) => {
          const step = STEPS.find((s) => s.id === id)!;
          const up = h("button", { type: "button", class: "icon", "aria-label": `Move ${step.label} up`, disabled: i === 0 }, "↑");
          up.addEventListener("click", () => {
            const next = [...steps];
            [next[i - 1], next[i]] = [next[i]!, next[i - 1]!];
            this.set({ ...this.pipeline, steps: next }, false);
          });
          const remove = h("button", { type: "button", class: "icon", "aria-label": `Remove ${step.label}` }, "×");
          remove.addEventListener("click", () => this.set({ ...this.pipeline, steps: steps.filter((_, j) => j !== i) }, false));
          return h("li", { class: `step k-${step.fn.kind}`, "data-step": id }, h("span", { class: "n" }, String(i + 1)), h("span", { class: "name" }, step.label), up, remove);
        }),
      );
    }
    const full = steps.length >= MAX_STEPS;
    for (const button of document.querySelectorAll<HTMLButtonElement>("#palette button")) button.disabled = full;
    byId("steps-count").textContent = full ? `${steps.length} of ${MAX_STEPS}: the list is full` : `${steps.length} of ${MAX_STEPS}`;
  }

  private renderTrack(): void {
    const trace = run(this.pipeline);
    const input = this.pipeline.input;
    const stations: HTMLElement[] = [];
    stations.push(
      h(
        "li",
        { class: "station input", "data-state": "value" },
        rail(LANE.value, "value", trace.stations.length === 0),
        h("div", { class: "body" }, h("div", { class: "row1" }, h("span", { class: "op" }, "input x"), h("span", { class: "val s-value" }, inputText(input))), h("p", { class: "note" }, describeInput(input))),
      ),
    );
    let from = LANE.value;
    trace.stations.forEach((station, i) => {
      stations.push(this.station(station, from, i === trace.stations.length - 1, i));
      from = lane(station.state);
    });
    byId("track").replaceChildren(...stations);

    const result = byId("result");
    result.dataset["state"] = trace.state;
    byId("result-value").textContent = trace.result;
    byId("result-kind").textContent = resultWord(trace.state);
    byId("summary").textContent = [inputText(input), ...trace.stations.filter((s) => s.state !== "not-run").map((s) => (s.state === "skipped" ? "none" : s.shown))].join(" → ");
  }

  private station(station: Station, from: number, last: boolean, index: number): HTMLElement {
    return h(
      "li",
      { class: `station ${station.kind}`, "data-state": station.state, "data-index": index },
      rail(from, station.state, last),
      h(
        "div",
        { class: "body" },
        h("div", { class: "row1" }, h("span", { class: "op" }, station.label), h("span", { class: `val s-${station.state}` }, station.state === "skipped" ? "none" : station.shown)),
        h("code", { class: "code" }, station.code),
        h("p", { class: "note" }, h("span", { class: `tag s-${station.state}` }, STATE_WORD[station.state]), " ", station.note),
      ),
    );
  }
}

function describeInput(input: Input): string {
  if (typeof input === "number") return "A number.";
  if (input === null) return "The value null.";
  if (input === undefined) return "The value undefined.";
  return "The read of the value throws an error.";
}

function resultWord(state: State): string {
  if (state === "some") return "an optional: some";
  if (state === "none") return "an optional: none";
  if (state === "error") return "the pipeline stopped";
  return "a plain value";
}

function same(a: Pipeline, b: Pipeline): boolean {
  return Object.is(a.input, b.input) && a.start === b.start && a.end === b.end && a.steps.join() === b.steps.join();
}
