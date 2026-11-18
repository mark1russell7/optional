/**
 * The typed reads of unknown values, for example the value of a parsed JSON text. A reader gives a value of one type,
 * or `undefined` for a value of a different type. A decoder gives a `Result`: the value, or the path of the first bad
 * field. This entry has no dependency, and the root entry does not change.
 */
import { err, ok } from "./index.js";
/** This function tells if a value is a record: an object that is not an array and not `null`. */
export function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
/**
 * This function gives the value of an own field of a record. A value that is not a record gives `undefined`. A field
 * of the prototype, for example `constructor` or `__proto__`, also gives `undefined`.
 */
export function fieldOf(value, key) {
    return isRecord(value) && Object.hasOwn(value, key) ? value[key] : undefined;
}
/**
 * This function gives a text with no space at its two ends. A value that is not a string gives `undefined`. A string
 * of only spaces also gives `undefined`, because an empty text is an absent text in most records.
 */
export function readText(value) {
    if (typeof value !== "string")
        return undefined;
    const text = value.trim();
    return text === "" ? undefined : text;
}
/** This function gives a finite number. `NaN`, an infinity and a value that is not a number give `undefined`. */
export function readNumber(value) {
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
/** This function gives a boolean. A value that is not a boolean gives `undefined`, also the text `"true"`. */
export function readBoolean(value) {
    return typeof value === "boolean" ? value : undefined;
}
/** This function gives a record. An array, `null` and a value that is not an object give `undefined`. */
export function readRecord(value) {
    return isRecord(value) ? value : undefined;
}
// A date, or a date and a time with a zone, in the extended format of ISO 8601. The fraction of a second is optional.
const ISO_TIME = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:[.,](\d+))?)?(Z|[+-]\d{2}(?::\d{2})?))?$/;
const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function daysIn(year, month) {
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
export function readTime(value) {
    if (typeof value !== "string")
        return undefined;
    const match = ISO_TIME.exec(value);
    if (match === null)
        return undefined;
    const [, y, mo, d, h = "00", mi = "00", s = "00", fraction = "", zone = "Z"] = match;
    const year = Number(y);
    const month = Number(mo);
    const day = Number(d);
    const hour = Number(h);
    const minute = Number(mi);
    const second = Number(s);
    if (month < 1 || month > 12 || day < 1 || day > daysIn(year, month) || hour > 23 || minute > 59 || second > 59)
        return undefined;
    let offset = 0;
    if (zone !== "Z") {
        const zoneHours = Number(zone.slice(1, 3));
        const zoneMinutes = zone.length > 3 ? Number(zone.slice(4, 6)) : 0;
        if (zoneHours > 23 || zoneMinutes > 59)
            return undefined;
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
export function readArray(value, item) {
    if (!Array.isArray(value))
        return undefined;
    const items = [];
    for (const entry of value) {
        const read = item(entry);
        if (read !== undefined)
            items.push(read);
    }
    return items;
}
/** This function gives the text of an own field of a record (`readText`), or `undefined`. */
export function textOf(value, key) {
    return readText(fieldOf(value, key));
}
/** This function gives the finite number of an own field of a record (`readNumber`), or `undefined`. */
export function numberOf(value, key) {
    return readNumber(fieldOf(value, key));
}
/** This function gives the boolean of an own field of a record (`readBoolean`), or `undefined`. */
export function booleanOf(value, key) {
    return readBoolean(fieldOf(value, key));
}
/** This function gives the time of the ISO 8601 text of an own field of a record (`readTime`), or `undefined`. */
export function timeOf(value, key) {
    return readTime(fieldOf(value, key));
}
/** This function gives the record of an own field of a record (`readRecord`), or `undefined`. */
export function recordOf(value, key) {
    return readRecord(fieldOf(value, key));
}
/** This function gives the items of the array of an own field of a record (`readArray`), or `undefined`. */
export function arrayOf(value, key, item) {
    return readArray(fieldOf(value, key), item);
}
/** This function gives the kind of a value. */
export function kindOf(value) {
    if (value === null)
        return "null";
    return Array.isArray(value) ? "array" : typeof value;
}
/** This function makes a decoder from a reader. A value that the reader does not read gives an error with the name `expected`. */
export function decoderOf(reader, expected) {
    return (value) => {
        const read = reader(value);
        return read === undefined ? err({ path: [], expected, found: kindOf(value) }) : ok(read);
    };
}
/** This decoder gives a text with no space at its two ends (`readText`). */
export const decodeText = decoderOf(readText, "text");
/** This decoder gives a finite number (`readNumber`). */
export const decodeNumber = decoderOf(readNumber, "number");
/** This decoder gives a boolean (`readBoolean`). */
export const decodeBoolean = decoderOf(readBoolean, "boolean");
/** This decoder gives the time of an ISO 8601 text (`readTime`). */
export const decodeTime = decoderOf(readTime, "time");
/** This decoder gives a record (`readRecord`). It does not examine the fields. */
export const decodeRecord = decoderOf(readRecord, "record");
/** This function makes a decoder that gives `undefined` for an absent value: `undefined` or `null`. Other values go to `decoder`. */
export function decodeOptional(decoder) {
    return (value) => (value === undefined || value === null ? ok(undefined) : decoder(value));
}
const below = (key, error) => ({ ...error, path: [key, ...error.path] });
/** This function makes a decoder of an array. Each item goes to `item`. The first bad item gives the error, with its index in the path. */
export function decodeArray(item) {
    return (value) => {
        if (!Array.isArray(value))
            return err({ path: [], expected: "array", found: kindOf(value) });
        const items = [];
        for (let index = 0; index < value.length; index++) {
            const result = item(value[index]);
            if (result.tag === "err")
                return err(below(index, result.error));
            items.push(result.value);
        }
        return ok(items);
    };
}
/**
 * This function makes a decoder of a record. Each key of `shape` reads its own field with its decoder, in the order of
 * the keys of `shape`. The first bad field gives the error, with its key in the path. The decoder ignores the other fields.
 */
export function decodeFields(shape) {
    const entries = Object.entries(shape);
    return (value) => {
        if (!isRecord(value))
            return err({ path: [], expected: "record", found: kindOf(value) });
        const fields = [];
        for (const [key, decoder] of entries) {
            const result = decoder(fieldOf(value, key));
            if (result.tag === "err")
                return err(below(key, result.error));
            fields.push([key, result.value]);
        }
        // `Object.fromEntries` makes an own field also for the key `__proto__`.
        return ok(Object.fromEntries(fields));
    };
}
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;
/** This function gives the text of a path for a message, for example `$.items[0].id`. A key that is not a name goes in brackets. */
export function pathText(path) {
    return path.reduce((text, part) => {
        if (typeof part === "number")
            return `${text}[${part}]`;
        return IDENTIFIER.test(part) ? `${text}.${part}` : `${text}[${JSON.stringify(part)}]`;
    }, "$");
}
//# sourceMappingURL=read.js.map