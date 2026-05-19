/**
 * Type-Safe Builder — step-by-step construction with compile-time
 * type tracking via intersection type accumulation.
 *
 * Each `.add()` call changes the return type, preventing duplicate
 * keys at compile time. Use `createBuilder<T>()` as an escape hatch
 * for inference-heavy chains.
 *
 * @example
 * ```ts
 * const query = createBuilder()
 *   .add("where", { id: 1 })
 *   .add("select", ["id", "name"])
 *   .build()
 * // query: { where: { id: number }; select: string[] }
 * ```
 */

// -- Builder ---------------------------------------------------------------

/**
 * A step-by-step builder that tracks added keys at the type level.
 *
 * `T` accumulates the record of added properties.
 * `K` is the union of all added keys — used to prevent duplicates.
 */
export class Builder<T extends Record<string, unknown> = {}, K extends keyof T = never> {
  private readonly _state: Record<string, unknown> = {};

  /**
   * Add a key-value pair to the builder.
   *
   * Calling this with a key that has already been added produces
   * a compile-time error because the key parameter is narrowed to `never`
   * (the conditional `P extends K ? never : P`).
   *
   * @param key — The property key (must not have been added yet)
   * @param value — The property value
   * @returns A new builder with the key accumulated in its type
   */
  add<P extends string, V>(
    key: P extends K ? never : P,
    value: V,
  ): P extends K ? never : Builder<T & Record<P, V>, K | P> {
    (this._state as Record<string, unknown>)[key as string] = value;
    return this as unknown as any;
  }

  /**
   * Build the final object.
   *
   * @returns The accumulated object with all added keys
   */
  build(): { [P in K]: T[P] } {
    return this._state as unknown as { [P in K]: T[P] };
  }
}

// -- Factory --------------------------------------------------------------

/**
 * Create a builder with type inference from `.add()` calls.
 *
 * @example
 * ```ts
 * const result = createBuilder()
 *   .add("name", "Alice")
 *   .add("age", 30)
 *   .build()
 * // result: { name: string; age: number }
 * ```
 */
export function createBuilder(): Builder<{}, never>;

/**
 * Create a builder with an explicit final type as an escape hatch.
 *
 * Useful for chains with 5+ steps where type inference may struggle.
 * The type parameter documents the expected shape of the built object.
 *
 * @example
 * ```ts
 * interface Query {
 *   where: Record<string, unknown>;
 *   select: string[];
 *   orderBy: string;
 *   limit: number;
 *   offset: number;
 * }
 *
 * const query = createBuilder<Query>()
 *   .add("where", { active: true })
 *   .add("select", ["id", "name"])
 *   .add("orderBy", "created_at")
 *   .add("limit", 10)
 *   .add("offset", 0)
 *   .build()
 * // query: { where: ...; select: ...; orderBy: ...; limit: ...; offset: ... }
 * ```
 */
export function createBuilder<T>(): Builder<{}, never>;

export function createBuilder<T>(): Builder<{}, never> {
  return new Builder();
}
