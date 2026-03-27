// Indentation tests for Ruby CodeMirror language support
// Tests the rubyIndentService against the indent spec (ruby-indent-cases.md)

import {ruby} from "../dist/index.js"
import {EditorState} from "@codemirror/state"
import {getIndentation} from "@codemirror/language"
import assert from "assert"

// Helper: create an EditorState with the ruby() extension and get indent at a line
function getIndentAt(code, lineNumber) {
  const state = EditorState.create({
    doc: code,
    extensions: [ruby()],
  })
  const line = state.doc.line(lineNumber)
  return getIndentation(state, line.from)
}

// Helper: test that a line should have a specific indent level (in spaces)
function expectIndent(code, lineNumber, expectedSpaces, description) {
  const actual = getIndentAt(code, lineNumber)
  if (actual !== expectedSpaces) {
    console.log(`  FAIL: ${description}`)
    console.log(`    Line ${lineNumber}: expected ${expectedSpaces} spaces, got ${actual}`)
    return false
  }
  return true
}

let passed = 0
let failed = 0
let errors = []

function test(description, fn) {
  try {
    const result = fn()
    if (result !== false) {
      passed++
    } else {
      failed++
      errors.push(description)
    }
  } catch (e) {
    failed++
    errors.push(`${description}: ${e.message}`)
  }
}

// ============================================================
// Section 1: Keyword Block Openers → Indent Next Line
// ============================================================

console.log("\n1. Keyword Block Openers")

test("1.1a def → indent body", () => {
  const code = `def foo\n  body\nend`
  return expectIndent(code, 2, 2, "body after def") &&
         expectIndent(code, 3, 0, "end matches def")
})

test("1.1b def with args", () => {
  const code = `def foo(x, y)\n  body\nend`
  return expectIndent(code, 2, 2, "body after def(args)")
})

test("1.1e self.method", () => {
  const code = `def self.foo\n  body\nend`
  return expectIndent(code, 2, 2, "body after def self.foo")
})

test("1.2a class", () => {
  const code = `class Foo\n  body\nend`
  return expectIndent(code, 2, 2, "body after class") &&
         expectIndent(code, 3, 0, "end matches class")
})

test("1.2b class with inheritance", () => {
  const code = `class Foo < Bar\n  body\nend`
  return expectIndent(code, 2, 2, "body after class < Bar")
})

test("1.2d module", () => {
  const code = `module Foo\n  body\nend`
  return expectIndent(code, 2, 2, "body after module")
})

test("1.3a if", () => {
  const code = `if condition\n  body\nend`
  return expectIndent(code, 2, 2, "body after if") &&
         expectIndent(code, 3, 0, "end matches if")
})

test("1.3b unless", () => {
  const code = `unless condition\n  body\nend`
  return expectIndent(code, 2, 2, "body after unless")
})

test("1.4a while", () => {
  const code = `while running\n  step\nend`
  return expectIndent(code, 2, 2, "body after while")
})

test("1.4b until", () => {
  const code = `until done\n  work\nend`
  return expectIndent(code, 2, 2, "body after until")
})

test("1.4c for", () => {
  const code = `for i in items\n  puts(i)\nend`
  return expectIndent(code, 2, 2, "body after for")
})

test("1.5a case/when", () => {
  const code = `case x\nwhen 1\n  body\nend`
  return expectIndent(code, 2, 0, "when aligns with case") &&
         expectIndent(code, 3, 2, "body after when")
})

test("1.6a begin", () => {
  const code = `begin\n  body\nend`
  return expectIndent(code, 2, 2, "body after begin")
})

test("1.7a do block", () => {
  const code = `items.each do |x|\n  puts(x)\nend`
  return expectIndent(code, 2, 2, "body after do")
})

test("1.8a brace block multi-line", () => {
  const code = `items.each {\n  x\n}`
  return expectIndent(code, 2, 2, "body in {") &&
         expectIndent(code, 3, 0, "} matches {")
})

test("1.9a hash literal", () => {
  const code = `h = {\n  a: 1,\n  b: 2,\n}`
  return expectIndent(code, 2, 2, "body in hash {") &&
         expectIndent(code, 4, 0, "} matches opening")
})

test("1.9b array literal", () => {
  const code = `a = [\n  1,\n  2,\n]`
  return expectIndent(code, 2, 2, "body in [") &&
         expectIndent(code, 4, 0, "] matches [")
})

test("1.9c method call parens", () => {
  const code = `foo(\n  1,\n  2\n)`
  return expectIndent(code, 2, 2, "body in (") &&
         expectIndent(code, 4, 0, ") matches (")
})

// ============================================================
// Section 2: Mid-Block Keywords → Deindent Current, Indent Next
// ============================================================

console.log("\n2. Mid-Block Keywords")

test("2.1a else in if", () => {
  const code = `if condition\n  a\nelse\n  b\nend`
  return expectIndent(code, 3, 0, "else aligns with if") &&
         expectIndent(code, 4, 2, "body after else")
})

test("2.2a elsif", () => {
  const code = `if a\n  x\nelsif b\n  y\nelse\n  z\nend`
  return expectIndent(code, 3, 0, "elsif aligns with if") &&
         expectIndent(code, 4, 2, "body after elsif") &&
         expectIndent(code, 5, 0, "else aligns with if")
})

test("2.3a when", () => {
  const code = `case x\nwhen 1\n  a\nwhen 2\n  b\nend`
  return expectIndent(code, 2, 0, "when aligns with case") &&
         expectIndent(code, 3, 2, "body after when") &&
         expectIndent(code, 4, 0, "second when aligns with case")
})

test("2.4a rescue in begin", () => {
  const code = `begin\n  risky\nrescue => e\n  fallback\nend`
  return expectIndent(code, 3, 0, "rescue aligns with begin") &&
         expectIndent(code, 4, 2, "body after rescue")
})

test("2.4b rescue in def", () => {
  const code = `def foo\n  risky\nrescue => e\n  fallback\nend`
  return expectIndent(code, 3, 0, "rescue aligns with def") &&
         expectIndent(code, 4, 2, "body after rescue")
})

test("2.5a ensure", () => {
  const code = `begin\n  risky\nrescue\n  handle\nensure\n  cleanup\nend`
  return expectIndent(code, 5, 0, "ensure aligns with begin") &&
         expectIndent(code, 6, 2, "body after ensure")
})

// ============================================================
// Section 3: end → Deindent to Matching Opener
// ============================================================

console.log("\n3. End Matching")

test("3a nested def in class", () => {
  const code = `class Foo\n  def bar\n    body\n  end\nend`
  return expectIndent(code, 2, 2, "def indented in class") &&
         expectIndent(code, 3, 4, "body indented in def") &&
         expectIndent(code, 4, 2, "end matches def") &&
         expectIndent(code, 5, 0, "end matches class")
})

test("3b nested if in def", () => {
  const code = `def foo\n  if condition\n    body\n  end\nend`
  return expectIndent(code, 3, 4, "body in nested if") &&
         expectIndent(code, 4, 2, "end matches if") &&
         expectIndent(code, 5, 0, "end matches def")
})

test("3c deeply nested", () => {
  const code = `class Foo\n  def bar\n    if condition\n      while running\n        body\n      end\n    end\n  end\nend`
  return expectIndent(code, 5, 8, "deep body") &&
         expectIndent(code, 6, 6, "end matches while") &&
         expectIndent(code, 7, 4, "end matches if") &&
         expectIndent(code, 8, 2, "end matches def") &&
         expectIndent(code, 9, 0, "end matches class")
})

test("3d multiple methods in class", () => {
  const code = `class Foo\n  def a\n    1\n  end\n\n  def b\n    2\n  end\nend`
  return expectIndent(code, 4, 2, "end matches first def") &&
         expectIndent(code, 6, 2, "second def indented in class") &&
         expectIndent(code, 8, 2, "end matches second def") &&
         expectIndent(code, 9, 0, "end matches class")
})

// ============================================================
// Section 4: Closing Delimiters
// ============================================================

console.log("\n4. Closing Delimiters")

test("4a closing }", () => {
  const code = `h = {\n  a: 1\n}`
  return expectIndent(code, 3, 0, "} matches {")
})

test("4b closing ]", () => {
  const code = `a = [\n  1\n]`
  return expectIndent(code, 3, 0, "] matches [")
})

test("4c closing )", () => {
  const code = `foo(\n  1\n)`
  return expectIndent(code, 3, 0, ") matches (")
})

test("4d nested delimiters", () => {
  const code = `foo(\n  [\n    1\n  ]\n)`
  return expectIndent(code, 2, 2, "[ indented in (") &&
         expectIndent(code, 3, 4, "body indented in [") &&
         expectIndent(code, 4, 2, "] matches [") &&
         expectIndent(code, 5, 0, ") matches (")
})

// ============================================================
// Continuation & Chaining
// ============================================================

console.log("\n5. Continuation & Chaining")

test("5a trailing operator continuation", () => {
  const code = `x = 1 +\n  2`
  return expectIndent(code, 2, 2, "continuation after trailing +")
})

test("5b method chaining with leading dot", () => {
  const code = `foo\n  .bar\n  .baz`
  return expectIndent(code, 3, 2, "chain maintains indent")
})

// ============================================================
// Single-line forms should NOT indent
// ============================================================

console.log("\n6. Single-line forms")

test("6a single-line if (semicolon)", () => {
  const code = `if x; y; end\nnext_line`
  return expectIndent(code, 2, 0, "no indent after single-line if")
})

test("6b endless method", () => {
  const code = `def square(x) = x * x\nnext_line`
  return expectIndent(code, 2, 0, "no indent after endless method")
})

// ============================================================
// Section 7: Modifier Forms → NO Indent Change
// ============================================================

console.log("\n7. Modifier Forms")

test("7a modifier if", () => {
  return expectIndent("return x if condition\nnext_statement", 2, 0, "no indent after modifier if")
})

test("7b modifier unless", () => {
  return expectIndent("do_something unless condition\nnext_statement", 2, 0, "no indent after modifier unless")
})

test("7c modifier while", () => {
  return expectIndent("sleep 1 while condition\nnext_statement", 2, 0, "no indent after modifier while")
})

test("7d modifier until", () => {
  return expectIndent("retry until condition\nnext_statement", 2, 0, "no indent after modifier until")
})

test("7f ternary", () => {
  return expectIndent("x = condition ? a : b\nnext_statement", 2, 0, "no indent after ternary")
})

// ============================================================
// Section 8: One-Line Bodies → NO Indent Change
// ============================================================

console.log("\n8. One-Line Bodies")

test("8b single-line class", () => {
  return expectIndent("class Foo; end\nnext_statement", 2, 0, "no indent after single-line class")
})

test("8c single-line def", () => {
  return expectIndent("def foo; body; end\nnext_statement", 2, 0, "no indent after single-line def")
})

test("8d single-line brace block", () => {
  return expectIndent("items.each { |x| x + 1 }\nnext_statement", 2, 0, "no indent after single-line block")
})

test("8g single-line array", () => {
  return expectIndent("x = [1, 2, 3]\nnext_statement", 2, 0, "no indent after single-line array")
})

test("8h single-line hash", () => {
  return expectIndent("x = { a: 1 }\nnext_statement", 2, 0, "no indent after single-line hash")
})

// ============================================================
// Section 11: Multi-line Expressions / Continuation
// ============================================================

console.log("\n11. Continuation")

test("11.1a method chaining (trailing dot)", () => {
  // When dot is on the continuation line, indent isn't auto-detected
  // but when the chain is already indented, the next line follows
  const code = `result = items.\n  select { |x| x > 0 }.\n  map { |x| x * 2 }`
  return expectIndent(code, 2, 2, "continuation after trailing dot")
})

// ============================================================
// Section 12: Lambda / Proc
// ============================================================

console.log("\n12. Lambda")

test("12a lambda brace block indent", () => {
  const code = `fn = -> (x) {\n  x + 1\n}`
  return expectIndent(code, 2, 2, "indent inside lambda brace block")
})

test("12b lambda do block indent", () => {
  const code = `fn = -> (x) do\n  x + 1\nend`
  return expectIndent(code, 2, 2, "indent inside lambda do block")
})

// ============================================================
// Section 29: Real-World Patterns
// ============================================================

console.log("\n29. Real-World Patterns")

test("29a Rails controller indent", () => {
  const code = `class UsersController\n  def index\n    @users = User.all\n  end\nend`
  return expectIndent(code, 2, 2, "def inside class") &&
         expectIndent(code, 3, 4, "body inside def inside class") &&
         expectIndent(code, 4, 2, "end matches def") &&
         expectIndent(code, 5, 0, "end matches class")
})

test("29c method with rescue/ensure indent", () => {
  const code = `def fetch\n  data = get_data\nrescue => e\n  handle(e)\nensure\n  cleanup\nend`
  return expectIndent(code, 2, 2, "body indented") &&
         expectIndent(code, 3, 0, "rescue deindents") &&
         expectIndent(code, 4, 2, "rescue body indented") &&
         expectIndent(code, 5, 0, "ensure deindents") &&
         expectIndent(code, 6, 2, "ensure body indented") &&
         expectIndent(code, 7, 0, "end matches def")
})

// ============================================================
// Summary
// ============================================================

console.log(`\n--- SUMMARY ---`)
console.log(`PASS: ${passed}`)
console.log(`FAIL: ${failed}`)
if (errors.length) {
  console.log(`\nFailures:`)
  errors.forEach(e => console.log(`  - ${e}`))
}
process.exit(failed > 0 ? 1 : 0)
