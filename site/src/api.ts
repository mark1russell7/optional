// The API table of the README, with one live example for each export. The page calls each example
// with the functions of the package and shows the result.
import {
  err,
  filter,
  flatMap,
  flatMapResult,
  fromNullable,
  fromOptional,
  fromSentinel,
  getOkOr,
  getOr,
  isErr,
  isNone,
  isOk,
  isSome,
  map,
  mapErr,
  mapResult,
  none,
  ok,
  some,
  toOptional,
  toSentinel,
  tryCatch,
  tryCatchAsync,
  unwrap,
  type Optional,
  type Result,
} from "@mark1russell7/optional";
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
  {
    names: ["Result<T, E>", "Ok<T>", "Err<E>"],
    what: "The types: { tag: \"ok\", value } or { tag: \"err\", error }.",
    examples: [{ code: "JSON.stringify(err(\"no key\"))", run: () => JSON.stringify(err("no key")) }],
  },
  {
    names: ["ok(value)", "err(error)", "isOk(r)", "isErr(r)"],
    what: "The two kinds of result, and their type guards.",
    examples: [
      { code: "ok(4)", run: () => ok(4) },
      { code: "isErr(err(1))", run: () => isErr(err(1)) },
      { code: "isOk(err(1))", run: () => isOk(err(1)) },
    ],
  },
  {
    names: ["mapResult(r, f)", "flatMapResult(r, f)", "mapErr(r, f)"],
    what: "The function f applies to a value, or to an error for mapErr. The other kind stays the same.",
    examples: [
      { code: "mapResult(ok(4), (w) => w * 2)", run: () => mapResult(ok(4), (w: number) => w * 2) },
      { code: "flatMapResult(ok(3), (x) => (x > 5 ? ok(x) : err(\"small\")))", run: () => flatMapResult(ok(3), (x: number) => (x > 5 ? ok(x) : err("small"))) },
      { code: "mapErr(err(404), (code) => `HTTP ${code}`)", run: () => mapErr(err(404), (code: number) => `HTTP ${String(code)}`) },
    ],
  },
  {
    names: ["getOkOr(r, fallback)"],
    what: "The value, or the fallback for an error.",
    examples: [{ code: "getOkOr(err(\"no key\"), 0)", run: () => getOkOr(err("no key"), 0) }],
  },
  {
    names: ["tryCatch(f, onError?)", "tryCatchAsync(f, onError?)"],
    what: "ok of the value of f, or err of the thrown value or the rejection.",
    examples: [
      { code: "tryCatch(() => JSON.parse(\"{\"), (e) => e.name)", run: () => tryCatch(() => JSON.parse("{") as unknown, (e) => (e as Error).name) },
      { code: "tryCatch(() => JSON.parse(\"2\"))", run: () => tryCatch(() => JSON.parse("2") as unknown) },
      { code: "typeof tryCatchAsync(async () => 1).then", run: () => typeof tryCatchAsync(async () => 1).then },
    ],
  },
  {
    names: ["fromOptional(o, error)", "toOptional(r)"],
    what: "The change between an optional and a result.",
    examples: [
      { code: "fromOptional(none, \"absent\")", run: () => fromOptional(none, "absent") },
      { code: "toOptional(err(1))", run: () => toOptional(err(1)) },
    ],
  },
];

function isResult(value: unknown): value is Result<unknown, unknown> {
  if (typeof value !== "object" || value === null || !("tag" in value)) return false;
  return (value.tag === "ok" && "value" in value) || (value.tag === "err" && "error" in value);
}

/** This function gives the text of a result: `ok(x)` or `err(x)`. */
export function showResult(r: Result<unknown, unknown>): string {
  return isOk(r) ? `ok(${showValue(r.value)})` : `err(${showValue(r.error)})`;
}

function isOptional(value: unknown): value is Optional<unknown> {
  if (typeof value !== "object" || value === null || !("tag" in value)) return false;
  return value.tag === "none" || (value.tag === "some" && "value" in value);
}

/** This function gives the result of an example as text. An optional shows as `some(x)` or `none`, a result as `ok(x)` or `err(x)`, and a string as it is. */
export function result(example: Example): string {
  const value = example.run();
  if (typeof value === "string") return value;
  if (isResult(value)) return showResult(value);
  return isOptional(value) ? showOptional(value) : showValue(value);
}
