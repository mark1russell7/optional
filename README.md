# optional

The Optional and the Result of the family. An optional is a value that is present (`some`) or absent (`none`). It replaces `null`, `undefined` and exceptions in a total evaluation. A result is a value (`ok`) or an error (`err`).

```ts
import { fromNullable, getOr, map, none, some, type Optional } from "@mark1russell7/optional";

const width: Optional<number> = some(4);
getOr(map(width, (w) => w * 2), 0); // 8
getOr(fromNullable(undefined), 0);  // 0
```

## Users

| Project | Use |
|---|---|
| [render](https://github.com/mark1russell7/render) | `@render/optional` gives the exports of this package. |
| [Vex](https://github.com/mark1russell7/vex) | The type `Optional` of `@mark1russell7/vex` is the type of this package. |

## API

| Export | What it does |
|---|---|
| `Optional<T>`, `Some<T>`, `None` | The types: `{ tag: "some", value }` or `{ tag: "none" }` |
| `some(value)`, `none` | The two kinds of value. `none` is one frozen object. |
| `isSome(o)`, `isNone(o)` | The type guards |
| `map(o, f)`, `flatMap(o, f)` | `f` applies to a present value. An absent value stays absent. The tests check the functor laws and the monad laws. |
| `filter(o, p)` | The present value stays when `p` is `true` for it. Otherwise, the result is `none`. A type guard `p` narrows the type. |
| `unwrap(o)`, `getOr(o, fallback)` | The present value, or `undefined`, or the fallback |
| `fromNullable(value)` | `none` for `null` and `undefined`, else `some(value)` |
| `fromSentinel(value, sentinel)`, `toSentinel(o, sentinel)` | The change between this form and a sentinel form |
| `Result<T, E>`, `Ok<T>`, `Err<E>` | The types: `{ tag: "ok", value }` or `{ tag: "err", error }` |
| `ok(value)`, `err(error)` | The two kinds of result |
| `isOk(r)`, `isErr(r)` | The type guards |
| `mapResult(r, f)`, `flatMapResult(r, f)` | `f` applies to a value. An error stays the same. The tests check the functor laws and the monad laws. |
| `mapErr(r, f)` | `f` applies to an error. A value stays the same. The tests check the functor laws. |
| `getOkOr(r, fallback)` | The value, or the fallback for an error |
| `tryCatch(f, onError?)`, `tryCatchAsync(f, onError?)` | `ok` of the value of `f`, or `err` of the thrown value or the rejection |
| `fromOptional(o, error)`, `toOptional(r)` | The change between an optional and a result. The tests check the round trip. |

## Results

A result carries the error of a step that failed. `flatMapResult` stops at the first error.

```ts
import { err, flatMapResult, getOkOr, mapErr, ok, tryCatch, type Result } from "@mark1russell7/optional";

const parse = (text: string): Result<unknown, string> => mapErr(tryCatch(() => JSON.parse(text) as unknown), () => "not JSON");
const width = (value: unknown): Result<number, string> => (typeof value === "number" ? ok(value) : err("not a number"));

getOkOr(flatMapResult(parse("4"), width), 0);   // 4
flatMapResult(parse("{"), width);               // { tag: "err", error: "not JSON" }
```

## Typed reads

The entry `@mark1russell7/optional/read` reads unknown values, for example the value of a parsed JSON text. It has no dependency.

- A reader gives a value of one type, or `undefined` for a value of a different type.
- A field reader reads an own field of a record. A field of the prototype gives `undefined`.
- A decoder gives a `Result`: the value, or the path of the first bad field.
- Use `readArray` when one bad item must not stop the other items, for example the entries of a feed. Use `decodeArray` when each item must be correct.

| Export | What it does |
|---|---|
| `isRecord(value)` | `true` for an object that is not an array and not `null` |
| `isPlainObject(value)` | `true` for a record whose prototype is `Object.prototype` or `null`. A class instance, a `Date` and a `Map` give `false`. |
| `readText`, `readNumber`, `readBoolean`, `readRecord` | A text with no space at its ends (a blank text gives `undefined`), a finite number, a boolean, a record |
| `readTime(value)` | The milliseconds of an ISO 8601 text: a date, or a date and a time with a zone. Other texts give `undefined`. |
| `readHttpTime(value)` | The milliseconds of a date of HTTP (RFC 9110) or of mail and RSS (RFC 5322), for example `Wed, 18 Nov 2026 10:30:00 GMT` |
| `readArray(value, item)` | The items that the reader `item` reads. The reader drops each other item. |
| `fieldOf`, `textOf`, `numberOf`, `booleanOf`, `timeOf`, `httpTimeOf`, `recordOf`, `arrayOf` | The same reads on an own field of a record |
| `decodeText`, `decodeNumber`, `decodeBoolean`, `decodeTime`, `decodeHttpTime`, `decodeRecord`, `decoderOf(reader, expected)` | Decoders of one value |
| `decodeArray(item)`, `decodeFields(shape)`, `decodeOptional(decoder)` | Decoders of an array, of a record and of an optional value |
| `DecodeError`, `pathText(path)`, `kindOf(value)` | The error: the path as keys and indexes, the expected value and the kind of the found value. It does not hold the value. |

```ts
import { decodeArray, decodeFields, decodeText, decodeTime, pathText, textOf } from "@mark1russell7/optional/read";

textOf({ title: " Flood " }, "title"); // "Flood"
const feed = decodeFields({ items: decodeArray(decodeFields({ id: decodeText, sent: decodeTime })) });
const result = feed({ items: [{ id: "a", sent: "2026-11-18T10:00:00Z" }, { id: "b", sent: "Nov 18" }] });
// { tag: "err", error: { path: ["items", 1, "sent"], expected: "time", found: "string" } }
if (result.tag === "err") pathText(result.error.path); // "$.items[1].sent"
```

## Site

The site [mark1russell7.github.io/optional](https://mark1russell7.github.io/optional/) shows the package live in the browser:

- The pipeline playground shows the value after each step. After a `none`, the functions of the next steps do not operate.
- The law panel checks the functor laws and the monad laws on random cases from a seed.

The source of the site is in `site/`. `pnpm --filter @optional/site run dev` starts it.

## Commands

```sh
pnpm install
pnpm check    # the type check, the tests and the writing rules, also of the site
pnpm build    # dist/: commit it after a change, because a github: dependency does not build the package
```

## Writing style

The prose of this repository follows ASD-STE100 Simplified Technical English (STE). STE is a style target. ASD does not certify this repository.

## License

MIT
