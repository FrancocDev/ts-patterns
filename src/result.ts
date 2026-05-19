/**
 * Result Type — a discriminated union for representing success or failure.
 *
 * `Result<T, E>` is either `Success<T>` (with `_tag: "success"` and a `value`)
 * or `Failure<E>` (with `_tag: "failure"` and an `error`).
 *
 * All operations are standalone functions — no prototype methods.
 *
 * @example
 * ```ts
 * const r: Result<number, string> = success(42)
 * map(r, x => x * 2)         // success(84)
 * match(r, v => v, e => -1)  // 42
 * ```
 */

// -- Types -----------------------------------------------------------------

export type Success<T> = { readonly _tag: "success"; readonly value: T };
export type Failure<E> = { readonly _tag: "failure"; readonly error: E };

/**
 * A discriminated union representing either a successful value or a failure.
 * - `{ _tag: "success", value: T }` — the operation succeeded
 * - `{ _tag: "failure", error: E }` — the operation failed
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

// -- Constructors ----------------------------------------------------------

/** Create a `Success<T>` result. */
export function success<T>(value: T): Result<T, never> {
  return { _tag: "success", value };
}

/** Create a `Failure<E>` result. */
export function failure<E>(error: E): Result<never, E> {
  return { _tag: "failure", error };
}

// -- Operations ------------------------------------------------------------

/**
 * Transform the value inside a `Success` result.
 * Leaves `Failure` results untouched.
 *
 * @param r — The result to transform
 * @param f — The transformation function
 * @returns A new result with the transformed value, or the same failure
 */
export function map<T, E, U>(
  r: Result<T, E>,
  f: (value: T) => U,
): Result<U, E> {
  if (r._tag === "success") {
    return success(f(r.value));
  }
  return r;
}

/**
 * Transform the error inside a `Failure` result.
 * Leaves `Success` results untouched.
 *
 * @param r — The result to transform
 * @param f — The transformation function for the error
 * @returns A new result with the transformed error, or the same success
 */
export function mapErr<T, E, F>(
  r: Result<T, E>,
  f: (error: E) => F,
): Result<T, F> {
  if (r._tag === "failure") {
    return failure(f(r.error));
  }
  return r;
}

/**
 * Chain a result-returning function on a `Success` result.
 * Short-circuits on the first `Failure`.
 *
 * @param r — The result to chain from
 * @param f — A function that takes the success value and returns a new Result
 * @returns The result of `f` on success, or the same failure
 */
export function andThen<T, E, U>(
  r: Result<T, E>,
  f: (value: T) => Result<U, E>,
): Result<U, E> {
  if (r._tag === "success") {
    return f(r.value);
  }
  return r;
}

/**
 * Unwrap the success value or return a default.
 *
 * @param r — The result to unwrap
 * @param defaultValue — Value to return if this is a failure
 * @returns The success value or the default
 */
export function unwrapOr<T, E>(r: Result<T, E>, defaultValue: T): T {
  if (r._tag === "success") {
    return r.value;
  }
  return defaultValue;
}

/**
 * Match on a result, handling both success and failure branches.
 *
 * Both branches are required — TypeScript enforces exhaustiveness
 * at compile time through the discriminated union.
 *
 * @param r — The result to match on
 * @param onSuccess — Handler for the success case
 * @param onFailure — Handler for the failure case
 * @returns The return value of whichever branch was matched
 */
export function match<T, E, R>(
  r: Result<T, E>,
  onSuccess: (value: T) => R,
  onFailure: (error: E) => R,
): R {
  switch (r._tag) {
    case "success":
      return onSuccess(r.value);
    case "failure":
      return onFailure(r.error);
  }
}
