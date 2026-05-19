import { describe, it, expect } from "bun:test";
import { match } from "./match.js";
import { isString, isNumber, isBoolean, isLiteral } from "./guards.js";

describe("Pattern Matching", () => {
  describe("R19 — Exhaustive Match", () => {
    it("handles all cases of a discriminated union with exhaust", () => {
      type Shape =
        | { _tag: "circle"; radius: number }
        | { _tag: "square"; side: number };

      const circle: Shape = { _tag: "circle", radius: 5 };

      const isCircle = (x: unknown): x is Shape & { _tag: "circle" } =>
        typeof x === "object" && x !== null && (x as Shape)._tag === "circle";
      const isSquare = (x: unknown): x is Shape & { _tag: "square" } =>
        typeof x === "object" && x !== null && (x as Shape)._tag === "square";

      const area = match(circle)
        .case(isCircle, (c) => Math.PI * c.radius ** 2)
        .case(isSquare, (s) => s.side ** 2)
        .exhaust(() => 0);

      expect(area).toBeCloseTo(Math.PI * 25);
    });

    it("returns from otherwise when a case doesn't match", () => {
      const result = match("hello" as string | number)
        .case(isNumber, (n) => `number: ${n}`)
        .otherwise((v) => `other: ${v}`);

      expect(result).toBe("other: hello");
    });
  });

  describe("R20 — Discriminator Support", () => {
    it("matches literal unions with otherwise fallback", () => {
      type Status = "active" | "inactive" | "pending";

      const status: Status = "active";

      const result = match(status)
        .case(isLiteral("active"), () => "is active")
        .otherwise(() => "not active");

      expect(result).toBe("is active");
    });

    it("matches each variant of a literal union", () => {
      type Status = "active" | "inactive" | "pending";

      const active: Status = "active";
      const inactive: Status = "inactive";
      const pending: Status = "pending";

      const handle = (s: Status): string =>
        match(s)
          .case(isLiteral("active"), () => "activated")
          .case(isLiteral("inactive"), () => "deactivated")
          .case(isLiteral("pending"), () => "waiting")
          .exhaust(() => "unknown");

      expect(handle(active)).toBe("activated");
      expect(handle(inactive)).toBe("deactivated");
      expect(handle(pending)).toBe("waiting");
    });

    it("matches discriminated objects with multiple fields", () => {
      type Event =
        | { type: "click"; x: number; y: number }
        | { type: "keypress"; key: string }
        | { type: "focus" };

      const isClick = (x: unknown): x is Event & { type: "click" } =>
        typeof x === "object" && x !== null && (x as Event).type === "click";
      const isKeypress = (x: unknown): x is Event & { type: "keypress" } =>
        typeof x === "object" && x !== null && (x as Event).type === "keypress";
      const isFocus = (x: unknown): x is Event & { type: "focus" } =>
        typeof x === "object" && x !== null && (x as Event).type === "focus";

      const click: Event = { type: "click", x: 100, y: 200 };

      const result = match(click)
        .case(isClick, (e) => `click at (${e.x}, ${e.y})`)
        .case(isKeypress, (e) => `key: ${e.key}`)
        .case(isFocus, () => "focused")
        .exhaust(() => "unknown");

      expect(result).toBe("click at (100, 200)");
    });

    it("returns correct type narrowing in handlers", () => {
      type Animal =
        | { kind: "dog"; bark: string }
        | { kind: "cat"; meow: string };

      const isDog = (x: unknown): x is Animal & { kind: "dog" } =>
        typeof x === "object" && x !== null && (x as Animal).kind === "dog";
      const isCat = (x: unknown): x is Animal & { kind: "cat" } =>
        typeof x === "object" && x !== null && (x as Animal).kind === "cat";

      // Dog should bark
      const dog: Animal = { kind: "dog", bark: "woof" };
      const sound = match(dog)
        .case(isDog, (d) => d.bark)
        .case(isCat, (c) => c.meow)
        .exhaust(() => "silence");

      expect(sound).toBe("woof");
    });
  });
});
