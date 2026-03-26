// Comprehensive Ruby indentation tests
// Run with: node test/indent-test.mjs

import {EditorState} from "@codemirror/state"
import {getIndentation} from "@codemirror/language"
import {ruby} from "../dist/index.js"

let pass = 0, fail = 0, skip = 0

function test(name, code, lineNum, expected) {
  const state = EditorState.create({doc: code, extensions: [ruby()]})
  const line = state.doc.line(lineNum)
  const actual = getIndentation(state, line.from)
  if (actual !== expected) {
    console.log(`FAIL: ${name}`)
    console.log(`  line ${lineNum}: ${JSON.stringify(line.text)}`)
    console.log(`  prev: ${JSON.stringify(lineNum > 1 ? state.doc.line(lineNum - 1).text : "")}`)
    console.log(`  expected: ${expected}, got: ${actual}`)
    fail++
  } else {
    pass++
  }
}

// ============================================================
// 1. Keyword Block Openers → Indent Next Line
// ============================================================

// 1.1 Method Definitions
test("1.1a def foo", "def foo\n", 2, 2)
test("1.1b def foo(x, y)", "def foo(x, y)\n", 2, 2)
test("1.1c def with defaults", "def foo(x = 10)\n", 2, 2)
test("1.1d def with splats", "def foo(*args, **kwargs, &block)\n", 2, 2)
test("1.1e def self.foo", "def self.foo\n", 2, 2)

// 1.2 Class / Module
test("1.2a class", "class Foo\n", 2, 2)
test("1.2b class with inheritance", "class Foo < Bar\n", 2, 2)
test("1.2c module", "module Foo\n", 2, 2)

// 1.3 Conditionals
test("1.3a if", "if condition\n", 2, 2)
test("1.3b unless", "unless condition\n", 2, 2)
test("1.3c if complex", "if a && (b || c)\n", 2, 2)

// 1.4 Loops
test("1.4a while", "while condition\n", 2, 2)
test("1.4b until", "until condition\n", 2, 2)
test("1.4c for", "for x in items\n", 2, 2)
test("1.4d loop do", "loop do\n", 2, 2)

// 1.5 Case
test("1.5a case", "case x\n", 2, 2)

// 1.6 Begin
test("1.6a begin", "begin\n", 2, 2)

// 1.7 Blocks (do..end)
test("1.7a each do", "items.each do |x|\n", 2, 2)
test("1.7b map do", "items.map do |item|\n", 2, 2)
test("1.7c do without params", "loop do\n", 2, 2)

// 1.8 Blocks (braces) and brackets
test("1.8a brace block", "items.each { |x|\n", 2, 2)
test("1.8b hash literal", "x = {\n", 2, 2)
test("1.8c array literal", "x = [\n", 2, 2)
test("1.8d method call open paren", "foo(\n", 2, 2)

// ============================================================
// 2. Mid-Block Keywords → Deindent Current, Indent Next
// ============================================================

// 2.1 else — deindents to match if, then body indents
test("2.1a else deindent", "if condition\n  body\nelse", 3, 0)
test("2.1a else body indent", "if condition\n  body\nelse\n", 4, 2)

// 2.2 elsif
test("2.2a elsif deindent", "if condition\n  body\nelsif other", 3, 0)
test("2.2a elsif body indent", "if condition\n  body\nelsif other\n", 4, 2)

// 2.3 when
test("2.3a when deindent", "case x\nwhen 1\n  body\nwhen 2", 4, 0)
test("2.3a when body indent", "case x\nwhen 1\n", 3, 2)

// 2.4 rescue
test("2.4a rescue deindent (begin)", "begin\n  body\nrescue", 3, 0)
test("2.4a rescue body indent", "begin\n  body\nrescue => e\n", 4, 2)
test("2.4b rescue deindent (def)", "def foo\n  body\nrescue => e", 3, 0)
test("2.4d multiple rescues", "begin\n  body\nrescue TypeError\n  handle\nrescue RuntimeError", 5, 0)

// 2.5 ensure
test("2.5a ensure deindent", "begin\n  body\nrescue => e\n  handle\nensure", 5, 0)
test("2.5a ensure body indent", "begin\n  body\nrescue => e\n  handle\nensure\n", 6, 2)

// ============================================================
// 3. End → Deindent to Matching Opener
// ============================================================

test("3a end matches def", "def foo\n  body\nend", 3, 0)
test("3b end matches class", "class Foo\n  body\nend", 3, 0)
test("3c end matches if", "if condition\n  body\nend", 3, 0)
test("3d end matches do", "items.each do |x|\n  body\nend", 3, 0)
test("3e nested end (inner)", "class Foo\n  def bar\n    if baz\n      body\n    end", 5, 4)
test("3e nested end (middle)", "class Foo\n  def bar\n    if baz\n      body\n    end\n  end", 6, 2)
test("3e nested end (outer)", "class Foo\n  def bar\n    if baz\n      body\n    end\n  end\nend", 7, 0)

// ============================================================
// 5. After end → Same Level as end
// ============================================================

test("5a after end at level 0", "def foo\n  body\nend\n", 4, 0)
test("5b after inner end", "class Foo\n  def bar\n    body\n  end\n", 5, 2)
test("5c after inner if end", "class Foo\n  def bar\n    if cond\n      body\n    end\n", 6, 4)

// ============================================================
// 6. Nesting
// ============================================================

test("6a class > def > body", "class Foo\n  def bar\n", 3, 4)
test("6b class > def > if > body", "class Foo\n  def bar\n    if condition\n", 4, 6)
test("6c module > class > def > body", "module Outer\n  class Inner\n    def foo\n", 4, 6)
test("6a class > def > end", "class Foo\n  def bar\n    body\n  end\n", 5, 2)
test("6a class > end", "class Foo\n  def bar\n    body\n  end\nend\n", 6, 0)

// Nested indentation with keywords at proper levels
test("6 nested class+def", "class Foo\n  def bar\n    x\n", 4, 4)

// ============================================================
// 7. Modifier Forms → NO Indent Change
// ============================================================

test("7a modifier if", "return x if condition\n", 2, 0)
test("7b modifier unless", "do_something unless condition\n", 2, 0)
test("7f ternary", "x = condition ? a : b\n", 2, 0)

// ============================================================
// 8. One-Line Bodies → NO Indent Change
// ============================================================

test("8b single-line class", "class Foo; end\n", 2, 0)
test("8c single-line def", "def foo; body; end\n", 2, 0)
test("8d single-line block", "items.each { |x| x + 1 }\n", 2, 0)
test("8f endless method", "def foo(x) = x + 1\n", 2, 0)
test("8g single-line array", "x = [1, 2, 3]\n", 2, 0)
test("8h single-line hash", "x = { a: 1, b: 2 }\n", 2, 0)
test("8i single-line call", "foo(a, b, c)\n", 2, 0)

// ============================================================
// 15. Edge Cases
// ============================================================

test("15a weekend variable", "def foo\n  weekend = true\n", 3, 2)
test("15c if in string", "def foo\n  puts \"if you say so\"\n", 3, 2)
test("15i empty line preserves context", "class Foo\n  def bar\n    body\n\n", 5, 4)

// ============================================================
// 14. Complex Real-World Patterns
// ============================================================

// 14c — method with rescue/ensure
test("14c rescue in def", "def fetch_data\n  response = foo\n  bar\nrescue => e", 4, 0)
test("14c rescue body", "def fetch_data\n  response = foo\nrescue => e\n", 4, 2)
test("14c ensure", "def fetch_data\n  response = foo\nrescue => e\n  handle\nensure", 5, 0)
test("14c ensure body", "def fetch_data\n  response = foo\nrescue => e\n  handle\nensure\n", 6, 2)
test("14c end", "def fetch_data\n  response = foo\nrescue => e\n  handle\nensure\n  cleanup\nend", 7, 0)

// 14d — nested case
test("14d when body", "case command\nwhen :start\n", 3, 2)
test("14d if inside when", "case command\nwhen :start\n  if ready?\n", 4, 4)
test("14d else inside if inside when", "case command\nwhen :start\n  if ready?\n    execute\n  else", 5, 2)

// 14e — begin/rescue inside if inside def
test("14e begin inside if", "def process\n  if valid?\n    begin\n", 4, 6)
test("14e rescue inside begin inside if", "def process\n  if valid?\n    begin\n      do_work\n    rescue => e", 5, 4)
test("14e ensure", "def process\n  if valid?\n    begin\n      do_work\n    rescue => e\n      handle\n    ensure", 7, 4)

console.log(`\n${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
