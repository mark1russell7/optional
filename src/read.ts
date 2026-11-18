/**
 * The typed reads of unknown values, for example the value of a parsed JSON text. A reader gives a value of one type,
 * or `undefined` for a value of a different type. A decoder gives a `Result`: the value, or the path of the first bad
 * field. This entry has no dependency, and the root entry does not change.
 */

import { err, ok, type Result } from "./index.js";

/** A record: an object that is not an array and not `null`, with values of an unknown type. */
export type Fields = Readonly<Record<string, unknown>>;

/** A reader gives a value of the type `T` from an unknown value, or `undefined` when the value has a different type. */
export type Reader<T> = (value: unknown) => T | undefined;

/** This function tells if a value is a record: an object that is not an array and not `null`. */
export function isRecord(value: unknown): value is Fields {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * This function gives the value of an own field of a record. A value that is not a record gives `undefined`. A field
 * of the prototype, for example `constructor` or `__proto__`, also gives `undefined`.
 */
export function fieldOf(value: unknown, key: string): unknown {
  return isRecord(value) && Object.hasOwn(value, key) ? value[key] : undefined;
}

/**
 * This function gives a text with no space at its two ends. A value that is not a string gives `undefined`. A string
 * of only spaces also gives `undefined`, because an empty text is an absent text in most records.
 */
export function readText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  return text === "" ? undefined : text;
}

/** This function gives a finite number. `NaN`, an infinity and a value that is not a number give `undefined`. */
export function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/** This function gives a boolean. A value that is not a boolean gives `undefined`, also the text `"true"`. */
export function readBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

/** This function gives a record. An array, `null` and a value that is not an object give `undefined`. */
export function readRecord(value: unknown): Fields | undefined {
  return isRecord(value) ? value : undefined;
}

// A date, or a date and a time with a zone, in the extended format of ISO 8601. The fraction of a second is optional.
const ISO_TIME = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:[.,](\d+))?)?(Z|[+-]\d{2}(?::\d{2})?))?$/;
const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function daysIn(year: number, month: number): number {
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return month === 2 && leap ? 29 : (DAYS[month - 1] ?? 0);
}

/**
 * This function gives the time of an ISO 8601 text, in milliseconds since 1970-01-01T00:00:00Z. The text is a date, for
 * example `2026-11-18`, or a date and a time with a zone, for example `2026-11-18T10:30:00.5+01:00`.
 *
 * A date with no time is the start of that day in UTC. A time with no zone gives `undefined`, because a local time is
 * not one instant. A text that `Date.parse` reads, but that is not ISO 8601, gives `undefined`, for example
 * `Wed, 18 Nov 2026 10:30:00 GMT`. A day that its month does not have, for example `2026-02-30`, also gives `undefined`.
 */
export function readTime(value: unknown): number | undefined {
  if (typeof value !== "string") return undefined;
  const match = ISO_TIME.exec(value);
  if (match === null) return undefined;
  const [, y, mo, d, h = "00", mi = "00", s = "00", fraction = "", zone = "Z"] = match;
  const year = Number(y);
  const month = Number(mo);
  const day = Number(d);
  const hour = Number(h);
  const minute = Number(mi);
  const second = Number(s);
  if (month < 1 || month > 12 || day < 1 || day > daysIn(year, month) || hour > 23 || minute > 59 || second > 59) return undefined;
  let offset = 0;
  if (zone !== "Z") {
    const zoneHours = Number(zone.slice(1, 3));
    const zoneMinutes = zone.length > 3 ? Number(zone.slice(4, 6)) : 0;
    if (zoneHours > 23 || zoneMinutes > 59) return undefined;
    offset = (zone.startsWith("-") ? -1 : 1) * (zoneHours * 60 + zoneMinutes) * 60_000;
  }
  // `Date.UTC` adds 1900 to a year below 100, so the year goes in with `setUTCFullYear`.
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, Number(fraction.padEnd(3, "0").slice(0, 3)));
  return date.getTime() - offset;
}

/**
 * This function gives the items of an array that the reader `item` reads. The reader drops each item of a different
 * type. A value that is not an array gives `undefined`. `decodeArray` refuses an array with a bad item.
 */
export function readArray<T>(value: unknown, item: Reader<T>): readonly T[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items: T[] = [];
  for (const entry of value) {
    const read = item(entry);
    if (read !== undefined) items.push(read);
  }
  return items;
}

/** This function gives the text of an own field of a record (`readText`), or `undefined`. */
export function textOf(value: unknown, key: string): string | undefined {
  return readText(fieldOf(value, key));
}

/** This function gives the finite number of an own field of a record (`readNumber`), or `undefined`. */
export function numberOf(value: unknown, key: string): number | undefined {
  return readNumber(fieldOf(value, key));
}

/** This function gives the boolean of an own field of a record (`readBoolean`), or `undefined`. */
export function booleanOf(value: unknown, key: string): boolean | undefined {
  return readBoolean(fieldOf(value, key));
}

/** This function gives the time of the ISO 8601 text of an own field of a record (`readTime`), or `undefined`. */
export function timeOf(value: unknown, key: string): number | undefined {
  return readTime(fieldOf(value, key));
}

/** This function gives the record of an own field of a record (`readRecord`), or `undefined`. */
export function recordOf(value: unknown, key: string): Fields | undefined {
  return readRecord(fieldOf(value, key));
}

/** This function gives the items of the array of an own field of a record (`readArray`), or `undefined`. */
export function arrayOf<T>(value: unknown, key: string, item: Reader<T>): readonly T[] | undefined {
  return readArray(fieldOf(value, key), item);
}

/** The path of a field: the key of each record and the index of each array, from the root to the field. */
export type Path = readonly (string | number)[];

/** The kind of a value: the result of `typeof`, with `null` and `array` as two more kinds. */
export type ValueKind = "undefined" | "null" | "array" | "object" | "string" | "number" | "boolean" | "bigint" | "symbol" | "function";

/** This function gives the kind of a value. */
export function kindOf(value: unknown): ValueKind {
  if (value === null) return "null";
  return Array.isArray(value) ? "array" : typeof value;
}

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
export function decoderOf<T>(reader: Reader<T>, expected: string): Decoder<T> {
  return (value) => {
    const read = reader(value);
    return read === undefined ? err({ path: [], expected, found: kindOf(value) }) : ok(read);
  };
}

/** This decoder gives a text with no space at its two ends (`readText`). */
export const decodeText: Decoder<string> = decoderOf(readText, "text");

/** This decoder gives a finite number (`readNumber`). */
export const decodeNumber: Decoder<number> = decoderOf(readNumber, "number");

/** This decoder gives a boolean (`readBoolean`). */
export const decodeBoolean: Decoder<boolean> = decoderOf(readBoolean, "boolean");

/** This decoder gives the time of an ISO 8601 text (`readTime`). */
export const decodeTime: Decoder<number> = decoderOf(readTime, "time");

/** This decoder gives a record (`readRecord`). It does not examine the fields. */
export const decodeRecord: Decoder<Fields> = decoderOf(readRecord, "record");

/** This function makes a decoder that gives `undefined` for an absent value: `undefined` or `null`. Other values go to `decoder`. */
export function decodeOptional<T>(decoder: Decoder<T>): Decoder<T | undefined> {
  return (value) => (value === undefined || value === null ? ok(undefined) : decoder(value));
}

const below = (key: string | number, error: DecodeError): DecodeError => ({ ...error, path: [key, ...error.path] });

/** This function makes a decoder of an array. Each item goes to `item`. The first bad item gives the error, with its index in the path. */
export function decodeArray<T>(item: Decoder<T>): Decoder<readonly T[]> {
  return (value) => {
    if (!Array.isArray(value)) return err({ path: [], expected: "array", found: kindOf(value) });
    const items: T[] = [];
    for (let index = 0; index < value.length; index++) {
      const result = item(value[index]);
      if (result.tag === "err") return err(below(index, result.error));
      items.push(result.value);
    }
    return ok(items);
  };
}

/**
 * This function makes a decoder of a record. Each key of `shape` reads its own field with its decoder, in the order of
 * the keys of `shape`. The first bad field gives the error, with its key in the path. The decoder ignores the other fields.
 */
export function decodeFields<S extends Shape>(shape: S): Decoder<{ readonly [K in keyof S]: Decoded<S[K]> }> {
  const entries = Object.entries(shape);
  return (value) => {
    if (!isRecord(value)) return err({ path: [], expected: "record", found: kindOf(value) });
    const fields: [string, unknown][] = [];
    for (const [key, decoder] of entries) {
      const result = decoder(fieldOf(value, key));
      if (result.tag === "err") return err(below(key, result.error));
      fields.push([key, result.value]);
    }
    // `Object.fromEntries` makes an own field also for the key `__proto__`.
    return ok(Object.fromEntries(fields) as { readonly [K in keyof S]: Decoded<S[K]> });
  };
}

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/** This function gives the text of a path for a message, for example `$.items[0].id`. A key that is not a name goes in brackets. */
export function pathText(path: Path): string {
  return path.reduce<string>((text, part) => {
    if (typeof part === "number") return `${text}[${part}]`;
    return IDENTIFIER.test(part) ? `${text}.${part}` : `${text}[${JSON.stringify(part)}]`;
  }, "$");
}
