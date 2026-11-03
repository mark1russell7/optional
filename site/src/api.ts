// The API table of the README, with one live example for each export. The page calls each example
// with the functions of the package and shows the result.
import { filter, flatMap, fromNullable, fromSentinel, getOr, isNone, isSome, map, none, some, toSentinel, unwrap, type Optional } from "@mark1russell7/optional";
import { showOptional, showValue } from "./pipeline.ts";

/** One example of an export: its code and the call that gives its result. */
export interface Example {
  readonly code: string;
  readonly run: () => unknown;
}

/** One row of the API table. */
export interface ApiRow {
  readonly names: readonly string[];
  readonly what: string;
  readonly examples: readonly Example[];
}

/** The rows of the API table, in the order of the README. */
export const API: readonly ApiRow[] = [
  {
    names: ["Optional<T>", "Some<T>", "None"],
    what: "The types: { tag: \"some\", value } or { tag: \"none\" }.",
    examples: [{ code: "JSON.stringify(some(4))", run: () => JSON.stringify(some(4)) }],
  },
  {
    names: ["some(value)", "none"],
    what: "The two kinds of value. The value none is one frozen object.",
    examples: [
      { code: "some(4)", run: () => some(4) },
      { code: "Object.isFrozen(none)", run: () => Object.isFrozen(none) },
    ],
  },
  {
    names: ["isSome(o)", "isNone(o)"],
    what: "The type guards.",
    examples: [
      { code: "isSome(some(0))", run: () => isSome(some(0)) },
      { code: "isNone(none)", run: () => isNone(none) },
    ],
  },
  {
    names: ["map(o, f)", "flatMap(o, f)"],
    what: "The function f applies to a present value. An absent value stays absent.",
    examples: [
      { code: "map(some(4), (w) => w * 2)", run: () => map(some(4), (w) => w * 2) },
      { code: "flatMap(some(3), (x) => (x > 5 ? some(x) : none))", run: () => flatMap(some(3), (x) => (x > 5 ? some(x) : none)) },
    ],
  },
  {
    names: ["filter(o, p)"],
    what: "The present value stays when p is true for it. Otherwise, the result is none.",
    examples: [
      { code: "filter(some(4), (x) => x % 2 === 0)", run: () => filter(some(4), (x) => x % 2 === 0) },
      { code: "filter(some(3), (x) => x % 2 === 0)", run: () => filter(some(3), (x) => x % 2 === 0) },
    ],
  },
  {
    names: ["unwrap(o)", "getOr(o, fallback)"],
    what: "The present value, or undefined, or the fallback.",
    examples: [
      { code: "unwrap(none)", run: () => unwrap(none) },
      { code: "getOr(none, 9)", run: () => getOr(none, 9) },
    ],
  },
  {
    names: ["fromNullable(value)"],
    what: "The value none for null and undefined, else some(value).",
    examples: [
      { code: "fromNullable(undefined)", run: () => fromNullable(undefined) },
      { code: "fromNullable(0)", run: () => fromNullable(0) },
    ],
  },
  {
    names: ["fromSentinel(value, sentinel)", "toSentinel(o, sentinel)"],
    what: "The change between this form and a sentinel form.",
    examples: [
      { code: "fromSentinel(-1, -1)", run: () => fromSentinel(-1, -1) },
      { code: "toSentinel(none, -1)", run: () => toSentinel(none, -1) },
    ],
  },
];

function isOptional(value: unknown): value is Optional<unknown> {
  if (typeof value !== "object" || value === null || !("tag" in value)) return false;
  return value.tag === "none" || (value.tag === "some" && "value" in value);
}

/** This function gives the result of an example as text. An optional shows as `some(x)` or `none`, and a string shows as it is. */
export function result(example: Example): string {
  const value = example.run();
  if (typeof value === "string") return value;
  return isOptional(value) ? showOptional(value) : showValue(value);
}
