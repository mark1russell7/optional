/**
 * The Optional and the Result of the family. An optional is a value that is present (`Some`) or absent (`None`). The
 * packages render and Vex use this form. `fromSentinel` and `toSentinel` convert between this form and a sentinel form.
 * A result is a value (`Ok`) or an error (`Err`). `fromOptional` and `toOptional` convert between the two.
 */

/** The absence of a value. */
export type None = { readonly tag: "none" };

/** A present value. */
export type Some<T> = { readonly tag: "some"; readonly value: T };

/** A value that is present (`Some`) or absent (`None`). It replaces `null`, `undefined` and exceptions. */
export type Optional<T> = None | Some<T>;

/** The one absent value. */
export const none: None = Object.freeze({ tag: "none" });

/** This function wraps a present value. */
export const some = <T>(value: T): Some<T> => ({ tag: "some", value });

/** This function tells if an optional is absent. */
export const isNone = <T>(o: Optional<T>): o is None => o.tag === "none";

/** This function tells if an optional is present. */
export const isSome = <T>(o: Optional<T>): o is Some<T> => o.tag === "some";

/** This function applies `f` to a present value. An absent value stays absent. */
export const map = <T, U>(o: Optional<T>, f: (v: T) => U): Optional<U> => (isSome(o) ? some(f(o.value)) : none);

/** This function applies `f`, which gives an optional, to a present value. An absent value stays absent. */
export const flatMap = <T, U>(o: Optional<T>, f: (v: T) => Optional<U>): Optional<U> => (isSome(o) ? f(o.value) : none);

/**
 * This function keeps a present value when `p` gives `true` for it. Otherwise, the result is absent. A type guard `p`
 * narrows the type of the value.
 */
export function filter<T, S extends T>(o: Optional<T>, p: (v: T) => v is S): Optional<S>;
export function filter<T>(o: Optional<T>, p: (v: T) => boolean): Optional<T>;
export function filter<T>(o: Optional<T>, p: (v: T) => boolean): Optional<T> {
  return isSome(o) && p(o.value) ? o : none;
}

/** This function gives the present value, or `undefined`. */
export const unwrap = <T>(o: Optional<T>): T | undefined => (isSome(o) ? o.value : undefined);

/** This function gives the present value, or `fallback`. */
export const getOr = <T, U>(o: Optional<T>, fallback: U): T | U => (isSome(o) ? o.value : fallback);

/** This function wraps a value, and gives `none` for `null` and `undefined`. */
export const fromNullable = <T>(value: T | null | undefined): Optional<NonNullable<T>> => (value === null || value === undefined ? none : some(value));

/**
 * This function changes a value of the sentinel form into an optional. In the sentinel form, the value `sentinel`
 * means "absent", for example a symbol `NotFound`.
 */
export const fromSentinel = <T, S>(value: T | S, sentinel: S): Optional<T> => (value === sentinel ? none : some(value as T));

/** This function changes an optional into the sentinel form: an absent value becomes `sentinel`. */
export const toSentinel = <T, S>(o: Optional<T>, sentinel: S): T | S => (isSome(o) ? o.value : sentinel);

/** A value of a step that succeeded. */
export type Ok<T> = { readonly tag: "ok"; readonly value: T };

/** The error of a step that failed. */
export type Err<E> = { readonly tag: "err"; readonly error: E };

/**
 * A value (`Ok`) or an error (`Err`). It replaces a thrown exception when the caller must handle the error. It has the
 * same algebra as `Optional`, but its failure case carries an error.
 */
export type Result<T, E> = Ok<T> | Err<E>;

/** This function wraps a value of a step that succeeded. */
export const ok = <T>(value: T): Ok<T> => ({ tag: "ok", value });

/** This function wraps the error of a step that failed. */
export const err = <E>(error: E): Err<E> => ({ tag: "err", error });

/** This function tells if a result is a value. */
export const isOk = <T, E>(r: Result<T, E>): r is Ok<T> => r.tag === "ok";

/** This function tells if a result is an error. */
export const isErr = <T, E>(r: Result<T, E>): r is Err<E> => r.tag === "err";

/** This function applies `f` to a value. An error stays the same. */
export const mapResult = <T, U, E>(r: Result<T, E>, f: (v: T) => U): Result<U, E> => (isOk(r) ? ok(f(r.value)) : r);

/** This function applies `f` to an error. A value stays the same. */
export const mapErr = <T, E, F>(r: Result<T, E>, f: (e: E) => F): Result<T, F> => (isErr(r) ? err(f(r.error)) : r);

/** This function applies `f`, which gives a result, to a value. An error stays the same. */
export const flatMapResult = <T, U, E, F = E>(r: Result<T, E>, f: (v: T) => Result<U, F>): Result<U, E | F> => (isOk(r) ? f(r.value) : r);

/** This function gives the value, or `fallback` for an error. */
export const getOkOr = <T, U, E>(r: Result<T, E>, fallback: U): T | U => (isOk(r) ? r.value : fallback);

/**
 * This function starts `f`, and gives its value as `ok`. When `f` throws, the result is `err` of the thrown value, or of
 * `onError` of the thrown value.
 */
export function tryCatch<T>(f: () => T): Result<T, unknown>;
export function tryCatch<T, E>(f: () => T, onError: (thrown: unknown) => E): Result<T, E>;
export function tryCatch<T, E>(f: () => T, onError?: (thrown: unknown) => E): Result<T, unknown> {
  try {
    return ok(f());
  } catch (thrown) {
    return err(onError === undefined ? thrown : onError(thrown));
  }
}

/**
 * This function starts `f` and waits for its promise. It gives the value as `ok`. When `f` throws or its promise
 * rejects, the result is `err` of the reason, or of `onError` of the reason. The promise of this function does not
 * reject, except when `onError` throws.
 */
export async function tryCatchAsync<T>(f: () => T | PromiseLike<T>): Promise<Result<T, unknown>>;
export async function tryCatchAsync<T, E>(f: () => T | PromiseLike<T>, onError: (thrown: unknown) => E): Promise<Result<T, E>>;
export async function tryCatchAsync<T, E>(f: () => T | PromiseLike<T>, onError?: (thrown: unknown) => E): Promise<Result<T, unknown>> {
  try {
    return ok(await f());
  } catch (thrown) {
    return err(onError === undefined ? thrown : onError(thrown));
  }
}

/** This function changes an optional into a result: a present value becomes `ok`, and `none` becomes `err(error)`. */
export const fromOptional = <T, E>(o: Optional<T>, error: E): Result<T, E> => (isSome(o) ? ok(o.value) : err(error));

/** This function changes a result into an optional: a value becomes `some`, and an error becomes `none`. */
export const toOptional = <T, E>(r: Result<T, E>): Optional<T> => (isOk(r) ? some(r.value) : none);
