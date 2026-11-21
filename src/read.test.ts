import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import { err, ok } from "./index.ts";
import {
  arrayOf,
  booleanOf,
  decodeArray,
  decodeBoolean,
  decodeFields,
  decodeHttpTime,
  decodeNumber,
  decodeOptional,
  decoderOf,
  decodeRecord,
  decodeText,
  decodeTime,
  fieldOf,
  httpTimeOf,
  isPlainObject,
  isRecord,
  kindOf,
  numberOf,
  pathText,
  readArray,
  readBoolean,
  readHttpTime,
  readNumber,
  readRecord,
  readText,
  readTime,
  recordOf,
  textOf,
  timeOf,
  type Reader,
  type ValueKind,
} from "./read.ts";

// One arbitrary for each kind of a value of a parsed text, and two more kinds.
const KINDS: Readonly<Record<ValueKind, fc.Arbitrary<unknown>>> = {
  undefined: fc.constant(undefined),
  null: fc.constant(null),
  array: fc.array(fc.anything(), { maxLength: 4 }),
  object: fc.dictionary(fc.string(), fc.anything(), { maxKeys: 4 }),
  string: fc.string(),
  number: fc.double(),
  boolean: fc.boolean(),
  bigint: fc.bigInt(),
  symbol: fc.string().map((name) => Symbol(name)),
  function: fc.constant(() => 0),
};
const other = (kind: ValueKind): fc.Arbitrary<unknown> => fc.oneof(...Object.entries(KINDS).filter(([name]) => name !== kind).map(([, arbitrary]) => arbitrary));

const READERS: readonly [string, ValueKind, Reader<unknown>][] = [
  ["readText", "string", readText],
  ["readNumber", "number", readNumber],
  ["readBoolean", "boolean", readBoolean],
  ["readRecord", "object", readRecord],
  ["readTime", "string", readTime],
  ["readHttpTime", "string", readHttpTime],
  ["readArray", "array", (value) => readArray(value, readText)],
];

const DATE_RANGE = { min: new Date("0000-01-01T00:00:00.000Z"), max: new Date("9999-12-31T23:59:59.999Z"), noInvalidDate: true };
const two = (n: number): string => String(n).padStart(2, "0");

describe("isRecord", () => {
  it("is true for each object that is not an array, and false for each other value", () => {
    fc.assert(fc.property(KINDS.object, (value) => isRecord(value)));
    fc.assert(fc.property(other("object"), (value) => !isRecord(value)));
    expect(isRecord(Object.create(null))).toBe(true);
    expect(isRecord([])).toBe(false);
    expect(isRecord(null)).toBe(false);
  });
});

describe("isPlainObject", () => {
  class Point {
    readonly x: number;
    constructor(x: number) {
      this.x = x;
    }
  }

  it("is true for each object of a parsed JSON text, and for an object with no prototype", () => {
    fc.assert(fc.property(KINDS.object, (value) => isPlainObject(value)));
    // Each object at each depth of a parsed text is a plain object.
    const plain = (value: unknown): boolean =>
      Array.isArray(value) ? value.every(plain) : isRecord(value) ? isPlainObject(value) && Object.values(value).every(plain) : true;
    fc.assert(fc.property(fc.json(), (text) => plain(JSON.parse(text))));
    expect(isPlainObject(Object.create(null))).toBe(true);
  });

  it("is false for each value that is not a record, and for each record with a different prototype", () => {
    fc.assert(fc.property(other("object"), (value) => !isPlainObject(value)));
    // A class instance is a record, but not a plain object.
    fc.assert(fc.property(fc.double(), (x) => isRecord(new Point(x)) && !isPlainObject(new Point(x))));
    const others: readonly unknown[] = [new Date(0), new Map(), new Set(), /a/u, Object.create({}), Object.create(Object.create(null))];
    for (const value of others) expect(isPlainObject(value)).toBe(false);
  });

  it("is true only for a record", () => {
    const anything = fc.anything({ withNullPrototype: true, withMap: true, withSet: true, withDate: true, withBoxedValues: true, withTypedArray: true });
    fc.assert(fc.property(anything, (value) => !isPlainObject(value) || isRecord(value)));
  });
});

describe("kindOf", () => {
  it("gives the kind of each arbitrary of its kind", () => {
    for (const [kind, arbitrary] of Object.entries(KINDS)) fc.assert(fc.property(arbitrary, (value) => kindOf(value) === kind));
  });
});

describe("the readers", () => {
  it.each(READERS)("%s gives undefined for each value of a wrong kind", (_name, kind, reader) => {
    fc.assert(fc.property(other(kind), (value) => reader(value) === undefined));
  });

  it("readText gives the text with no space at its ends, and undefined for a blank text", () => {
    fc.assert(fc.property(fc.string(), (text) => readText(text) === (text.trim() === "" ? undefined : text.trim())));
    expect(readText("  a b \n")).toBe("a b");
    expect(readText(" \t")).toBeUndefined();
  });

  it("readNumber gives each finite number, and undefined for NaN, an infinity and a numeric text", () => {
    fc.assert(fc.property(fc.double({ noNaN: true, noDefaultInfinity: true }), (n) => readNumber(n) === n));
    expect([Number.NaN, Infinity, -Infinity, "1"].map(readNumber)).toEqual([undefined, undefined, undefined, undefined]);
  });

  it("readBoolean gives each boolean, and undefined for a text of a boolean", () => {
    fc.assert(fc.property(fc.boolean(), (b) => readBoolean(b) === b));
    expect(readBoolean("true")).toBeUndefined();
  });

  it("readRecord gives the same record", () => {
    fc.assert(fc.property(KINDS.object, (value) => readRecord(value) === value));
  });

  it("readArray keeps the items that the reader reads, in order", () => {
    fc.assert(
      fc.property(fc.array(fc.oneof(fc.string(), fc.double(), fc.constant(null))), (items) => {
        const read = readArray(items, readText);
        expect(read).toEqual(items.map(readText).filter((text) => text !== undefined));
      }),
    );
  });
});

describe("readTime", () => {
  it("gives the time of each text of toISOString, from the year 0 to the year 9999", () => {
    fc.assert(fc.property(fc.date(DATE_RANGE), (date) => readTime(date.toISOString()) === date.getTime()));
  });

  it("agrees with Date.parse on a time with a zone offset", () => {
    const parts = fc.record({
      date: fc.date({ min: new Date("1970-01-01T00:00:00Z"), max: new Date("2100-12-31T23:59:59Z"), noInvalidDate: true }),
      hours: fc.integer({ min: 0, max: 14 }),
      minutes: fc.constantFrom(0, 15, 30, 45),
      sign: fc.constantFrom("+", "-"),
      seconds: fc.boolean(),
    });
    fc.assert(
      fc.property(parts, ({ date, hours, minutes, sign, seconds }) => {
        const iso = date.toISOString();
        const clock = seconds ? iso.slice(0, 19) : iso.slice(0, 16);
        const text = `${clock}${sign}${two(hours)}:${two(minutes)}`;
        expect(readTime(text)).toBe(Date.parse(text));
      }),
    );
  });

  it("gives the start of the day in UTC for a date with no time", () => {
    expect(readTime("2026-11-18")).toBe(Date.UTC(2026, 10, 18));
    expect(readTime("0001-01-01")).toBe(new Date("0001-01-01T00:00:00Z").getTime());
  });

  it("refuses each text that Date.parse reads but ISO 8601 does not allow", () => {
    const forms: readonly ((date: Date) => string)[] = [
      (date) => date.toUTCString(),
      (date) => date.toString(),
      (date) => date.toDateString(),
      (date) => `${date.getUTCMonth() + 1}/${date.getUTCDate()}/${date.getUTCFullYear()}`,
      (date) => date.toISOString().replace("T", " "),
      (date) => date.toISOString().toLowerCase(),
      (date) => date.toISOString().replace("Z", "+0000"),
      (date) => ` ${date.toISOString()}`,
    ];
    const dates = fc.date({ min: new Date("1971-01-01T00:00:00Z"), max: new Date("2100-12-31T23:59:59Z"), noInvalidDate: true });
    fc.assert(
      fc.property(dates, fc.constantFrom(...forms), (date, form) => {
        const text = form(date);
        fc.pre(Number.isFinite(Date.parse(text)));
        expect(readTime(text)).toBeUndefined();
      }),
    );
  });

  it("refuses a local time with no zone, because it is not one instant", () => {
    fc.assert(fc.property(fc.date(DATE_RANGE), (date) => readTime(date.toISOString().slice(0, 19)) === undefined));
  });

  it("refuses a day that its month does not have, and a time out of range", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 9999 }), fc.integer({ min: 1, max: 12 }), (year, month) => {
        const days = new Date(Date.UTC(2000, month, 0)).getUTCDate() - (month === 2 ? 1 : 0);
        const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
        const last = month === 2 && leap ? 29 : days;
        const head = `${String(year).padStart(4, "0")}-${two(month)}`;
        expect(readTime(`${head}-${two(last)}`)).toBeTypeOf("number");
        expect(readTime(`${head}-${two(last + 1)}`)).toBeUndefined();
      }),
    );
    expect(["2026-00-10", "2026-13-01", "2026-11-00", "2026-11-18T24:00:00Z", "2026-11-18T10:60:00Z", "2026-11-18T10:00:60Z", "2026-11-18T10:00:00+24:00", "2026-11-18T10:00:00+05:60"].map(readTime)).toEqual(Array(8).fill(undefined));
  });

  it("reads a fraction of a second to the millisecond, with a point or a comma", () => {
    expect(readTime("2026-11-18T10:30:00.5Z")).toBe(Date.UTC(2026, 10, 18, 10, 30, 0, 500));
    expect(readTime("2026-11-18T10:30:00,123456Z")).toBe(Date.UTC(2026, 10, 18, 10, 30, 0, 123));
    expect(readTime("2026-11-18T10:30+01")).toBe(Date.UTC(2026, 10, 18, 9, 30));
  });
});

describe("readHttpTime", () => {
  const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const LONG_DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const clock = (date: Date): string => date.toISOString().slice(11, 19);
  const seconds = (date: Date): number => date.getTime() - date.getUTCMilliseconds();

  it("gives the time of each text of toUTCString, the IMF-fixdate of RFC 9110, from the year 1000 to the year 9999", () => {
    const dates = fc.date({ min: new Date("1000-01-01T00:00:00Z"), max: DATE_RANGE.max, noInvalidDate: true });
    fc.assert(fc.property(dates, (date) => readHttpTime(date.toUTCString()) === seconds(date)));
  });

  it("gives the time of the two obsolete forms of RFC 9110, from 1950 to 2049", () => {
    // RFC 850 has a year of two digits. From 1950 to 2049 the rule of RFC 5322 gives the year of the date.
    const dates = fc.date({ min: new Date("1950-01-01T00:00:00Z"), max: new Date("2049-12-31T23:59:59Z"), noInvalidDate: true });
    const rfc850 = (date: Date): string => `${LONG_DAY[date.getUTCDay()] ?? ""}, ${two(date.getUTCDate())}-${MONTH[date.getUTCMonth()] ?? ""}-${two(date.getUTCFullYear() % 100)} ${clock(date)} GMT`;
    // The asctime form has no zone. Date.parse reads it as a local time, but RFC 9110 makes it UTC.
    const asctime = (date: Date): string => `${DAY[date.getUTCDay()] ?? ""} ${MONTH[date.getUTCMonth()] ?? ""} ${String(date.getUTCDate()).padStart(2, " ")} ${clock(date)} ${String(date.getUTCFullYear())}`;
    fc.assert(fc.property(dates, (date) => readHttpTime(rfc850(date)) === seconds(date) && readHttpTime(asctime(date)) === seconds(date)));
  });

  it("agrees with Date.parse on each form of RFC 5322, with each zone", () => {
    const forms: readonly ((date: Date, zone: string) => string)[] = [
      (date, zone) => `${DAY[date.getUTCDay()] ?? ""}, ${String(date.getUTCDate())} ${MONTH[date.getUTCMonth()] ?? ""} ${String(date.getUTCFullYear())} ${clock(date)} ${zone}`,
      (date, zone) => `${String(date.getUTCDate())} ${MONTH[date.getUTCMonth()] ?? ""} ${String(date.getUTCFullYear())} ${clock(date).slice(0, 5)} ${zone}`,
      (date, zone) => `${DAY[date.getUTCDay()] ?? ""}, ${two(date.getUTCDate())} ${MONTH[date.getUTCMonth()] ?? ""} ${String(date.getUTCFullYear())} ${clock(date)} ${zone} (a comment)`,
    ];
    const zones = fc.oneof(
      fc.constantFrom("GMT", "UT", "UTC", "Z", "EST", "EDT", "CST", "CDT", "MST", "MDT", "PST", "PDT", "gmt", "est"),
      fc.tuple(fc.constantFrom("+", "-"), fc.integer({ min: 0, max: 14 }), fc.constantFrom(0, 30, 45)).map(([sign, hours, minutes]) => `${sign}${two(hours)}${two(minutes)}`),
    );
    const dates = fc.date({ min: new Date("1000-01-01T00:00:00Z"), max: new Date("2999-12-31T23:59:59Z"), noInvalidDate: true });
    fc.assert(
      fc.property(dates, zones, fc.constantFrom(...forms), (date, zone, form) => {
        const text = form(date, zone);
        expect(readHttpTime(text)).toBe(Date.parse(text));
      }),
    );
  });

  it("reads the dates of RSS feeds, with a zone offset or the military zone Z", () => {
    expect(readHttpTime("Sun, 01 Nov 2026 08:36:00 -0600")).toBe(Date.UTC(2026, 10, 1, 14, 36));
    expect(readHttpTime("Tue, 30 Jul 2024 12:00:00 Z")).toBe(Date.UTC(2024, 6, 30, 12));
    expect(readHttpTime("tue, 30 jul 2024 12:00:00 z")).toBe(Date.UTC(2024, 6, 30, 12));
    expect(readHttpTime("Wed,18 Nov 2026 10:30 +0530")).toBe(Date.UTC(2026, 10, 18, 5));
  });

  it("gives a year of two or three digits by the rule of RFC 5322", () => {
    expect(readHttpTime("18 Nov 49 10:30:00 GMT")).toBe(Date.UTC(2049, 10, 18, 10, 30));
    expect(readHttpTime("18 Nov 50 10:30:00 GMT")).toBe(Date.UTC(1950, 10, 18, 10, 30));
    expect(readHttpTime("18 Nov 126 10:30:00 GMT")).toBe(Date.UTC(2026, 10, 18, 10, 30));
    expect(readHttpTime("Sunday, 06-Nov-94 08:49:37 GMT")).toBe(Date.UTC(1994, 10, 6, 8, 49, 37));
  });

  it("does not compare the name of the day with the date, as Date.parse does not", () => {
    expect(readHttpTime("Mon, 18 Nov 2026 10:30:00 GMT")).toBe(readHttpTime("Wed, 18 Nov 2026 10:30:00 GMT"));
  });

  it("refuses an ISO 8601 text, a space at an end, a military zone other than Z and a field out of its range", () => {
    const texts = [
      "2026-11-18T10:30:00Z",
      " Wed, 18 Nov 2026 10:30:00 GMT",
      "Wed, 18 Nov 2026 10:30:00 GMT ",
      "Wed, 18 Nov 2026 10:30:00 A",
      "Wed, 18 Nov 2026 10:30:00 XYZ",
      "Wed, 18 Nov 2026 10:30:00",
      "Mon, 30 Feb 2026 10:30:00 GMT",
      "Wed, 18 Nov 2026 24:00:00 GMT",
      "Wed, 18 Nov 2026 10:60:00 GMT",
      "Wed, 18 Nov 2026 10:30:60 GMT",
      "Wed, 18 Nov 2026 10:30:00 +2400",
      "Wed, 18 Nov 2026 10:30:00 +0560",
      "Wed, 18 Foo 2026 10:30:00 GMT",
      "Wednesday, 18-Nov-2026 10:30:00 GMT",
      "Wed Nov 18 10:30:00 2026 GMT",
    ];
    expect(texts.map(readHttpTime)).toEqual(Array(texts.length).fill(undefined));
  });
});

describe("the field readers", () => {
  it("read an own field of a record with the reader of their type", () => {
    const record = { text: " a ", n: 2, b: false, at: "2026-11-18T00:00:00Z", inner: { x: 1 }, list: ["a", 1, " "] };
    expect(textOf(record, "text")).toBe("a");
    expect(numberOf(record, "n")).toBe(2);
    expect(booleanOf(record, "b")).toBe(false);
    expect(timeOf(record, "at")).toBe(Date.UTC(2026, 10, 18));
    expect(httpTimeOf({ date: "Wed, 18 Nov 2026 00:00:00 GMT" }, "date")).toBe(Date.UTC(2026, 10, 18));
    expect(recordOf(record, "inner")).toEqual({ x: 1 });
    expect(arrayOf(record, "list", readText)).toEqual(["a"]);
    expect(textOf(record, "n")).toBeUndefined();
  });

  it("give undefined for a value that is not a record, an absent field and a field of the prototype", () => {
    fc.assert(fc.property(other("object"), fc.string(), (value, key) => fieldOf(value, key) === undefined && textOf(value, key) === undefined));
    const inherited = Object.create({ name: "a" }) as object;
    expect(fieldOf(inherited, "name")).toBeUndefined();
    for (const key of ["constructor", "__proto__", "toString", "hasOwnProperty"]) {
      expect(fieldOf({}, key)).toBeUndefined();
      expect(recordOf({}, key)).toBeUndefined();
    }
    expect(fieldOf(JSON.parse('{"__proto__": {"x": 1}}'), "__proto__")).toEqual({ x: 1 });
  });
});

describe("the decoders", () => {
  const item = decodeFields({ id: decodeText, at: decodeTime, count: decodeOptional(decodeNumber) });
  const document = decodeFields({ items: decodeArray(item), live: decodeBoolean });
  const good = fc.record({ id: fc.string({ minLength: 1 }).filter((id) => id.trim() !== ""), at: fc.date(DATE_RANGE).map((date) => date.toISOString()) });

  it("give the value of a good document, with no field that the shape does not name", () => {
    fc.assert(
      fc.property(fc.array(good, { maxLength: 6 }), fc.boolean(), (items, live) => {
        const result = document({ items: items.map((entry) => ({ ...entry, extra: 1 })), live, other: "x" });
        expect(result).toEqual(ok({ items: items.map((entry) => ({ id: entry.id.trim(), at: Date.parse(entry.at), count: undefined })), live }));
      }),
    );
  });

  it("give the path of the first bad field, as keys and indexes", () => {
    const bad = fc.constantFrom<[string, unknown, string, ValueKind]>(["id", 7, "text", "number"], ["at", "18 Nov 2026", "time", "string"], ["count", "1", "number", "string"], ["id", undefined, "text", "undefined"]);
    fc.assert(
      fc.property(fc.array(good, { minLength: 1, maxLength: 6 }), fc.nat(), bad, fc.boolean(), (items, seed, [field, value, expected, found], twice) => {
        const index = seed % items.length;
        const broken: Record<string, unknown>[] = items.map((entry) => ({ ...entry }));
        broken[index]![field] = value;
        // A second bad item after the first does not change the error.
        if (twice && index + 1 < broken.length) broken[index + 1]!["id"] = null;
        expect(document({ items: broken, live: true })).toEqual(err({ path: ["items", index, field], expected, found }));
      }),
    );
    expect(document([])).toEqual(err({ path: [], expected: "record", found: "array" }));
    expect(document({ items: {}, live: true })).toEqual(err({ path: ["items"], expected: "array", found: "object" }));
    expect(document({ items: [], live: "yes" })).toEqual(err({ path: ["live"], expected: "boolean", found: "string" }));
  });

  it("decodeOptional gives undefined for undefined and null, and decodes each other value", () => {
    const optional = decodeOptional(decodeText);
    expect([optional(undefined), optional(null), optional(" a"), optional(1)]).toEqual([ok(undefined), ok(undefined), ok("a"), err({ path: [], expected: "text", found: "number" })]);
  });

  it("decoderOf names the expected value, and each decoder agrees with its reader", () => {
    const pairs: readonly [(value: unknown) => unknown, Reader<unknown>][] = [
      [decodeText, readText],
      [decodeNumber, readNumber],
      [decodeBoolean, readBoolean],
      [decodeTime, readTime],
      [decodeHttpTime, readHttpTime],
      [decodeRecord, readRecord],
    ];
    fc.assert(
      fc.property(fc.anything(), (value) => {
        for (const [decoder, reader] of pairs) {
          const read = reader(value);
          expect(decoder(value)).toMatchObject(read === undefined ? { tag: "err" } : { tag: "ok", value: read });
        }
      }),
    );
    expect(decoderOf(readNumber, "a count")("x")).toEqual(err({ path: [], expected: "a count", found: "string" }));
  });

  it("keep the key __proto__ as an own field of the value", () => {
    const result = decodeFields({ ["__proto__"]: decodeText })(JSON.parse('{"__proto__": "a"}'));
    expect(result.tag === "ok" && Object.hasOwn(result.value, "__proto__")).toBe(true);
  });
});

describe("pathText", () => {
  it("writes a path for a message", () => {
    expect(pathText([])).toBe("$");
    expect(pathText(["items", 0, "id"])).toBe("$.items[0].id");
    expect(pathText(["a b", 2, "$x"])).toBe('$["a b"][2].$x');
  });
});
