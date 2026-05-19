import { describe, it, expect } from "bun:test";
import {
  isString,
  isNumber,
  isBoolean,
  isBigint,
  isSymbol,
  isUndefined,
  isNull,
  isLiteral,
  isArray,
  isRecord,
  isOptional,
  isNullable,
  and,
  or,
} from "./guards.js";

describe("Guard Functions", () => {
  describe("R17 — Primitive Guards", () => {
    it("isString narrows strings", () => {
      expect(isString("hello")).toBe(true);
      expect(isString(42)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
    });

    it("isNumber narrows numbers (excluding NaN)", () => {
      expect(isNumber(42)).toBe(true);
      expect(isNumber(0)).toBe(true);
      expect(isNumber(-3.14)).toBe(true);
      expect(isNumber(NaN)).toBe(false);
      expect(isNumber("42")).toBe(false);
    });

    it("isBoolean narrows booleans", () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
      expect(isBoolean(0)).toBe(false);
      expect(isBoolean("true")).toBe(false);
    });

    it("isBigint narrows bigints", () => {
      expect(isBigint(42n)).toBe(true);
      expect(isBigint(0n)).toBe(true);
      expect(isBigint(42)).toBe(false);
    });

    it("isSymbol narrows symbols", () => {
      expect(isSymbol(Symbol("test"))).toBe(true);
      expect(isSymbol(Symbol.for("key"))).toBe(true);
      expect(isSymbol("symbol")).toBe(false);
    });

    it("isUndefined narrows undefined", () => {
      expect(isUndefined(undefined)).toBe(true);
      expect(isUndefined(null)).toBe(false);
      expect(isUndefined(0)).toBe(false);
    });

    it("isNull narrows null", () => {
      expect(isNull(null)).toBe(true);
      expect(isNull(undefined)).toBe(false);
      expect(isNull(0)).toBe(false);
    });

    it("all primitives reject objects", () => {
      expect(isString({})).toBe(false);
      expect(isNumber([])).toBe(false);
      expect(isBoolean(new Boolean(true))).toBe(false);
    });
  });

  describe("R18 — Composition Guards", () => {
    describe("isLiteral", () => {
      it("matches exact literal values", () => {
        const isActive = isLiteral("active");
        expect(isActive("active")).toBe(true);
        expect(isActive("inactive")).toBe(false);
        expect(isActive(null)).toBe(false);
      });

      it("works with number literals", () => {
        const isFortyTwo = isLiteral(42);
        expect(isFortyTwo(42)).toBe(true);
        expect(isFortyTwo(43)).toBe(false);
      });

      it("works with boolean literals", () => {
        const isTrue = isLiteral(true);
        expect(isTrue(true)).toBe(true);
        expect(isTrue(false)).toBe(false);
      });
    });

    describe("isArray", () => {
      it("matches arrays of the inner type", () => {
        const isNumArr = isArray(isNumber);
        expect(isNumArr([1, 2, 3])).toBe(true);
        expect(isNumArr([])).toBe(true);
        expect(isNumArr(["a"])).toBe(false);
        expect(isNumArr("not array")).toBe(false);
      });

      it("works with nested arrays", () => {
        const isNested = isArray(isArray(isNumber));
        expect(isNested([[1, 2], [3]])).toBe(true);
        expect(isNested([[1, "a"]])).toBe(false);
      });
    });

    describe("isRecord", () => {
      it("matches objects matching the shape", () => {
        const isPerson = isRecord({ name: isString, age: isNumber });

        expect(isPerson({ name: "Alice", age: 30 })).toBe(true);
        expect(isPerson({ name: "Bob", age: 25, extra: true })).toBe(true);
        expect(isPerson({ name: "Alice" })).toBe(false);
        expect(isPerson({ name: "Alice", age: "30" })).toBe(false);
        expect(isPerson(null)).toBe(false);
      });

      it("rejects non-objects", () => {
        const isObj = isRecord({});
        expect(isObj({})).toBe(true);
        expect(isObj("string")).toBe(false);
        expect(isObj(null)).toBe(false);
        expect(isObj(undefined)).toBe(false);
      });

      it("rejects objects where a key fails its guard", () => {
        const isStrict = isRecord({ val: isNumber });
        expect(isStrict({ val: 42 })).toBe(true);
        expect(isStrict({ val: "42" })).toBe(false);
      });
    });

    describe("isOptional", () => {
      it("accepts undefined or the inner type", () => {
        const optStr = isOptional(isString);
        expect(optStr("hello")).toBe(true);
        expect(optStr(undefined)).toBe(true);
        expect(optStr(42)).toBe(false);
        expect(optStr(null)).toBe(false);
      });
    });

    describe("isNullable", () => {
      it("accepts null or the inner type", () => {
        const nullableStr = isNullable(isString);
        expect(nullableStr("hello")).toBe(true);
        expect(nullableStr(null)).toBe(true);
        expect(nullableStr(42)).toBe(false);
        expect(nullableStr(undefined)).toBe(false);
      });
    });

    describe("and", () => {
      it("passes when both guards pass", () => {
        const isMyString = and(isString, isLiteral("hello"));
        expect(isMyString("hello")).toBe(true);
        expect(isMyString("world")).toBe(false);
        expect(isMyString(42)).toBe(false);
      });
    });

    describe("or", () => {
      it("passes when either guard passes", () => {
        const strOrNum = or(isString, isNumber);
        expect(strOrNum("hello")).toBe(true);
        expect(strOrNum(42)).toBe(true);
        expect(strOrNum(true)).toBe(false);
      });
    });
  });
});
