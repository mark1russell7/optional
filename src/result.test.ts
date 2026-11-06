import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  err,
  flatMapResult,
  fromOptional,
  getOkOr,
  isErr,
  isOk,
  mapErr,
  mapResult,
  none,
  ok,
  some,
  toOptional,
  tryCatch,
  tryCatchAsync,
  type Optional,
  type Result,
} from "./index.ts";

const result = <T, E>(value: fc.Arbitrary<T>, error: fc.Arbitrary<E>): fc.Arbitrary<Result<T, E>> =>
  fc.oneof(value.map((v) => ok(v)), error.map((e) => err(e)));
const optional = <T>(value: fc.Arbitrary<T>): fc.Arbitrary<Optional<T>> => fc.oneof(fc.constant(none), value.map((v) => some(v)));
const small = fc.integer({ min: -20, max: 20 });

describe("Result", () => {
  it("ok and err, and the tests", () => {
    expect(ok(1)).toEqual({ tag: "ok", value: 1 });
    expect(err("no")).toEqual({ tag: "err", error: "no" });
    expect(isOk(ok(0))).toBe(true);
    expect(isErr(ok(0))).toBe(false);
    expect(isErr(err(undefined))).toBe(true);
    expect(getOkOr(ok(2), 9)).toBe(2);
    expect(getOkOr(err("no"), 9)).toBe(9);
  });

  it("the functor laws of mapResult and of mapErr", () => {
    const f = (x: number): number => x * 2;
    const g = (x: number): string => `${x}`;
    fc.assert(
      fc.property(result(fc.integer(), fc.integer()), (r) => {
        expect(mapResult(r, (x) => x)).toEqual(r);
        expect(mapResult(r, (x) => g(f(x)))).toEqual(mapResult(mapResult(r, f), g));
        expect(mapErr(r, (e) => e)).toEqual(r);
        expect(mapErr(r, (e) => g(f(e)))).toEqual(mapErr(mapErr(r, f), g));
      }),
    );
  });

  it("mapResult does not touch an error, and mapErr does not touch a value", () => {
    const failed: Result<number, string> = err("no");
    expect(mapResult(failed, () => 1)).toBe(failed);
    const done: Result<number, string> = ok(1);
    expect(mapErr(done, () => 2)).toBe(done);
  });

  it("the monad laws: left identity, right identity and associativity", () => {
    const f = (x: number): Result<number, string> => (x % 3 === 0 ? err(`f ${x}`) : ok(x + 1));
    const g = (x: number): Result<number, string> => (x > 5 ? ok(x * 2) : err(`g ${x}`));
    fc.assert(
      fc.property(small, result(small, fc.string()), (x, r) => {
        expect(flatMapResult(ok(x), f)).toEqual(f(x));
        expect(flatMapResult(r, ok)).toEqual(r);
        expect(flatMapResult(flatMapResult(r, f), g)).toEqual(flatMapResult(r, (y) => flatMapResult(f(y), g)));
      }),
    );
  });

  it("flatMapResult keeps the first error and does not start f after it", () => {
    let calls = 0;
    const failed: Result<number, string> = err("first");
    const next = flatMapResult(failed, (x) => {
      calls += 1;
      return ok(x);
    });
    expect(next).toEqual(err("first"));
    expect(calls).toBe(0);
  });

  it("tryCatch gives ok for a value and err for a thrown value", () => {
    expect(tryCatch(() => 3)).toEqual(ok(3));
    const thrown = new RangeError("bad");
    expect(
      tryCatch(() => {
        throw thrown;
      }),
    ).toEqual(err(thrown));
    expect(
      tryCatch(
        () => {
          throw thrown;
        },
        (e) => (e instanceof Error ? e.message : "?"),
      ),
    ).toEqual(err("bad"));
  });

  it("tryCatchAsync gives ok for a value, and err for a throw or a rejection", async () => {
    await expect(tryCatchAsync(async () => 3)).resolves.toEqual(ok(3));
    await expect(tryCatchAsync(() => 4)).resolves.toEqual(ok(4));
    await expect(tryCatchAsync(() => Promise.reject(new Error("late")), (e) => (e as Error).message)).resolves.toEqual(err("late"));
    await expect(
      tryCatchAsync(() => {
        throw new Error("early");
      }, (e) => (e as Error).message),
    ).resolves.toEqual(err("early"));
  });

  it("the round trip of the converters: an optional, and an ok result, come back the same", () => {
    fc.assert(
      fc.property(optional(fc.integer()), fc.string(), (o, e) => {
        expect(toOptional(fromOptional(o, e))).toEqual(o);
      }),
    );
    fc.assert(
      fc.property(result(fc.integer(), fc.string()), fc.string(), (r, e) => {
        // An error loses its value in an optional, so it comes back as err(e)
        expect(fromOptional(toOptional(r), e)).toEqual(isOk(r) ? r : err(e));
      }),
    );
  });

  it("the converters agree with map: a map before or after a change gives the same result", () => {
    const f = (x: number): number => x * 3 - 1;
    fc.assert(
      fc.property(result(fc.integer(), fc.string()), (r) => {
        const viaResult = toOptional(mapResult(r, f));
        const viaOptional = toOptional(r);
        expect(viaResult).toEqual(viaOptional.tag === "some" ? some(f(viaOptional.value)) : none);
      }),
    );
  });
});
