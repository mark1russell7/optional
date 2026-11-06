/**
 * The Optional and the Result of the family. An optional is a value that is present (`Some`) or absent (`None`). The
 * packages render and Vex use this form. `fromSentinel` and `toSentinel` convert between this form and a sentinel form.
 * A result is a value (`Ok`) or an error (`Err`). `fromOptional` and `toOptional` convert between the two.
 */
/** The one absent value. */
export const none = Object.freeze({ tag: "none" });
/** This function wraps a present value. */
export const some = (value) => ({ tag: "some", value });
/** This function tells if an optional is absent. */
export const isNone = (o) => o.tag === "none";
/** This function tells if an optional is present. */
export const isSome = (o) => o.tag === "some";
/** This function applies `f` to a present value. An absent value stays absent. */
export const map = (o, f) => (isSome(o) ? some(f(o.value)) : none);
/** This function applies `f`, which gives an optional, to a present value. An absent value stays absent. */
export const flatMap = (o, f) => (isSome(o) ? f(o.value) : none);
export function filter(o, p) {
    return isSome(o) && p(o.value) ? o : none;
}
/** This function gives the present value, or `undefined`. */
export const unwrap = (o) => (isSome(o) ? o.value : undefined);
/** This function gives the present value, or `fallback`. */
export const getOr = (o, fallback) => (isSome(o) ? o.value : fallback);
/** This function wraps a value, and gives `none` for `null` and `undefined`. */
export const fromNullable = (value) => (value === null || value === undefined ? none : some(value));
/**
 * This function changes a value of the sentinel form into an optional. In the sentinel form, the value `sentinel`
 * means "absent", for example a symbol `NotFound`.
 */
export const fromSentinel = (value, sentinel) => (value === sentinel ? none : some(value));
/** This function changes an optional into the sentinel form: an absent value becomes `sentinel`. */
export const toSentinel = (o, sentinel) => (isSome(o) ? o.value : sentinel);
/** This function wraps a value of a step that succeeded. */
export const ok = (value) => ({ tag: "ok", value });
/** This function wraps the error of a step that failed. */
export const err = (error) => ({ tag: "err", error });
/** This function tells if a result is a value. */
export const isOk = (r) => r.tag === "ok";
/** This function tells if a result is an error. */
export const isErr = (r) => r.tag === "err";
/** This function applies `f` to a value. An error stays the same. */
export const mapResult = (r, f) => (isOk(r) ? ok(f(r.value)) : r);
/** This function applies `f` to an error. A value stays the same. */
export const mapErr = (r, f) => (isErr(r) ? err(f(r.error)) : r);
/** This function applies `f`, which gives a result, to a value. An error stays the same. */
export const flatMapResult = (r, f) => (isOk(r) ? f(r.value) : r);
/** This function gives the value, or `fallback` for an error. */
export const getOkOr = (r, fallback) => (isOk(r) ? r.value : fallback);
export function tryCatch(f, onError) {
    try {
        return ok(f());
    }
    catch (thrown) {
        return err(onError === undefined ? thrown : onError(thrown));
    }
}
export async function tryCatchAsync(f, onError) {
    try {
        return ok(await f());
    }
    catch (thrown) {
        return err(onError === undefined ? thrown : onError(thrown));
    }
}
/** This function changes an optional into a result: a present value becomes `ok`, and `none` becomes `err(error)`. */
export const fromOptional = (o, error) => (isSome(o) ? ok(o.value) : err(error));
/** This function changes a result into an optional: a value becomes `some`, and an error becomes `none`. */
export const toOptional = (r) => (isOk(r) ? some(r.value) : none);
//# sourceMappingURL=index.js.map