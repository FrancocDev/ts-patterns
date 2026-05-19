import { describe, it, expect } from "bun:test";
import {
  some,
  none,
  fromNullable,
  isSome,
  isNone,
  map,
  andThen,
  unwrapOr,
  match,
  type Option,
} from "./option.js";

describe("Option Type", () => {
  describe("R10 — Discriminated Union", () => {
    it("creates Some with _tag === 'some'", () => {
      const o = some(42);
      expect(o._tag).toBe("some");
      expect(o.value).toBe(42);
    });

    it("None has _tag === 'none'", () => {
      expect(none._tag).toBe("none");
    });

    it("none is a singleton (referential equality)", () => {
      const o: Option<number> = none;
      expect(o).toBe(none);
    });
  });

  describe("R11 — Type Guards", () => {
    it("isSome narrows type to Some", () => {
      const o: Option<number> = some(42);
      if (isSome(o)) {
        // TypeScript infers o as Some<number>
        expect(o.value).toBe(42);
      } else {
        expect.unreachable("should be Some");
      }
    });

    it("isNone narrows type to None", () => {
      const o: Option<number> = none;
      if (isNone(o)) {
        // TypeScript infers o as None
        expect(o._tag).toBe("none");
      } else {
        expect.unreachable("should be None");
      }
    });

    it("isSome returns false for None", () => {
      expect(isSome(none)).toBe(false);
    });

    it("isNone returns false for Some", () => {
      expect(isNone(some("hello"))).toBe(false);
    });
  });

  describe("R12 — map", () => {
    it("transforms the value on Some", () => {
      const result = map(some(2), (x) => x * 3);
      expect(result).toEqual(some(6));
    });

    it("passes None through untouched", () => {
      const o: Option<number> = none;
      const result = map(o, (x) => x * 3);
      expect(result).toBe(none);
    });
  });

  describe("R12 — andThen", () => {
    it("chains on Some", () => {
      const result = andThen(some(2), (x) => some(x * 3));
      expect(result).toEqual(some(6));
    });

    it("short-circuits on None", () => {
      const result = andThen(none as Option<number>, (x) => some(x * 3));
      expect(result).toBe(none);
    });

    it("chains to None and stops", () => {
      const result = andThen(some(42), () => none);
      expect(result).toBe(none);
    });
  });

  describe("R12 — unwrapOr", () => {
    it("extracts the value on Some", () => {
      expect(unwrapOr(some(42), 0)).toBe(42);
    });

    it("returns the default on None", () => {
      expect(unwrapOr(none as Option<number>, 0)).toBe(0);
    });
  });

  describe("R12 — match", () => {
    it("calls the some branch on Some", () => {
      const result = match(
        some(42),
        (v) => v,
        () => -1,
      );
      expect(result).toBe(42);
    });

    it("calls the none branch on None", () => {
      const result = match(
        none as Option<number>,
        (v) => v,
        () => -1,
      );
      expect(result).toBe(-1);
    });
  });

  describe("R13 — Null Safety", () => {
    it("fromNullable(null) returns None", () => {
      const result = fromNullable(null);

      // Manually check runtime type since fromNullable<null> infers never
      expect(isNone(result as Option<unknown>)).toBe(true);
    });

    it("fromNullable(undefined) returns None", () => {
      const result = fromNullable(undefined);
      expect(isNone(result as Option<unknown>)).toBe(true);
    });

    it("fromNullable(nonNullValue) returns Some", () => {
      const result = fromNullable(42);
      expect(result).toEqual(some(42));
    });

    it("fromNullable works with string values", () => {
      const result = fromNullable("hello");
      expect(result).toEqual(some("hello"));
    });
  });
});
