/**
 * Branded Types — nominal typing via intersection types.
 *
 * Branded types provide nominal-type semantics at compile time with
 * zero runtime overhead (the brand is erased after compilation).
 *
 * @example
 * ```ts
 * const UserId = createBrand<"UserId">("UserId")
 * const id = UserId.of("abc")
 * // id: Branded<string, "UserId">
 * // typeof unwrap(id) === "string"
 * ```
 */

/** A branded (nominally-typed) value. */
export type Branded<T, B extends string> = T & { readonly __brand: B };

/** Helper to extract the raw value from a branded type. */
type BrandBase<T> = T extends Branded<infer U, string> ? U : T;

/**
 * Create a brand factory for the given brand name.
 *
 * Returns an object with `of`, `from`, and `unwrap` methods for
 * constructing and deconstructing branded values.
 *
 * @param name — The unique brand name (used for TypeScript's structural type system)
 * @returns A brand factory
 *
 * @example
 * ```ts
 * const UserId = createBrand<"UserId">("UserId")
 *
 * // With runtime validation:
 * const Email = createBrand<"Email">("Email")
 * const valid = Email.of("test@example.com", v => /@/.test(v))
 * // Invalid throws TypeError:
 * Email.of("not-email", v => /@/.test(v)) // TypeError
 *
 * // Safe creation (returns undefined on invalid):
 * const maybe = Email.from("bad", v => /@/.test(v)) // undefined
 * ```
 */
export function createBrand<B extends string>(_name: B) {
  return {
    /**
     * Create a branded value from a raw value.
     * Optionally validates the value at runtime.
     *
     * @param v — The raw value to brand
     * @param validator — Optional runtime validation function
     * @returns The branded value
     * @throws TypeError if validation fails
     */
    of<T>(v: T, validator?: (value: T) => boolean): Branded<T, B> {
      if (validator && !validator(v)) {
        throw new TypeError(`Value failed validation for brand "${_name}"`);
      }
      return v as Branded<T, B>;
    },

    /**
     * Safely create a branded value.
     * Returns `undefined` instead of throwing when validation fails.
     *
     * @param v — The raw value to brand
     * @param validator — Optional runtime validation function
     * @returns The branded value, or undefined if validation fails
     */
    from<T>(v: T, validator?: (value: T) => boolean): Branded<T, B> | undefined {
      if (validator && !validator(v)) {
        return undefined;
      }
      return v as Branded<T, B>;
    },

    /**
     * Unwrap a branded value back to its raw type.
     *
     * @param v — The branded value
     * @returns The raw value
     */
    unwrap<T extends Branded<unknown, B>>(v: T): BrandBase<T> {
      return v as BrandBase<T>;
    },
  };
}
