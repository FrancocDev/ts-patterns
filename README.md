# ts-patterns

Zero-dependency TypeScript utility library with tree-shakeable ESM modules for type-safe patterns.

## Install

```bash
npm install ts-patterns
# or
bun add ts-patterns
```

## Modules

All modules are standalone — import only what you need:

```ts
import { map } from "ts-patterns/result";   // Only Result module
import { isString } from "ts-patterns/guards"; // Only Guards module
```

### Branded Types

Nominal typing via intersection types — zero runtime overhead.

```ts
import { createBrand, type Branded } from "ts-patterns/brand";

const UserId = createBrand<"UserId">("UserId");
const id = UserId.of("abc"); // Branded<string, "UserId">

// Runtime validation
const Email = createBrand<"Email">("Email");
Email.of("bad", (v) => /@/.test(v)); // throws TypeError
Email.from("bad", (v) => /@/.test(v)); // undefined

// Cross-brand assignment blocked at compile time
// @ts-expect-error
const bad: Branded<string, "UserId"> = Email.of("test@example.com");
```

### Result Type

A discriminated union `Success<T> | Failure<E>` for representing operations that can fail.

```ts
import { success, failure, map, mapErr, andThen, unwrapOr, match } from "ts-patterns/result";
import type { Result } from "ts-patterns/result";

const r: Result<number, string> = success(42);

map(r, x => x * 2);        // success(84)
mapErr(r, e => e.toUpperCase()); // passthrough (same success(42))
andThen(r, x => success(x * 3)); // success(126)
unwrapOr(r, 0);            // 42
match(r, v => v, e => -1); // 42
```

### Option Type

A discriminated union `Some<T> | None` for optional values — never null inside `Some`.

```ts
import { some, none, fromNullable, isSome, isNone, map, andThen, unwrapOr, match } from "ts-patterns/option";
import type { Option } from "ts-patterns/option";

const x = some(42);
map(x, v => v * 2);          // some(84)
andThen(x, v => some(v * 3)); // some(126)
unwrapOr(x, 0);              // 42
match(x, v => v, () => -1);  // 42

// Null-safe constructor
fromNullable(null);     // none
fromNullable(42);       // some(42)

// Type guards
if (isSome(x)) { /* x.value is number */ }
if (isNone(x)) { /* x is None */ }
```

### Type-Safe Builder

Step-by-step construction with compile-time type tracking. Each `.add()` changes the return type — duplicate keys fail at compile time.

```ts
import { createBuilder } from "ts-patterns/builder";

const query = createBuilder()
  .add("where", { id: 1 })
  .add("select", ["id", "name"])
  .add("limit", 10)
  .build();
// query: { where: { id: number }; select: string[]; limit: number }

// @ts-expect-error — duplicate key
createBuilder().add("x", 1).add("x", 2);

// Escape hatch for 5+ steps
interface Query {
  where: Record<string, unknown>;
  select: string[];
  orderBy: string;
  limit: number;
  offset: number;
}
const q = createBuilder<Query>()
  .add("where", { active: true })
  .add("select", ["id"])
  .add("orderBy", "created_at")
  .add("limit", 10)
  .add("offset", 0)
  .build();
```

### Guard Functions

Composable runtime type-checking predicates — individual exports for tree-shaking.

```ts
import {
  isString, isNumber, isBoolean, isBigint, isSymbol, isUndefined, isNull,
  isLiteral, isArray, isRecord, isOptional, isNullable, and, or,
} from "ts-patterns/guards";
import type { Guard } from "ts-patterns/guards";

// Object shape validation
const isPerson = isRecord({ name: isString, age: isNumber });
isPerson({ name: "Alice", age: 30 }); // true

// Array element validation
const isNumArr = isArray(isNumber);
isNumArr([1, 2, 3]); // true

// Composition
const isStrOrNum = or(isString, isNumber);
const isOptStr = isOptional(isString);

// Literal matching
const isActive = isLiteral("active");
isActive("active"); // true
```

### Pattern Matching

Exhaustive discriminated union matching with a chainable API.

```ts
import { match } from "ts-patterns/match";
import { isString, isNumber, isLiteral, isRecord } from "ts-patterns/guards";

// With type guards
const result = match(value as string | number)
  .case(isString, s => s.length)
  .case(isNumber, n => n)
  .otherwise(() => 0);

// With literals
type Status = "active" | "inactive" | "pending";
match(status)
  .case(isLiteral("active"), () => "on")
  .case(isLiteral("inactive"), () => "off")
  .case(isLiteral("pending"), () => "wait")
  .exhaust(() => "unknown");

// With discriminated unions
type Shape =
  | { _tag: "circle"; radius: number }
  | { _tag: "square"; side: number };
const isCircle = (x: unknown): x is Shape & { _tag: "circle" } =>
  typeof x === "object" && x !== null && (x as Shape)._tag === "circle";
const isSquare = (x: unknown): x is Shape & { _tag: "square" } =>
  typeof x === "object" && x !== null && (x as Shape)._tag === "square";

match(shape)
  .case(isCircle, c => Math.PI * c.radius ** 2)
  .case(isSquare, s => s.side ** 2)
  .exhaust(() => 0);
```

## API Reference

### `ts-patterns/brand`

| Export | Signature |
|--------|-----------|
| `Branded<T, B>` | `T & { readonly __brand: B }` |
| `createBrand<B>(name)` | `{ of<T>(v, validator?): Branded<T,B>; from<T>(v, validator?): Branded<T,B> \| undefined; unwrap<T>(v): T }` |

### `ts-patterns/result`

| Export | Signature |
|--------|-----------|
| `Result<T, E>` | `Success<T> \| Failure<E>` |
| `success<T>(v)` | `Result<T, never>` |
| `failure<E>(e)` | `Result<never, E>` |
| `map(r, f)` | `Result<U, E>` |
| `mapErr(r, f)` | `Result<T, F>` |
| `andThen(r, f)` | `Result<U, E>` |
| `unwrapOr(r, d)` | `T` |
| `match(r, onSuccess, onFailure)` | `R` |

### `ts-patterns/option`

| Export | Signature |
|--------|-----------|
| `Option<T>` | `Some<T> \| None` |
| `some<T>(v)` | `Option<T>` |
| `none` | `Option<never>` |
| `fromNullable<T>(v)` | `Option<NonNullable<T>>` |
| `isSome(o)` | `o is Some<T>` |
| `isNone(o)` | `o is None` |
| `map(o, f)` | `Option<U>` |
| `andThen(o, f)` | `Option<U>` |
| `unwrapOr(o, d)` | `T` |
| `match(o, onSome, onNone)` | `R` |

### `ts-patterns/builder`

| Export | Signature |
|--------|-----------|
| `Builder<T, K>` | `class` with `.add(key, value)`, `.build()` |
| `createBuilder()` | `Builder<{}, never>` |
| `createBuilder<T>()` | `Builder<{}, never>` (escape hatch) |

### `ts-patterns/guards`

| Export | Signature |
|--------|-----------|
| `Guard<T>` | `(x: unknown) => x is T` |
| `isString` | `Guard<string>` |
| `isNumber` | `Guard<number>` |
| `isBoolean` | `Guard<boolean>` |
| `isBigint` | `Guard<bigint>` |
| `isSymbol` | `Guard<symbol>` |
| `isUndefined` | `Guard<undefined>` |
| `isNull` | `Guard<null>` |
| `isLiteral(v)` | `Guard<typeof v>` |
| `isArray(g)` | `Guard<T[]>` |
| `isRecord(shape)` | `Guard<{ keys: Types }>` |
| `isOptional(g)` | `Guard<T \| undefined>` |
| `isNullable(g)` | `Guard<T \| null>` |
| `and(a, b)` | `Guard<A & B>` |
| `or(a, b)` | `Guard<A \| B>` |

### `ts-patterns/match`

| Export | Signature |
|--------|-----------|
| `match<T>(value)` | `Matcher<T>` |
| `Matcher<T>.case(guard, handler)` | `Matcher<Exclude<T, U>>` |
| `Matcher<T>.case(literal, handler)` | `Matcher<Exclude<T, U>>` |
| `Matcher<T>.otherwise(handler)` | `R` (fallback) |
| `Matcher<never>.exhaust(handler)` | `R` (all cases must be covered) |

## Build

```bash
bun run build    # ESM + declarations → dist/
bun test         # Run all tests
tsc --noEmit     # Type-check
npm publish      # Publish (runs build + test + typecheck via prepublishOnly)
```

## License

MIT
