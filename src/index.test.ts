import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import { flatMap, fromNullable, fromSentinel, getOr, isNone, isSome, map, none, some, toSentinel, unwrap, type Optional } from "./index.ts";

const optional = <T>(value: fc.Arbitrary<T>): fc.Arbitrary<Optional<T>> => fc.oneof(fc.constant(none), value.map((v) => some(v)));
const NotFound: unique symbol = Symbol("NotFound");

describe("Optional", () => {
  it("some and none, and the tests", () => {
    expect(some(1)).toEqual({ tag: "some", value: 1 });
    expect(none).toEqual({ tag: "none" });
    expect(Object.isFrozen(none)).toBe(true);
    expect(isSome(some(0))).toBe(true);
    expect(isNone(none)).toBe(true);
    expect(isSome(none)).toBe(false);
  });

  it("unwrap, getOr and fromNullable", () => {
    expect(unwrap(some(2))).toBe(2);
    expect(unwrap(none)).toBeUndefined();
    expect(getOr(some(2), 9)).toBe(2);
    expect(getOr(none, 9)).toBe(9);
    expect(fromNullable(0)).toEqual(some(0));
    expect(fromNullable(null)).toBe(none);
    expect(fromNullable(undefined)).toBe(none);
  });

  it("the functor laws: map with the identity, and map of a composition", () => {
    fc.assert(
      fc.property(optional(fc.integer()), (o) => {
        expect(map(o, (x) => x)).toEqual(o);
        const f = (x: number): number => x * 2;
        const g = (x: number): string => `${x}`;
        expect(map(o, (x) => g(f(x)))).toEqual(map(map(o, f), g));
      }),
    );
  });

  it("the monad laws: left identity, right identity and associativity", () => {
    const f = (x: number): Optional<number> => (x % 3 === 0 ? none : some(x + 1));
    const g = (x: number): Optional<number> => (x > 5 ? some(x * 2) : none);
    fc.assert(
      fc.property(fc.integer({ min: -20, max: 20 }), optional(fc.integer({ min: -20, max: 20 })), (x, o) => {
        expect(flatMap(some(x), f)).toEqual(f(x));
        expect(flatMap(o, some)).toEqual(o);
        expect(flatMap(flatMap(o, f), g)).toEqual(flatMap(o, (y) => flatMap(f(y), g)));
      }),
    );
  });

  it("the sentinel form of Graph round-trips", () => {
    fc.assert(
      fc.property(fc.oneof(fc.integer(), fc.constant(NotFound)), (value) => {
        const o = fromSentinel(value, NotFound);
        expect(isNone(o)).toBe(value === NotFound);
        expect(toSentinel(o, NotFound)).toBe(value);
      }),
    );
  });
});
