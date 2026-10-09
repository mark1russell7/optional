/**
 * The Optional of the family: a value that is present (`Some`) or absent (`None`). The packages render and Vex use
 * this form. Graph uses a sentinel form, and `fromSentinel` and `toSentinel` convert between the two forms.
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
/** This function gives the present value, or `undefined`. */
export const unwrap = (o) => (isSome(o) ? o.value : undefined);
/** This function gives the present value, or `fallback`. */
export const getOr = (o, fallback) => (isSome(o) ? o.value : fallback);
/** This function wraps a value, and gives `none` for `null` and `undefined`. */
export const fromNullable = (value) => (value === null || value === undefined ? none : some(value));
/**
 * This function changes a value of the sentinel form into an optional. In the sentinel form, the value `sentinel`
 * means "absent", for example the symbol `NotFound` of Graph.
 */
export const fromSentinel = (value, sentinel) => (value === sentinel ? none : some(value));
/** This function changes an optional into the sentinel form: an absent value becomes `sentinel`. */
export const toSentinel = (o, sentinel) => (isSome(o) ? o.value : sentinel);
//# sourceMappingURL=index.js.map