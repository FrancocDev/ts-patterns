/**
 * ts-patterns — Zero-dependency TypeScript utility library.
 *
 * Tree-shakeable ESM modules for type-safe patterns in TypeScript.
 *
 * The barrel re-exports all modules, resolving naming conflicts explicitly.
 * Conflicting names across modules are resolved as follows:
 * - `map`, `andThen`, `unwrapOr` — result.ts takes precedence (use "ts-patterns/option" for Option variants)
 * - `match` — match.ts takes precedence (use "ts-patterns/result" for Result.match)
 * - `Guard` — guards.ts takes precedence (use "ts-patterns/builder" for Builder.Guard)
 *
 * For tree-shaking, prefer subpath imports:
 * ```ts
 * import { map } from "ts-patterns/result"
 * import { isString } from "ts-patterns/guards"
 * ```
 */

// No conflicts: brand.ts
export * from "./brand.js";

// Result module — skip `match` (match.ts takes precedence)
export type { Result, Success, Failure } from "./result.js";
export { success, failure, map, mapErr, andThen, unwrapOr } from "./result.js";

// Option module — export only unique symbols (map/andThen/unwrapOr conflict with result)
export type { Option, Some, None } from "./option.js";
export { some, none, fromNullable, isSome, isNone } from "./option.js";

// Builder module
export { Builder, createBuilder } from "./builder.js";

// Guards module — Guard takes precedence
export type { Guard } from "./guards.js";
export {
  isString,
  isNumber,
  isBoolean,
  isBigint,
  isSymbol,
  isUndefined,
  isNull,
  isDate,
  isLiteral,
  isArray,
  isRecord,
  isOptional,
  isNullable,
  and,
  or,
} from "./guards.js";

// Match module — match takes precedence
export { match, Matcher } from "./match.js";
