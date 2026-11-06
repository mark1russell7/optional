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
