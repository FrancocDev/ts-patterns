/**
 * Compile-time type assertions for ts-patterns.
 *
 * These tests are verified by `tsc --noEmit` — if the file compiles
 * without errors, the type-level assertions pass.
 */

import type { Branded } from "./brand.js";
import type { Result, Success, Failure } from "./result.js";
import type { Option, Some, None } from "./option.js";
import type { Guard } from "./guards.js";
import { createBrand } from "./brand.js";

// ---------------------------------------------------------------------------
// Branded Types — Compile-time brand isolation
// ---------------------------------------------------------------------------

const _UserId = createBrandForTypeTests<"UserId">("UserId");
const _Email = createBrandForTypeTests<"Email">("Email");

function createBrandForTypeTests<B extends string>(_name: B) {
  return {
    of<T>(v: T, _validator?: (value: T) => boolean): Branded<T, B> {
      return v as Branded<T, B>;
    },
    unwrap<T extends Branded<unknown, B>>(v: T): T extends Branded<infer U, string> ? U : T {
      return v as T extends Branded<infer U, string> ? U : T;
    },
  };
}

// Brand isolation: cross-brand assignment must produce a type error.
const _uid: Branded<string, "UserId"> = _UserId.of("abc");

// @ts-expect-error — Assigning Email to UserId must fail
const _bad: Branded<string, "UserId"> = _Email.of("test@example.com");

// ---------------------------------------------------------------------------
// Result Type — Compile-time discriminant narrowing
// ---------------------------------------------------------------------------

// Narrowing via _tag
const _result: Result<number, string> = null as unknown as Result<number, string>;

if (_result._tag === "success") {
  // _result.value should be number here
  const _v: number = _result.value;
  void _v;
} else {
  // _result.error should be string here
  const _e: string = _result.error;
  void _e;
}

// Type-level: Success<T> and Failure<E> are proper subtypes
const _s: Success<number> = { _tag: "success", value: 42 };
const _f: Failure<string> = { _tag: "failure", error: "err" };
void (_s satisfies Result<number, string>);
void (_f satisfies Result<number, string>);

// ---------------------------------------------------------------------------
// Option Type — Compile-time discriminant narrowing
// ---------------------------------------------------------------------------

const _option: Option<number> = null as unknown as Option<number>;

if (_option._tag === "some") {
  const _v: number = _option.value;
  void _v;
} else {
  const _none: None = _option;
  void _none;
}

// None is assignable to Option<never>
const _noneVal: None = { _tag: "none" };
void (_noneVal satisfies Option<never>);
void (_noneVal satisfies None);

// Some<T> is assignable to Option<T>
const _someVal: Some<string> = { _tag: "some", value: "hello" };
void (_someVal satisfies Option<string>);

// ---------------------------------------------------------------------------
// Builder — Compile-time step tracking
// ---------------------------------------------------------------------------

import { createBuilder } from "./builder.js";

// 2-step chain builds correctly
const _built2 = createBuilder()
  .add("a", 1)
  .add("b", "hello")
  .build();
void (_built2 satisfies { a: number; b: string });

// @ts-expect-error — Duplicate key prevented
createBuilder().add("x", 1).add("x", 2);

// 7-step chain via explicit escape hatch
interface SevenStep {
  s1: string;
  s2: number;
  s3: boolean;
  s4: string;
  s5: number[];
  s6: Record<string, unknown>;
  s7: symbol;
}
const _seven = createBuilder<SevenStep>()
  .add("s1", "a")
  .add("s2", 1)
  .add("s3", true)
  .add("s4", "b")
  .add("s5", [1, 2])
  .add("s6", {})
  .add("s7", Symbol("x"))
  .build();
void (_seven satisfies SevenStep);

// ---------------------------------------------------------------------------
// Guards — Compile-time type narrowing
// ---------------------------------------------------------------------------

import { isString, isNumber, isRecord, isArray, isOptional, isNullable, and, or } from "./guards.js";

// Guard type is a type predicate
const _g: Guard<string> = isString;
void _g;

// isRecord object composition narrows correctly
const _isPerson = isRecord({ name: isString, age: isNumber });
const _person: unknown = { name: "Alice", age: 30 };
if (_isPerson(_person)) {
  const _name: string = _person.name;
  const _age: number = _person.age;
  void _name;
  void _age;
}

// and/or composition narrow correctly
const _strOrNum = or(isString, isNumber);
const _val: unknown = 42;
if (_strOrNum(_val)) {
  const _x: string | number = _val;
  void _x;
}

// Array guard narrows
const _isNumArr = isArray(isNumber);
const _arr: unknown = [1, 2, 3];
if (_isNumArr(_arr)) {
  const _n: number = _arr[0];
  void _n;
}

// Optional / nullable
const _opt = isOptional(isString);
const _nil = isNullable(isNumber);
void _opt;
void _nil;

// ---------------------------------------------------------------------------
// Match — Compile-time chaining
// ---------------------------------------------------------------------------

import { match, Matcher } from "./match.js";
import { isLiteral } from "./guards.js";

// match() returns a Matcher
const _m: Matcher<string> = match("hello");
void _m;

// Basic case + otherwise narrows correctly
const _result1 = match("hello" as string | number)
  .case(isString, (s) => s.length)
  .otherwise((v) => 0);
void (_result1 satisfies number);

// @ts-expect-error — exhaust requires all cases covered (T must be never)
match(42 as number).exhaust(() => 0);

// ---------------------------------------------------------------------------
// Cross-module — Ensure type-level utilities compose
// ---------------------------------------------------------------------------

// Branded + Guards
const _uid2 = createBrand<"UserId">("UserId");
const _check = (x: unknown): x is Branded<string, "UserId"> =>
  isString(x) && _uid2.of(x as string) !== undefined;
void _check;

// ---------------------------------------------------------------------------
// Suppress unused variable warnings
// ---------------------------------------------------------------------------
void (_uid);
void (_result);
void (_option);
void (_built2);
void (_seven);
void (_person);
void (_val);
void (_arr);
void (_m);
void (_uid2);
void (_check);
void (_bad);
void (_result1);
