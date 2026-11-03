// The live check of the laws. The cases come from a seeded generator of @mark1russell7/rigor-generators,
// so a seed always gives the same cases. The functions under test are map, flatMap and filter of the package.
import { filter, flatMap, isSome, map, none, some, type Optional } from "@mark1russell7/optional";
import { random } from "@mark1russell7/rigor-generators";
import { showOptional, showValue, STEPS } from "./pipeline.ts";

/** The `map`, the `flatMap` and the `filter` that the laws examine. */
export interface Impl {
  readonly map: <T, U>(o: Optional<T>, f: (v: T) => U) => Optional<U>;
  readonly flatMap: <T, U>(o: Optional<T>, f: (v: T) => Optional<U>) => Optional<U>;
  readonly filter: <T>(o: Optional<T>, p: (v: T) => boolean) => Optional<T>;
}

/** The functions of the package. */
export const PACKAGE: Impl = { map, flatMap, filter };

/**
 * A broken implementation, to show a failure. For an absent value, `map` and `flatMap` apply `f` to 0. Only the two
 * identity laws on `o` find this error. Its `filter` is the filter of the package.
 */
export const BROKEN: Impl = {
  map: <T, U>(o: Optional<T>, f: (v: T) => U): Optional<U> => (isSome(o) ? some(f(o.value)) : some(f(0 as T))),
  flatMap: <T, U>(o: Optional<T>, f: (v: T) => Optional<U>): Optional<U> => (isSome(o) ? f(o.value) : f(0 as T)),
  filter,
};

/** This function tells if two optionals are equal: the same tag, and the same value by `Object.is`. */
export function same(a: Optional<unknown>, b: Optional<unknown>): boolean {
  if (isSome(a) && isSome(b)) return Object.is(a.value, b.value);
  return a.tag === b.tag;
}

/** The functions that the functor laws can use. */
export const MAP_FNS = STEPS.flatMap((s) => (s.fn.kind === "map" ? [{ id: s.id, label: s.label.replace(/^map /, ""), f: s.fn.f }] : []));
/** The functions that the monad laws can use. */
export const FLAT_FNS = STEPS.flatMap((s) => (s.fn.kind === "flatMap" ? [{ id: s.id, label: s.label.replace(/^flatMap /, ""), f: s.fn.f }] : []));

/** The predicates of the filter laws: the `filter` steps of the playground. */
export const FILTER_FNS = STEPS.flatMap((s) => (s.fn.kind === "filter" ? [{ id: s.id, label: s.label.replace(/^filter /, ""), p: s.fn.p }] : []));

/** One case of a law: the input, and the two sides of the equation. */
export interface Case {
  readonly input: string;
  readonly left: string;
  readonly right: string;
  readonly ok: boolean;
  /** `true` when the input of the case is absent. */
  readonly absent: boolean;
  /** `true` for the value that the visitor typed. */
  readonly typed: boolean;
}

/** The result of one law over all the cases. */
export interface LawResult {
  readonly id: string;
  readonly family: "functor" | "monad" | "filter";
  readonly name: string;
  readonly left: string;
  readonly right: string;
  readonly cases: readonly Case[];
  readonly passed: number;
}

/** The settings of a check. */
export interface Settings {
  readonly seed: string;
  readonly count: number;
  /** The ID of `f` and of `g` of the functor laws, from `MAP_FNS`. */
  readonly mapF: string;
  readonly mapG: string;
  /** The ID of `f` and of `g` of the monad laws, from `FLAT_FNS`. */
  readonly flatF: string;
  readonly flatG: string;
  /** The ID of `p` and of `q` of the filter laws, from `FILTER_FNS`. The defaults are `even` and `positive`. */
  readonly filterP?: string | undefined;
  readonly filterQ?: string | undefined;
  /** A value that the visitor typed. It is the first case of each law. */
  readonly typed?: number | undefined;
  readonly broken?: boolean | undefined;
}

function pick<T extends { readonly id: string }>(list: readonly T[], id: string): T {
  const found = list.find((entry) => entry.id === id);
  if (found === undefined) throw new Error(`There is no function "${id}".`);
  return found;
}

/** The inputs of the cases: a number `x` and an optional `o`. Approximately one in four of the optionals is absent. */
export function inputs(seed: string, count: number, typed?: number): { readonly x: number; readonly o: Optional<number>; readonly typed: boolean }[] {
  const r = random(seed);
  const out: { x: number; o: Optional<number>; typed: boolean }[] = [];
  if (typed !== undefined) out.push({ x: typed, o: some(typed), typed: true });
  while (out.length < count) {
    const x = r.int(-20, 20);
    const o: Optional<number> = r.chance(0.25) ? none : some(r.int(-20, 20));
    out.push({ x, o, typed: false });
  }
  return out;
}

/** This function checks the seven laws on the cases of the settings. */
export function checkLaws(settings: Settings): LawResult[] {
  const impl = settings.broken === true ? BROKEN : PACKAGE;
  const f = pick(MAP_FNS, settings.mapF).f;
  const g = pick(MAP_FNS, settings.mapG).f;
  const kf = pick(FLAT_FNS, settings.flatF).f;
  const kg = pick(FLAT_FNS, settings.flatG).f;
  const p = pick(FILTER_FNS, settings.filterP ?? "even").p;
  const q = pick(FILTER_FNS, settings.filterQ ?? "positive").p;
  const data = inputs(settings.seed, settings.count, settings.typed);

  const law = (
    id: string,
    family: LawResult["family"],
    name: string,
    left: string,
    right: string,
    sides: (x: number, o: Optional<number>) => readonly [Optional<unknown>, Optional<unknown>, string, boolean],
  ): LawResult => {
    const cases = data.map(({ x, o, typed }): Case => {
      const [a, b, input, absent] = sides(x, o);
      return { input, left: showOptional(a), right: showOptional(b), ok: same(a, b), absent, typed };
    });
    return { id, family, name, left, right, cases, passed: cases.filter((c) => c.ok).length };
  };
  const onO = (o: Optional<number>): [string, boolean] => [`o = ${showOptional(o)}`, !isSome(o)];

  return [
    law("functor-identity", "functor", "Identity", "map(o, (x) => x)", "o", (_x, o) => [impl.map(o, (v) => v), o, ...onO(o)]),
    law("functor-composition", "functor", "Composition", "map(o, (x) => g(f(x)))", "map(map(o, f), g)", (_x, o) => [
      impl.map(o, (v) => g(f(v))),
      impl.map(impl.map(o, f), g),
      ...onO(o),
    ]),
    law("left-identity", "monad", "Left identity", "flatMap(some(x), f)", "f(x)", (x) => [impl.flatMap(some(x), kf), kf(x), `x = ${showValue(x)}`, false]),
    law("right-identity", "monad", "Right identity", "flatMap(o, some)", "o", (_x, o) => [impl.flatMap(o, some), o, ...onO(o)]),
    law("associativity", "monad", "Associativity", "flatMap(flatMap(o, f), g)", "flatMap(o, (x) => flatMap(f(x), g))", (_x, o) => [
      impl.flatMap(impl.flatMap(o, kf), kg),
      impl.flatMap(o, (v) => impl.flatMap(kf(v), kg)),
      ...onO(o),
    ]),
    law("filter-identity", "filter", "Identity", "filter(o, () => true)", "o", (_x, o) => [impl.filter(o, () => true), o, ...onO(o)]),
    law("filter-composition", "filter", "Composition", "filter(filter(o, p), q)", "filter(o, (x) => p(x) && q(x))", (_x, o) => [
      impl.filter(impl.filter(o, p), q),
      impl.filter(o, (v) => p(v) && q(v)),
      ...onO(o),
    ]),
  ];
}
