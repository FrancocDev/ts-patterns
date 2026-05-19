/**
 * Option Type — a discriminated union for representing optional values.
 *
 * `Option<T>` is either `Some<T>` (with `_tag: "some"` and a `value`)
 * or `None` (with `_tag: "none"`).
 *
 * Inspired by Rust's `Option<T>` / fp-ts `Option` — all operations are
 * standalone functions.
 *
 * @example
 * ```ts
 * const x = some(42)
 * map(x, v => v * 2)          // some(84)
 * match(x, v => v, () => 0)   // 42
 *
 * const y = fromNullable(null)
 * isNone(y)                    // true
 * unwrapOr(y, 0)              // 0
 * ```
 */

// -- Types -----------------------------------------------------------------

export type Some<T> = { readonly _tag: "some"; readonly value: T };
export type None = { readonly _tag: "none" };

/**
 * A discriminated union representing an optional value.
 * - `{ _tag: "some", value: T }` — a value is present
 * - `{ _tag: "none" }` — no value
 */
export type Option<T> = Some<T> | None;

// -- Constructors ----------------------------------------------------------

/** The singleton `None` value — referentially stable. */
export const none: Option<never> = { _tag: "none" } as const;

/** Wrap a value in `Some`. */
export function some<T>(value: T): Option<T> {
  return { _tag: "some", value };
}

/**
 * Convert a nullable value to an `Option`.
 * Returns `None` for `null` or `undefined`, `Some(value)` otherwise.
 */
export function fromNullable<T>(value: T): Option<NonNullable<T>> {
  if (value === null || value === undefined) {
    return none;
  }
  return some(value as NonNullable<T>);
}

// -- Type Guards -----------------------------------------------------------

/** Type guard that narrows an `Option<T>` to `Some<T>`. */
export function isSome<T>(o: Option<T>): o is Some<T> {
  return o._tag === "some";
}

/** Type guard that narrows an `Option<T>` to `None`. */
export function isNone<T>(o: Option<T>): o is None {
  return o._tag === "none";
}

// -- Operations ------------------------------------------------------------

/**
 * Transform the value inside a `Some` option.
 * Passes `None` through untouched.
 *
 * @param o — The option to transform
 * @param f — The transformation function
 * @returns A new option with the transformed value, or None
 */
export function map<T, U>(o: Option<T>, f: (value: T) => U): Option<U> {
  if (o._tag === "some") {
    return some(f(o.value));
  }
  return none;
}

/**
 * Chain an option-returning function on a `Some` option.
 * Short-circuits on `None`.
 *
 * @param o — The option to chain from
 * @param f — A function that takes the value and returns a new Option
 * @returns The result of `f` on Some, or None
 */
export function andThen<T, U>(
  o: Option<T>,
  f: (value: T) => Option<U>,
): Option<U> {
  if (o._tag === "some") {
    return f(o.value);
  }
  return none;
}

/**
 * Unwrap the value or return a default.
 *
 * @param o — The option to unwrap
 * @param defaultValue — Value to return if None
 * @returns The contained value or the default
 */
export function unwrapOr<T>(o: Option<T>, defaultValue: T): T {
  if (o._tag === "some") {
    return o.value;
  }
  return defaultValue;
}

/**
 * Match on an option, handling both Some and None branches.
 *
 * Both branches are required — TypeScript enforces exhaustiveness
 * through the discriminated union.
 *
 * @param o — The option to match on
 * @param onSome — Handler for the Some case
 * @param onNone — Handler for the None case
 * @returns The return value of whichever branch was matched
 */
export function match<T, R>(
  o: Option<T>,
  onSome: (value: T) => R,
  onNone: () => R,
): R {
  switch (o._tag) {
    case "some":
      return onSome(o.value);
    case "none":
      return onNone();
  }
}
