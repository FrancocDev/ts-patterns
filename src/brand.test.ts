import { describe, it, expect } from "bun:test";
import { createBrand } from "./brand.js";

// --- Brand definitions for testing ---
const UserId = createBrand<"UserId">("UserId");
const Email = createBrand<"Email">("Email");
const OrderId = createBrand<"OrderId">("OrderId");

describe("Branded Types", () => {
  describe("R1 — Brand Factory (of)", () => {
    it("creates a branded string value from a valid input", () => {
      const id = UserId.of("abc123");
      // The brand is erased at runtime — the value should be the raw string
      expect(id).toBe("abc123");
      expect(typeof id).toBe("string");
    });

    it("accepts a valid value when a validator is provided", () => {
      const id = UserId.of("abc", (v) => typeof v === "string");
      expect(id).toBe("abc");
    });

    it("throws TypeError when validation fails", () => {
      expect(() => {
        UserId.of(42 as unknown as string, (v) => typeof v === "string");
      }).toThrow(TypeError);
    });

    it("throws TypeError with the brand name in the message", () => {
      expect(() => {
        UserId.of(42 as unknown as string, (v) => typeof v === "string");
      }).toThrow('Value failed validation for brand "UserId"');
    });
  });

  describe("R1 — Brand Factory (from)", () => {
    it("returns a branded value for valid input", () => {
      const result = Email.from("user@example.com");
      expect(result).toBe("user@example.com");
    });

    it("returns undefined when validation fails", () => {
      const result = Email.from("not-an-email", (v) => /@/.test(v));
      expect(result).toBeUndefined();
    });

    it("returns the branded value when validator passes", () => {
      const result = Email.from("valid@test.com", (v) => /@/.test(v));
      expect(result).toBe("valid@test.com");
    });
  });

  describe("R1 — unwrap", () => {
    it("extracts the raw value from a branded value", () => {
      const id = UserId.of("abc");
      const raw = UserId.unwrap(id);
      expect(raw).toBe("abc");
      expect(typeof raw).toBe("string");
    });

    it("works with number brands", () => {
      const id = OrderId.of(1001);
      const raw = OrderId.unwrap(id);
      expect(raw).toBe(1001);
      expect(typeof raw).toBe("number");
    });
  });

  describe("R2 — Brand Isolation", () => {
    it("prevents cross-brand assignment at compile time", () => {
      const userId = UserId.of("abc");
      // @ts-expect-error — Assigning UserId to Email must fail at compile time
      const _email: ReturnType<typeof Email.of<string>> = userId;
      expect(userId).toBe("abc");
    });
  });

  describe("R3 — Number Brand Base", () => {
    it("creates branded numbers", () => {
      const id = OrderId.of(1001);
      // Runtime type is still number
      expect(typeof id).toBe("number");
      expect(id).toBe(1001);
    });

    it("supports arithmetic on number brands via unwrap", () => {
      const id = OrderId.of(42);
      const doubled = OrderId.unwrap(id) * 2;
      expect(doubled).toBe(84);
    });
  });
});
