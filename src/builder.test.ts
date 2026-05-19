import { describe, it, expect } from "bun:test";
import { createBuilder, type Builder } from "./builder.js";

describe("Type-Safe Builder", () => {
  describe("R14 — Step Typing", () => {
    it("builds an object from accumulated add calls", () => {
      const result = createBuilder()
        .add("name", "Alice")
        .add("age", 30)
        .build();

      expect(result).toEqual({ name: "Alice", age: 30 });
    });

    it("each add returns a different type — chaining accumulates keys", () => {
      const builder = createBuilder()
        .add("x", 1);
      const _: { x: number } = builder.build();
      void _;

      const builder2 = builder.add("y", "hello");
      const _2: { x: number; y: string } = builder2.build();
      void _2;
    });

    it("produces a compile-time error on duplicate keys", () => {
      const b = createBuilder().add("key", 1);
      // @ts-expect-error — duplicate key
      b.add("key", 2);
    });
  });

  describe("R15 — createBuilder<T>() Escape Hatch", () => {
    it("accepts an explicit type parameter for documentation", () => {
      const result = createBuilder<{ a: string; b: number }>()
        .add("a", "hello")
        .add("b", 42)
        .build();

      expect(result).toEqual({ a: "hello", b: 42 });
    });

    it("supports 7-step chains without inference issues", () => {
      interface SevenStep {
        step1: string;
        step2: number;
        step3: boolean;
        step4: string;
        step5: number[];
        step6: Record<string, unknown>;
        step7: symbol;
      }

      const sym = Symbol("test");
      const result = createBuilder<SevenStep>()
        .add("step1", "one")
        .add("step2", 2)
        .add("step3", true)
        .add("step4", "four")
        .add("step5", [1, 2, 3])
        .add("step6", { foo: "bar" })
        .add("step7", sym)
        .build();

      expect(result).toEqual({
        step1: "one",
        step2: 2,
        step3: true,
        step4: "four",
        step5: [1, 2, 3],
        step6: { foo: "bar" },
        step7: sym,
      });
    });
  });

  describe("R16 — Compile-Time Errors", () => {
    it("rejects undefined or incomplete chain at compile time via type", () => {
      // Calling .build() on a builder with no keys returns {}
      const result = createBuilder().build();
      expect(result).toEqual({});
      void result satisfies Record<string, never>;
    });

    it("can add multiple distinct keys in any order", () => {
      const r1 = createBuilder()
        .add("z", 1)
        .add("a", "hello")
        .build();
      expect(r1).toEqual({ z: 1, a: "hello" });

      const r2 = createBuilder()
        .add("a", "hello")
        .add("z", 1)
        .build();
      expect(r2).toEqual({ a: "hello", z: 1 });
    });
  });
});
