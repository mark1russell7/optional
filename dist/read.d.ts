/**
 * The typed reads of unknown values, for example the value of a parsed JSON text. A reader gives a value of one type,
 * or `undefined` for a value of a different type. A decoder gives a `Result`: the value, or the path of the first bad
 * field. This entry has no dependency, and the root entry does not change.
 */
import { type Result } from "./index.js";
/** A record: an object that is not an array and not `null`, with values of an unknown type. */
export type Fields = Readonly<Record<string, unknown>>;
/** A reader gives a value of the type `T` from an unknown value, or `undefined` when the value has a different type. */
export type Reader<T> = (value: unknown) => T | undefined;
/** This function tells if a value is a record: an object that is not an array and not `null`. */
export declare function isRecord(value: unknown): value is Fields;
/**
 * This function tells if a value is a plain object: a record whose prototype is `Object.prototype` or `null`. An object
 * literal, a value of `JSON.parse` and `Object.create(null)` are plain objects. An array, a class instance, a `Date` and
 * a `Map` are not. An object of a different realm, for example of `node:vm`, has a different `Object.prototype`. Thus
 * it is not a plain object.
 */
export declare function isPlainObject(value: unknown): value is Fields;
/**
 * This function gives the value of an own field of a record. A value that is not a record gives `undefined`. A field
 * of the prototype, for example `constructor` or `__proto__`, also gives `undefined`.
 */
export declare function fieldOf(value: unknown, key: string): unknown;
/**
 * This function gives a text with no space at its two ends. A value that is not a string gives `undefined`. A string
 * of only spaces also gives `undefined`, because an empty text is an absent text in most records.
 */
export declare function readText(value: unknown): string | undefined;
/** This function gives a finite number. `NaN`, an infinity and a value that is not a number give `undefined`. */
export declare function readNumber(value: unknown): number | undefined;
/** This function gives a boolean. A value that is not a boolean gives `undefined`, also the text `"true"`. */
export declare function readBoolean(value: unknown): boolean | undefined;
/** This function gives a record. An array, `null` and a value that is not an object give `undefined`. */
export declare function readRecord(value: unknown): Fields | undefined;
/**
 * This function gives the time of an ISO 8601 text, in milliseconds since 1970-01-01T00:00:00Z. The text is a date, for
 * example `2026-11-18`, or a date and a time with a zone, for example `2026-11-18T10:30:00.5+01:00`.
 *
 * A date with no time is the start of that day in UTC. A time with no zone gives `undefined`, because a local time is
 * not one instant. A text that `Date.parse` reads, but that is not ISO 8601, gives `undefined`, for example
 * `Wed, 18 Nov 2026 10:30:00 GMT`. A day that its month does not have, for example `2026-02-30`, also gives `undefined`.
 */
export declare function readTime(value: unknown): number | undefined;
/**
 * This function gives the items of an array that the reader `item` reads. The reader drops each item of a different
 * type. A value that is not an array gives `undefined`. `decodeArray` refuses an array with a bad item.
 */
export declare function readArray<T>(value: unknown, item: Reader<T>): readonly T[] | undefined;
/** This function gives the text of an own field of a record (`readText`), or `undefined`. */
export declare function textOf(value: unknown, key: string): string | undefined;
/** This function gives the finite number of an own field of a record (`readNumber`), or `undefined`. */
export declare function numberOf(value: unknown, key: string): number | undefined;
/** This function gives the boolean of an own field of a record (`readBoolean`), or `undefined`. */
export declare function booleanOf(value: unknown, key: string): boolean | undefined;
/** This function gives the time of the ISO 8601 text of an own field of a record (`readTime`), or `undefined`. */
export declare function timeOf(value: unknown, key: string): number | undefined;
/** This function gives the record of an own field of a record (`readRecord`), or `undefined`. */
export declare function recordOf(value: unknown, key: string): Fields | undefined;
/** This function gives the items of the array of an own field of a record (`readArray`), or `undefined`. */
export declare function arrayOf<T>(value: unknown, key: string, item: Reader<T>): readonly T[] | undefined;
/** The path of a field: the key of each record and the index of each array, from the root to the field. */
export type Path = readonly (string | number)[];
/** The kind of a value: the result of `typeof`, with `null` and `array` as two more kinds. */
export type ValueKind = "undefined" | "null" | "array" | "object" | "string" | "number" | "boolean" | "bigint" | "symbol" | "function";
/** This function gives the kind of a value. */
export declare function kindOf(value: unknown): ValueKind;
/**
 * The error of a decoder: the path of the first bad field, the expected value and the kind of the found value. The
 * error does not hold the value, so a message of the error does not show the data.
 */
export interface DecodeError {
    /** The path of the bad field. An empty path is the root value. */
    readonly path: Path;
    /** The expected value, for example `text` or `record`. */
    readonly expected: string;
    /** The kind of the found value. */
    readonly found: ValueKind;
}
/** A decoder gives a value of the type `T` from an unknown value, or the error of the first bad field. */
export type Decoder<T> = (value: unknown) => Result<T, DecodeError>;
/** The type of the value of a decoder. */
export type Decoded<D> = D extends Decoder<infer T> ? T : never;
/** The decoders of the fields of a record, one for each key. */
export type Shape = Readonly<Record<string, Decoder<unknown>>>;
/** This function makes a decoder from a reader. A value that the reader does not read gives an error with the name `expected`. */
export declare function decoderOf<T>(reader: Reader<T>, expected: string): Decoder<T>;
/** This decoder gives a text with no space at its two ends (`readText`). */
export declare const decodeText: Decoder<string>;
/** This decoder gives a finite number (`readNumber`). */
export declare const decodeNumber: Decoder<number>;
/** This decoder gives a boolean (`readBoolean`). */
export declare const decodeBoolean: Decoder<boolean>;
/** This decoder gives the time of an ISO 8601 text (`readTime`). */
export declare const decodeTime: Decoder<number>;
/** This decoder gives a record (`readRecord`). It does not examine the fields. */
export declare const decodeRecord: Decoder<Fields>;
/** This function makes a decoder that gives `undefined` for an absent value: `undefined` or `null`. Other values go to `decoder`. */
export declare function decodeOptional<T>(decoder: Decoder<T>): Decoder<T | undefined>;
/** This function makes a decoder of an array. Each item goes to `item`. The first bad item gives the error, with its index in the path. */
export declare function decodeArray<T>(item: Decoder<T>): Decoder<readonly T[]>;
/**
 * This function makes a decoder of a record. Each key of `shape` reads its own field with its decoder, in the order of
 * the keys of `shape`. The first bad field gives the error, with its key in the path. The decoder ignores the other fields.
 */
export declare function decodeFields<S extends Shape>(shape: S): Decoder<{
    readonly [K in keyof S]: Decoded<S[K]>;
}>;
/** This function gives the text of a path for a message, for example `$.items[0].id`. A key that is not a name goes in brackets. */
export declare function pathText(path: Path): string;
//# sourceMappingURL=read.d.ts.map