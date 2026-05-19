import { describe, it, expect } from "bun:test";
import {
  success,
  failure,
  map,
  mapErr,
  andThen,
  unwrapOr,
  match,
  type Result,
} from "./result.js";

describe("Result Type", () => {
  describe("R4 — Discriminated Union", () => {
    it("creates a Success with _tag === 'success'", () => {
      const r = success(42);
      expect(r._tag).toBe("success");
      expect(r.value).toBe(42);
    });

    it("creates a Failure with _tag === 'failure'", () => {
      const r = failure("error message");
      expect(r._tag).toBe("failure");
      expect(r.error).toBe("error message");
    });

    it("infers types correctly for success", () => {
      const r: Result<number, string> = success(42);
      expect(r._tag).toBe("success");
    });

    it("infers types correctly for failure", () => {
      const r: Result<number, string> = failure("err");
      expect(r._tag).toBe("failure");
    });
  });

  describe("R5 — map", () => {
    it("transforms the value on Success", () => {
      const r = success(2);
      const result = map(r, (x) => x * 3);
      expect(result).toEqual(success(6));
    });

    it("leaves Failure untouched", () => {
      const r: Result<number, string> = failure("err");
      const result = map(r, (x) => x * 3);
      expect(result).toEqual(failure("err"));
    });

    it("transforms to a different type", () => {
      const r = success(42);
      const result = map(r, (x) => `Number: ${x}`);
      expect(result).toEqual(success("Number: 42"));
    });
  });

  describe("R6 — mapErr", () => {
    it("transforms the error on Failure", () => {
      const r: Result<number, string> = failure("err");
      const result = mapErr(r, (e) => e.toUpperCase());
      expect(result).toEqual(failure("ERR"));
    });

    it("leaves Success untouched", () => {
      const r = success(2);
      const result = mapErr(r, (e: string) => e.toUpperCase());
      expect(result).toEqual(success(2));
    });
  });

  describe("R7 — andThen", () => {
    it("chains successfully through multiple steps", () => {
      const r = success(2);
      const result = andThen(r, (x) => success(x * 3));
      expect(result).toEqual(success(6));
    });

    it("short-circuits on the first failure", () => {
      const r = success(2);
      const result = andThen(r, () => failure("err"));
      expect(result).toEqual(failure("err"));
    });

    it("short-circuits through multiple steps", () => {
      const r = success(2);
      const step1 = andThen(r, (x) => success(x * 2));
      const step2 = andThen(step1, () => failure("failed"));
      const step3 = andThen(step2, (x: number) => success(x * 3));
      expect(step3).toEqual(failure("failed"));
    });

    it("skips andThen on failure chain", () => {
      const r: Result<number, string> = failure("initial error");
      const result = andThen(r, (x) => success(x * 3));
      expect(result).toEqual(failure("initial error"));
    });
  });

  describe("R8 — unwrapOr", () => {
    it("extracts the value on Success", () => {
      const r = success(42);
      expect(unwrapOr(r, 0)).toBe(42);
    });

    it("returns the default on Failure", () => {
      const r: Result<number, string> = failure("err");
      expect(unwrapOr(r, 0)).toBe(0);
    });
  });

  describe("R9 — match", () => {
    it("calls the success branch on Success", () => {
      const r = success(42);
      const result = match(
        r,
        (v) => v,
        (_e) => -1,
      );
      expect(result).toBe(42);
    });

    it("calls the failure branch on Failure", () => {
      const r: Result<number, string> = failure("err");
      const result = match(
        r,
        (v) => v,
        (_e) => -1,
      );
      expect(result).toBe(-1);
    });

    it("both branches can return the same type", () => {
      const r = success(42);
      const result = match(
        r,
        (v) => `Ok: ${v}`,
        (e) => `Err: ${e}`,
      );
      expect(result).toBe("Ok: 42");
    });
  });
});
