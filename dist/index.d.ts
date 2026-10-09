/**
 * The Optional of the family: a value that is present (`Some`) or absent (`None`). The packages render and Vex use
 * this form. Graph uses a sentinel form, and `fromSentinel` and `toSentinel` convert between the two forms.
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
/** This function gives the present value, or `undefined`. */
export declare const unwrap: <T>(o: Optional<T>) => T | undefined;
/** This function gives the present value, or `fallback`. */
export declare const getOr: <T, U>(o: Optional<T>, fallback: U) => T | U;
/** This function wraps a value, and gives `none` for `null` and `undefined`. */
export declare const fromNullable: <T>(value: T | null | undefined) => Optional<NonNullable<T>>;
/**
 * This function changes a value of the sentinel form into an optional. In the sentinel form, the value `sentinel`
 * means "absent", for example the symbol `NotFound` of Graph.
 */
export declare const fromSentinel: <T, S>(value: T | S, sentinel: S) => Optional<T>;
/** This function changes an optional into the sentinel form: an absent value becomes `sentinel`. */
export declare const toSentinel: <T, S>(o: Optional<T>, sentinel: S) => T | S;
//# sourceMappingURL=index.d.ts.map