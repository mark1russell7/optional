// The model of the pipeline playground: an input, a start step, a list of steps and an end step.
// Each step calls the real functions of @mark1russell7/optional. The trace tells the value after each step.
import { flatMap, fromNullable, fromSentinel, getOr, isSome, map, none, some, toSentinel, unwrap, type Optional } from "@mark1russell7/optional";

/** The marker of the input "a read that throws". */
export const THROWS: unique symbol = Symbol("throws");

/** The input of a pipeline: a number, `null`, `undefined` or a read that throws. */
export type Input = number | null | undefined | typeof THROWS;

/** The result of the parse of the text of the input box. */
export type Parsed = { readonly ok: true; readonly input: Input } | { readonly ok: false; readonly reason: string };

/** This function reads the text of the input box: a number, `null`, `undefined` or `throw`. */
export function parseInput(text: string): Parsed {
  const t = text.trim();
  if (t === "null") return { ok: true, input: null };
  if (t === "undefined") return { ok: true, input: undefined };
  if (t === "throw") return { ok: true, input: THROWS };
  if (t !== "" && /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t)) return { ok: true, input: Number(t) };
  return { ok: false, reason: "Type a number, null, undefined or throw." };
}

/** This function gives the text of an input, as the input box shows it. */
export function inputText(input: Input): string {
  if (input === THROWS) return "throw";
  return String(input);
}

/** The read of the input. For the input `throw`, the read throws an error. */
function read(input: Input): number | null | undefined {
  if (input === THROWS) throw new Error("the read failed");
  return input;
}

/** The first step: it changes the input into an optional. */
export interface Start {
  readonly id: string;
  readonly label: string;
  /** The code of the step, with `x` for the input. */
  readonly code: string;
  readonly hint: string;
  /** `true` when the step catches an exception of the read. */
  readonly catches: boolean;
  readonly run: (x: number | null | undefined) => Optional<unknown>;
}

/** The start steps. */
export const STARTS: readonly Start[] = [
  { id: "fromNullable", label: "fromNullable", code: "fromNullable(x)", hint: "null and undefined become none.", catches: false, run: (x) => fromNullable(x) },
  { id: "some", label: "some", code: "some(x)", hint: "Each value becomes some, also null.", catches: false, run: (x) => some(x) },
  { id: "fromSentinel", label: "fromSentinel −1", code: "fromSentinel(x, -1)", hint: "The value −1 becomes none.", catches: false, run: (x) => fromSentinel(x, -1) },
  {
    id: "try",
    label: "try + fromNullable",
    code: "try { fromNullable(x) } catch { none }",
    hint: "An exception of the read becomes none.",
    catches: true,
    run: (x) => fromNullable(x),
  },
];

/** A function of a step. `map` steps give a number, `flatMap` steps give an optional. */
export type StepFn = { readonly kind: "map"; readonly f: (x: number) => number } | { readonly kind: "flatMap"; readonly f: (x: number) => Optional<number> };

/** A step between the start and the end: a `map` or a `flatMap` with a function. */
export interface Step {
  readonly id: string;
  readonly label: string;
  /** The code of the step, with `o` for the optional of the step before. */
  readonly code: string;
  readonly fn: StepFn;
}

/** The steps that the playground can add. */
export const STEPS: readonly Step[] = [
  { id: "double", label: "map × 2", code: "map(o, (x) => x * 2)", fn: { kind: "map", f: (x) => x * 2 } },
  { id: "inc", label: "map + 1", code: "map(o, (x) => x + 1)", fn: { kind: "map", f: (x) => x + 1 } },
  { id: "negate", label: "map −x", code: "map(o, (x) => -x)", fn: { kind: "map", f: (x) => -x } },
  { id: "sqrt", label: "flatMap √x", code: "flatMap(o, (x) => (x >= 0 ? some(Math.sqrt(x)) : none))", fn: { kind: "flatMap", f: (x) => (x >= 0 ? some(Math.sqrt(x)) : none) } },
  { id: "divide", label: "flatMap 100 ÷ x", code: "flatMap(o, (x) => (x !== 0 ? some(100 / x) : none))", fn: { kind: "flatMap", f: (x) => (x !== 0 ? some(100 / x) : none) } },
  { id: "even", label: "keep even", code: "flatMap(o, (x) => (x % 2 === 0 ? some(x) : none))", fn: { kind: "flatMap", f: (x) => (x % 2 === 0 ? some(x) : none) } },
  { id: "positive", label: "keep x > 0", code: "flatMap(o, (x) => (x > 0 ? some(x) : none))", fn: { kind: "flatMap", f: (x) => (x > 0 ? some(x) : none) } },
];

/** The last step: it keeps the optional, or it changes it into a plain value. */
export interface End {
  readonly id: string;
  readonly label: string;
  readonly code: string;
  /** `null` for the end step that keeps the optional. */
  readonly run: ((o: Optional<unknown>) => unknown) | null;
}

/** The end steps. */
export const ENDS: readonly End[] = [
  { id: "getOr", label: "getOr 0", code: "getOr(o, 0)", run: (o) => getOr(o, 0) },
  { id: "unwrap", label: "unwrap", code: "unwrap(o)", run: (o) => unwrap(o) },
  { id: "toSentinel", label: "toSentinel −1", code: "toSentinel(o, -1)", run: (o) => toSentinel(o, -1) },
  { id: "isSome", label: "isSome", code: "isSome(o)", run: (o) => isSome(o) },
  { id: "keep", label: "keep the optional", code: "o", run: null },
];

/** A pipeline: the input and the IDs of its steps. */
export interface Pipeline {
  readonly input: Input;
  readonly start: string;
  readonly steps: readonly string[];
  readonly end: string;
}

/** The state of a station of the track. */
export type State = "some" | "none" | "skipped" | "value" | "error" | "not-run";

/** One station of the track: one step and its result. */
export interface Station {
  readonly kind: "start" | "step" | "end";
  readonly label: string;
  readonly code: string;
  readonly state: State;
  /** The result as text, for example `some(4)`, `none` or `8`. */
  readonly shown: string;
  /** A short note on the step: what the function did, or why it did not operate. */
  readonly note: string;
}

/** The trace of a pipeline: the stations and the result. */
export interface Trace {
  readonly stations: readonly Station[];
  /** The result as text. */
  readonly result: string;
  /** The state of the result. */
  readonly state: State;
}

/** This function gives the text of a plain value: a number with at most 4 decimals, a boolean, `null` or `undefined`. */
export function showValue(value: unknown): string {
  if (typeof value === "number") {
    if (Number.isNaN(value)) return "NaN";
    if (Object.is(value, -0)) return "0";
    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(4)));
  }
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return JSON.stringify(value);
  return String(value);
}

/** This function gives the text of an optional: `some(value)` or `none`. */
export function showOptional(o: Optional<unknown>): string {
  return isSome(o) ? `some(${showValue(o.value)})` : "none";
}

function byId<T extends { readonly id: string }>(list: readonly T[], id: string): T {
  const item = list.find((entry) => entry.id === id);
  if (item === undefined) throw new Error(`There is no step "${id}".`);
  return item;
}

/** This function starts a pipeline with the functions of the package, and records each station. */
export function run(pipeline: Pipeline): Trace {
  const start = byId(STARTS, pipeline.start);
  const steps = pipeline.steps.map((id) => byId(STEPS, id));
  const end = byId(ENDS, pipeline.end);
  const stations: Station[] = [];
  const stopped = (label: string, code: string, kind: Station["kind"]): Station => ({ kind, label, code, state: "not-run", shown: "not run", note: "The exception stopped the pipeline." });

  let o: Optional<unknown>;
  try {
    o = start.run(read(pipeline.input));
  } catch (error) {
    if (!start.catches) {
      const message = error instanceof Error ? error.message : String(error);
      stations.push({ kind: "start", label: start.label, code: start.code, state: "error", shown: "throws", note: `Error: ${message}. Nothing catches it.` });
      for (const step of steps) stations.push(stopped(step.label, step.code, "step"));
      if (end.run !== null) stations.push(stopped(end.label, end.code, "end"));
      return { stations, result: "an exception", state: "error" };
    }
    o = none;
  }
  stations.push({
    kind: "start",
    label: start.label,
    code: start.code,
    state: isSome(o) ? "some" : "none",
    shown: showOptional(o),
    note: pipeline.input === THROWS && start.catches ? "The read threw. The catch gave none." : start.hint,
  });

  for (const step of steps) {
    // The counter shows if the function ran. The functions of the package call it only for a present value.
    let calls = 0;
    const before = o;
    const value = o as Optional<number>;
    if (step.fn.kind === "map") {
      const f = step.fn.f;
      o = map(value, (x) => {
        calls += 1;
        return f(x);
      });
    } else {
      const f = step.fn.f;
      o = flatMap(value, (x) => {
        calls += 1;
        return f(x);
      });
    }
    const state: State = calls === 0 ? "skipped" : isSome(o) ? "some" : "none";
    const note =
      calls === 0
        ? "The value is none, so the function did not run."
        : isSome(o)
          ? `The function got ${showValue(isSome(before) ? before.value : undefined)}.`
          : `The function got ${showValue(isSome(before) ? before.value : undefined)} and gave none.`;
    stations.push({ kind: "step", label: step.label, code: step.code, state, shown: showOptional(o), note });
  }

  if (end.run === null) return { stations, result: showOptional(o), state: isSome(o) ? "some" : "none" };
  const out = end.run(o);
  stations.push({
    kind: "end",
    label: end.label,
    code: end.code,
    state: "value",
    shown: showValue(out),
    note: isSome(o) ? "The present value comes out." : "The value is none, so the default comes out.",
  });
  return { stations, result: showValue(out), state: "value" };
}

/** This function gives the TypeScript code of a pipeline, with the imports from the package. */
export function code(pipeline: Pipeline): string {
  const start = byId(STARTS, pipeline.start);
  const steps = pipeline.steps.map((id) => byId(STEPS, id));
  const end = byId(ENDS, pipeline.end);
  const used = new Set<string>();
  const lines: string[] = [];
  const x = pipeline.input === THROWS ? "read() // throws" : inputText(pipeline.input);
  if (start.id === "try") {
    used.add("fromNullable").add("none");
    lines.push("let o0: Optional<number>;", `try { o0 = fromNullable(${pipeline.input === THROWS ? "read()" : x}); } catch { o0 = none; }`);
  } else {
    used.add(start.id);
    lines.push(`const o0 = ${start.code.replace("(x", `(${pipeline.input === THROWS ? "read()" : x}`)};${pipeline.input === THROWS ? " // read() throws" : ""}`);
  }
  steps.forEach((step, i) => {
    used.add(step.fn.kind);
    if (step.fn.kind === "flatMap") used.add("some").add("none");
    lines.push(`const o${i + 1} = ${step.code.replace("(o,", `(o${i},`)};`);
  });
  const last = `o${steps.length}`;
  if (end.run !== null) {
    used.add(end.id);
    lines.push(`const result = ${end.code.replace("(o", `(${last}`)};`);
  } else {
    lines.push(`const result = ${last};`);
  }
  const names = [...used].sort();
  const typeImport = start.id === "try" ? ", type Optional" : "";
  return [`import { ${names.join(", ")}${typeImport} } from "@mark1russell7/optional";`, "", ...lines].join("\n");
}

/** A named pipeline that the playground offers. */
export interface Preset {
  readonly id: string;
  readonly label: string;
  readonly pipeline: Pipeline;
}

/** The presets of the playground. The first one is the start state of the page. */
export const PRESETS: readonly Preset[] = [
  { id: "root", label: "Square root, then double", pipeline: { input: 16, start: "fromNullable", steps: ["sqrt", "double"], end: "getOr" } },
  { id: "divide", label: "Safe division", pipeline: { input: 0, start: "fromNullable", steps: ["divide", "inc"], end: "getOr" } },
  { id: "missing", label: "A missing value", pipeline: { input: null, start: "fromNullable", steps: ["double", "inc"], end: "getOr" } },
  { id: "why", label: "Why fromNullable", pipeline: { input: null, start: "some", steps: ["double"], end: "keep" } },
  { id: "throws", label: "A read that throws", pipeline: { input: THROWS, start: "try", steps: ["double"], end: "getOr" } },
  { id: "sentinel", label: "A sentinel value", pipeline: { input: -1, start: "fromSentinel", steps: ["inc"], end: "toSentinel" } },
];

/** The quick inputs of the playground. */
export const QUICK_INPUTS: readonly Input[] = [16, -9, 0, 7, null, undefined, THROWS];

/** The most steps between the start and the end. */
export const MAX_STEPS = 6;
