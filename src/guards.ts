/**
 * Guard Functions — composable runtime type-checking predicates.
 *
 * `Guard<T>` is a type predicate: `(x: unknown) => x is T`.
 * All guards are individual exports for maximum tree-shakeability.
 *
 * @example
 * ```ts
 * import { isString, isNumber, isRecord } from "ts-patterns/guards"
 *
 * const isPerson = isRecord({ name: isString, age: isNumber })
 * const alice = { name: "Alice", age: 30 }
 * isPerson(alice) // true — TypeScript narrows to { name: string; age: number }
 * ```
 */

// -- Types -----------------------------------------------------------------

/**
 * A type guard predicate function.
 * Returns `true` when the input matches type `T`, narrowing in TypeScript.
 */
export type Guard<T> = (x: unknown) => x is T;

// -- Primitive Guards ------------------------------------------------------

/** Guard that narrows `unknown` to `string`. */
export const isString: Guard<string> = (x: unknown): x is string =>
  typeof x === "string";

/** Guard that narrows `unknown` to `number`. */
export const isNumber: Guard<number> = (x: unknown): x is number =>
  typeof x === "number" && !Number.isNaN(x);

/** Guard that narrows `unknown` to `boolean`. */
export const isBoolean: Guard<boolean> = (x: unknown): x is boolean =>
  typeof x === "boolean";

/** Guard that narrows `unknown` to `bigint`. */
export const isBigint: Guard<bigint> = (x: unknown): x is bigint =>
  typeof x === "bigint";

/** Guard that narrows `unknown` to `symbol`. */
export const isSymbol: Guard<symbol> = (x: unknown): x is symbol =>
  typeof x === "symbol";

/** Guard that narrows `unknown` to `undefined`. */
export const isUndefined: Guard<undefined> = (x: unknown): x is undefined =>
  x === undefined;

/** Guard that narrows `unknown` to `null`. */
export const isNull: Guard<null> = (x: unknown): x is null => x === null;

// -- Composition Helpers ---------------------------------------------------

/**
 * Create a guard that matches a specific literal value.
 *
 * @param v — The literal value to match against
 * @returns A guard narrowing to the literal type of `v`
 *
 * @example
 * ```ts
 * const isActive = isLiteral("active")
 * isActive("active") // true
 * isActive("inactive") // false
 * ```
 */
export function isLiteral<const T extends string | number | boolean | null | undefined>(
  v: T,
): Guard<T> {
  return (x: unknown): x is T => x === v;
}

/**
 * Create a guard that checks whether a value is an array
 * where every element passes the inner guard.
 *
 * @param guard — The guard to apply to each element
 * @returns A guard narrowing to `T[]`
 *
 * @example
 * ```ts
 * const isNumberArray = isArray(isNumber)
 * isNumberArray([1, 2, 3]) // true
 * isNumberArray(["a"]) // false
 * ```
 */
export function isArray<T>(guard: Guard<T>): Guard<T[]> {
  return (x: unknown): x is T[] =>
    Array.isArray(x) && x.every((item) => guard(item));
}

/**
 * Create a guard that checks whether a value is an object
 * matching the given shape (each key is validated against its guard).
 *
 * Extra keys are allowed (structural subtyping — unchecked keys are ignored).
 *
 * @param shape — An object mapping keys to their guards
 * @returns A guard narrowing to the typed object
 *
 * @example
 * ```ts
 * const isPerson = isRecord({ name: isString, age: isNumber })
 * isPerson({ name: "Alice", age: 30 }) // true
 * isPerson({ name: "Alice" }) // false (missing age)
 * ```
 */
export function isRecord<T extends Record<string, Guard<unknown>>>(
  shape: T,
): Guard<{ [K in keyof T]: T[K] extends Guard<infer U> ? U : never }> {
  return (
    x: unknown,
  ): x is { [K in keyof T]: T[K] extends Guard<infer U> ? U : never } => {
    if (x === null || x === undefined || typeof x !== "object") {
      return false;
    }
    const obj = x as Record<string, unknown>;
    for (const key of Object.keys(shape)) {
      if (!(key in obj) || !shape[key](obj[key])) {
        return false;
      }
    }
    return true;
  };
}

/**
 * Make a guard accept `undefined` in addition to the matched type.
 *
 * @param guard — The inner guard
 * @returns A guard narrowing to `T | undefined`
 *
 * @example
 * ```ts
 * const isOptionalString = isOptional(isString)
 * isOptionalString("hello") // true
 * isOptionalString(undefined) // true
 * isOptionalString(42) // false
 * ```
 */
export function isOptional<T>(guard: Guard<T>): Guard<T | undefined> {
  return (x: unknown): x is T | undefined =>
    x === undefined || guard(x);
}

/**
 * Make a guard accept `null` in addition to the matched type.
 *
 * @param guard — The inner guard
 * @returns A guard narrowing to `T | null`
 *
 * @example
 * ```ts
 * const isNullableString = isNullable(isString)
 * isNullableString("hello") // true
 * isNullableString(null) // true
 * isNullableString(42) // false
 * ```
 */
export function isNullable<T>(guard: Guard<T>): Guard<T | null> {
  return (x: unknown): x is T | null => x === null || guard(x);
}

/**
 * Combine two guards with AND logic — passes only when BOTH guards pass.
 *
 * @param a — First guard
 * @param b — Second guard
 * @returns A guard narrowing to the intersection of both types
 *
 * @example
 * ```ts
 * const isStringAndNotLiteral = and(isString, (x): x is string => x !== "keep")
 * ```
 */
export function and<A, B>(
  a: Guard<A>,
  b: Guard<B>,
): Guard<A & B> {
  return (x: unknown): x is A & B => a(x) && b(x);
}

/**
 * Combine two guards with OR logic — passes when EITHER guard passes.
 *
 * @param a — First guard
 * @param b — Second guard
 * @returns A guard narrowing to the union of both types
 *
 * @example
 * ```ts
 * const isStringOrNumber = or(isString, isNumber)
 * isStringOrNumber("hello") // true
 * isStringOrNumber(42) // true
 * isStringOrNumber(true) // false
 * ```
 */
export function or<A, B>(
  a: Guard<A>,
  b: Guard<B>,
): Guard<A | B> {
  return (x: unknown): x is A | B => a(x) || b(x);
}
