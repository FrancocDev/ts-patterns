/**
 * Pattern Matching — exhaustive discriminated union matching with
 * a chainable API.
 *
 * `match(value)` returns a `Matcher` on which you call `.case()` for each
 * variant and then `.exhaust()` (enforces all cases covered) or
 * `.otherwise()` (provides a fallback).
 *
 * @example
 * ```ts
 * type Shape =
 *   | { _tag: "circle"; radius: number }
 *   | { _tag: "square"; side: number }
 *
 * const area = match(shape)
 *   .case(isCircle, c => Math.PI * c.radius ** 2)
 *   .case(isSquare, s => s.side ** 2)
 *   .exhaust()
 * ```
 */

import type { Guard } from "./guards.js";

// -- Matcher ---------------------------------------------------------------

/**
 * Chainable matcher that accumulates case handlers and narrows
 * the remaining union type.
 *
 * Generic parameters:
 * - `T` — the remaining (unmatched) union type
 */
export class Matcher<T> {
  private readonly _value: T;
  private _matched: boolean = false;
  private _result: unknown;

  constructor(value: T) {
    this._value = value;
  }

  /**
   * Match against a type guard and run a handler if it matches.
   *
   * Each `.case()` call narrows the remaining union by excluding
   * the matched type `U` from `T`.
   *
   * @param guard — A type guard predicate
   * @param handler — Function to run if the guard matches
   * @returns This matcher (with `U` excluded from the remaining union type)
   */
  case<U extends T, R>(
    guard: Guard<U>,
    handler: (value: U) => R,
  ): Matcher<Exclude<T, U>>;

  /**
   * Match against a literal value and run a handler if it matches.
   *
   * The literal is compared with `===`.
   *
   * @param literal — The literal value to match against
   * @param handler — Function to run if the value matches
   * @returns This matcher (with `U` excluded from the remaining union type)
   */
  case<U extends T, R>(
    literal: U,
    handler: (value: U) => R,
  ): Matcher<Exclude<T, U>>;

  case<U extends T, R>(
    pattern: Guard<U> | U,
    handler: (value: U) => R,
  ): Matcher<Exclude<T, U>> {
    if (!this._matched) {
      let guard: Guard<U>;

      if (typeof pattern === "function") {
        guard = pattern as Guard<U>;
      } else {
        const literal = pattern;
        guard = ((x: unknown): x is U => x === literal) as Guard<U>;
      }

      if (guard(this._value)) {
        this._matched = true;
        this._result = handler(this._value as U);
      }
    }

    return this as unknown as Matcher<Exclude<T, U>>;
  }

  /**
   * Handle all remaining (unmatched) cases.
   *
   * If all variants of a discriminated union have been covered by
   * preceding `.case()` calls, T is `never` and calling `.exhaust()`
   * confirms the match is complete.
   *
   * @param handler — Handler for the remaining (or `never`) cases
   * @returns The matched value or the fallback result
   */
  exhaust<R>(this: Matcher<never>, handler: (value: never) => R): R {
    if (this._matched) {
      return this._result as R;
    }
    return handler(this._value as never);
  }

  /**
   * Provide a fallback handler for any unmatched cases.
   *
   * This is the escape hatch for partial matching — unlike `.exhaust()`,
   * it does NOT enforce that all cases are covered.
   *
   * @param handler — Fallback handler for unmatched values
   * @returns The matched value or the fallback result
   */
  otherwise<R>(handler: (value: T) => R): R {
    if (this._matched) {
      return this._result as R;
    }
    return handler(this._value);
  }
}

// -- Factory ---------------------------------------------------------------

/**
 * Start a pattern match on the given value.
 *
 * Use `.case()` to handle each variant, then `.exhaust()` or `.otherwise()`
 * to finalize.
 *
 * @param value — The value to match against
 * @returns A `Matcher` for chaining `.case()`, `.exhaust()`, `.otherwise()`
 *
 * @example
 * ```ts
 * const result = match(value)
 *   .case(isString, s => s.length)
 *   .case(isNumber, n => n)
 *   .otherwise(() => 0)
 * ```
 */
export function match<T>(value: T): Matcher<T> {
  return new Matcher(value);
}
