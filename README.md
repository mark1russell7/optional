# optional

The Optional of the family: a value that is present (`some`) or absent (`none`). It replaces `null`, `undefined` and exceptions in a total evaluation.

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
| Graph | Graph uses a sentinel form: a value or the symbol `NotFound`. `fromSentinel` and `toSentinel` change between the two forms. |

## API

| Export | What it does |
|---|---|
| `Optional<T>`, `Some<T>`, `None` | The types: `{ tag: "some", value }` or `{ tag: "none" }` |
| `some(value)`, `none` | The two kinds of value. `none` is one frozen object. |
| `isSome(o)`, `isNone(o)` | The type guards |
| `map(o, f)`, `flatMap(o, f)` | `f` applies to a present value. An absent value stays absent. The tests check the functor laws and the monad laws. |
| `unwrap(o)`, `getOr(o, fallback)` | The present value, or `undefined`, or the fallback |
| `fromNullable(value)` | `none` for `null` and `undefined`, else `some(value)` |
| `fromSentinel(value, sentinel)`, `toSentinel(o, sentinel)` | The change between this form and a sentinel form |

## Commands

```sh
pnpm install
pnpm check    # the type check, the tests and the writing rules
pnpm build    # dist/: commit it after a change, because a github: dependency does not build the package
```

## Writing style

The prose of this repository follows ASD-STE100 Simplified Technical English (STE). STE is a style target. ASD does not certify this repository.

## License

MIT
