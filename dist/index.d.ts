/**
 * The Optional and the Result of the family. An optional is a value that is present (`Some`) or absent (`None`). The
 * packages render and Vex use this form. `fromSentinel` and `toSentinel` convert between this form and a sentinel form.
 * A result is a value (`Ok`) or an error (`Err`). `fromOptional` and `toOptional` convert between the two.
 */
/** The absence of a value. */
export type None = {
    readonly tag: "none";
};
/** A present value. */
export type Some<T> = {
    readonly tag: "some";
    readonly value: T;
};
/** A value that is present (`Some`) or absent (`None`). It replaces `null`, `undefined` and exceptions. */
export type Optional<T> = None | Some<T>;
/** The one absent value. */
export declare const none: None;
/** This function wraps a present value. */
export declare const some: <T>(value: T) => Some<T>;
/** This function tells if an optional is absent. */
export declare const isNone: <T>(o: Optional<T>) => o is None;
/** This function tells if an optional is present. */
export declare const isSome: <T>(o: Optional<T>) => o is Some<T>;
/** This function applies `f` to a present value. An absent value stays absent. */
export declare const map: <T, U>(o: Optional<T>, f: (v: T) => U) => Optional<U>;
/** This function applies `f`, which gives an optional, to a present value. An absent value stays absent. */
export declare const flatMap: <T, U>(o: Optional<T>, f: (v: T) => Optional<U>) => Optional<U>;
/**
 * This function keeps a present value when `p` gives `true` for it. Otherwise, the result is absent. A type guard `p`
 * narrows the type of the value.
 */
export declare function filter<T, S extends T>(o: Optional<T>, p: (v: T) => v is S): Optional<S>;
export declare function filter<T>(o: Optional<T>, p: (v: T) => boolean): Optional<T>;
/** This function gives the present value, or `undefined`. */
export declare const unwrap: <T>(o: Optional<T>) => T | undefined;
/** This function gives the present value, or `fallback`. */
export declare const getOr: <T, U>(o: Optional<T>, fallback: U) => T | U;
/** This function wraps a value, and gives `none` for `null` and `undefined`. */
export declare const fromNullable: <T>(value: T | null | undefined) => Optional<NonNullable<T>>;
/**
 * This function changes a value of the sentinel form into an optional. In the sentinel form, the value `sentinel`
 * means "absent", for example a symbol `NotFound`.
 */
export declare const fromSentinel: <T, S>(value: T | S, sentinel: S) => Optional<T>;
/** This function changes an optional into the sentinel form: an absent value becomes `sentinel`. */
export declare const toSentinel: <T, S>(o: Optional<T>, sentinel: S) => T | S;
/** A value of a step that succeeded. */
export type Ok<T> = {
    readonly tag: "ok";
    readonly value: T;
};
/** The error of a step that failed. */
export type Err<E> = {
    readonly tag: "err";
    readonly error: E;
};
/**
 * A value (`Ok`) or an error (`Err`). It replaces a thrown exception when the caller must handle the error. It has the
 * same algebra as `Optional`, but its failure case carries an error.
 */
export type Result<T, E> = Ok<T> | Err<E>;
/** This function wraps a value of a step that succeeded. */
export declare const ok: <T>(value: T) => Ok<T>;
/** This function wraps the error of a step that failed. */
export declare const err: <E>(error: E) => Err<E>;
/** This function tells if a result is a value. */
export declare const isOk: <T, E>(r: Result<T, E>) => r is Ok<T>;
/** This function tells if a result is an error. */
export declare const isErr: <T, E>(r: Result<T, E>) => r is Err<E>;
/** This function applies `f` to a value. An error stays the same. */
export declare const mapResult: <T, U, E>(r: Result<T, E>, f: (v: T) => U) => Result<U, E>;
/** This function applies `f` to an error. A value stays the same. */
export declare const mapErr: <T, E, F>(r: Result<T, E>, f: (e: E) => F) => Result<T, F>;
/** This function applies `f`, which gives a result, to a value. An error stays the same. */
export declare const flatMapResult: <T, U, E, F = E>(r: Result<T, E>, f: (v: T) => Result<U, F>) => Result<U, E | F>;
/** This function gives the value, or `fallback` for an error. */
export declare const getOkOr: <T, U, E>(r: Result<T, E>, fallback: U) => T | U;
/**
 * This function starts `f`, and gives its value as `ok`. When `f` throws, the result is `err` of the thrown value, or of
 * `onError` of the thrown value.
 */
export declare function tryCatch<T>(f: () => T): Result<T, unknown>;
export declare function tryCatch<T, E>(f: () => T, onError: (thrown: unknown) => E): Result<T, E>;
/**
 * This function starts `f` and waits for its promise. It gives the value as `ok`. When `f` throws or its promise
 * rejects, the result is `err` of the reason, or of `onError` of the reason. The promise of this function does not
 * reject, except when `onError` throws.
 */
export declare function tryCatchAsync<T>(f: () => T | PromiseLike<T>): Promise<Result<T, unknown>>;
export declare function tryCatchAsync<T, E>(f: () => T | PromiseLike<T>, onError: (thrown: unknown) => E): Promise<Result<T, E>>;
/** This function changes an optional into a result: a present value becomes `ok`, and `none` becomes `err(error)`. */
export declare const fromOptional: <T, E>(o: Optional<T>, error: E) => Result<T, E>;
/** This function changes a result into an optional: a value becomes `some`, and an error becomes `none`. */
export declare const toOptional: <T, E>(r: Result<T, E>) => Optional<T>;
//# sourceMappingURL=index.d.ts.map