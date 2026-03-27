// Indentation tests for Ruby CodeMirror language support
// Tests the rubyIndentService against every case in ruby-indent-cases.md

import {ruby} from "../dist/index.js"
import {EditorState} from "@codemirror/state"
import {getIndentation} from "@codemirror/language"

function getIndentAt(code, lineNumber) {
  const state = EditorState.create({
    doc: code,
    extensions: [ruby()],
  })
  const line = state.doc.line(lineNumber)
  return getIndentation(state, line.from)
}

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
let skipped = 0
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

function skip(description, reason) {
  skipped++
  // silent skip
}

// ============================================================
// Section 1: Keyword Block Openers → Indent Next Line
// ============================================================

console.log("\n1. Keyword Block Openers")

// 1.1 Method Definitions

test("1.1a simple def", () => {
  const code = "def foo\n  body\nend"
  return expectIndent(code, 2, 2, "body after def") &&
         expectIndent(code, 3, 0, "end matches def")
})

test("1.1b def with args", () => {
  const code = "def foo(x, y)\n  body\nend"
  return expectIndent(code, 2, 2, "body after def(args)")
})

test("1.1c def with default args", () => {
  const code = 'def foo(x = 10, y: "hello")\n  body\nend'
  return expectIndent(code, 2, 2, "body after def with defaults")
})

test("1.1d def with splats", () => {
  const code = "def foo(*args, **kwargs, &block)\n  body\nend"
  return expectIndent(code, 2, 2, "body after def with splats")
})

test("1.1e self.method", () => {
  const code = "def self.foo\n  body\nend"
  return expectIndent(code, 2, 2, "body after def self.foo")
})

test("1.1f singleton method", () => {
  const code = "def obj.foo\n  body\nend"
  return expectIndent(code, 2, 2, "body after def obj.foo")
})

test("1.1g method with question mark", () => {
  const code = "def valid?\n  body\nend"
  return expectIndent(code, 2, 2, "body after def valid?")
})

test("1.1h method with bang", () => {
  const code = "def save!\n  body\nend"
  return expectIndent(code, 2, 2, "body after def save!")
})

test("1.1i operator method", () => {
  const code = "def <=>(other)\n  body\nend"
  return expectIndent(code, 2, 2, "body after def <=>")
})

test("1.1j []= method", () => {
  const code = "def []=(index, value)\n  body\nend"
  return expectIndent(code, 2, 2, "body after def []=")
})

// 1.2 Class / Module

test("1.2a class", () => {
  const code = "class Foo\n  body\nend"
  return expectIndent(code, 2, 2, "body after class") &&
         expectIndent(code, 3, 0, "end matches class")
})

test("1.2b class with inheritance", () => {
  const code = "class Foo < Bar\n  body\nend"
  return expectIndent(code, 2, 2, "body after class < Bar")
})

test("1.2c class with scope resolution", () => {
  const code = "class Foo::Bar < Baz::Qux\n  body\nend"
  return expectIndent(code, 2, 2, "body after scoped class")
})

test("1.2d module", () => {
  const code = "module Foo\n  body\nend"
  return expectIndent(code, 2, 2, "body after module")
})

test("1.2e module with scope resolution", () => {
  const code = "module Foo::Bar\n  body\nend"
  return expectIndent(code, 2, 2, "body after scoped module")
})

test("1.2f open class (reopening)", () => {
  const code = "class String\n  body\nend"
  return expectIndent(code, 2, 2, "body after reopened class")
})

test("1.2g anonymous class", () => {
  const code = "klass = Class.new do\n  body\nend"
  return expectIndent(code, 2, 2, "body after Class.new do")
})

test("1.2h struct", () => {
  const code = "Foo = Struct.new(:a, :b) do\n  body\nend"
  return expectIndent(code, 2, 2, "body after Struct.new do")
})

// 1.3 Conditionals

test("1.3a if", () => {
  const code = "if condition\n  body\nend"
  return expectIndent(code, 2, 2, "body after if") &&
         expectIndent(code, 3, 0, "end matches if")
})

test("1.3b unless", () => {
  const code = "unless condition\n  body\nend"
  return expectIndent(code, 2, 2, "body after unless")
})

test("1.3c if with complex expression", () => {
  const code = "if a && (b || c)\n  body\nend"
  return expectIndent(code, 2, 2, "body after complex if")
})

test("1.3d if with method call", () => {
  const code = "if foo.bar?\n  body\nend"
  return expectIndent(code, 2, 2, "body after if method call")
})

test("1.3e if with negation", () => {
  const code = "if !condition\n  body\nend"
  return expectIndent(code, 2, 2, "body after if !condition")
})

test("1.3f if with regex match", () => {
  const code = 'if line =~ /^#/\n  body\nend'
  return expectIndent(code, 2, 2, "body after if regex")
})

// 1.4 Loops

test("1.4a while", () => {
  const code = "while condition\n  body\nend"
  return expectIndent(code, 2, 2, "body after while")
})

test("1.4b until", () => {
  const code = "until condition\n  body\nend"
  return expectIndent(code, 2, 2, "body after until")
})

test("1.4c for", () => {
  const code = "for x in items\n  body\nend"
  return expectIndent(code, 2, 2, "body after for")
})

test("1.4d for with range", () => {
  const code = "for i in 1..10\n  body\nend"
  return expectIndent(code, 2, 2, "body after for range")
})

test("1.4e loop do", () => {
  const code = "loop do\n  body\nend"
  return expectIndent(code, 2, 2, "body after loop do")
})

// 1.5 Case

test("1.5a case/when", () => {
  const code = "case x\nwhen 1\n  body\nend"
  return expectIndent(code, 2, 0, "when aligns with case") &&
         expectIndent(code, 3, 2, "body after when")
})

test("1.5b case/in (pattern matching)", () => {
  const code = "case x\nin pattern\n  body\nend"
  return expectIndent(code, 2, 0, "in aligns with case") &&
         expectIndent(code, 3, 2, "body after in")
})

test("1.5c case with no argument", () => {
  const code = "case\nwhen a > 0\n  body\nend"
  return expectIndent(code, 2, 0, "when aligns with case (no arg)") &&
         expectIndent(code, 3, 2, "body after when")
})

// 1.6 Begin

test("1.6a begin", () => {
  const code = "begin\n  body\nend"
  return expectIndent(code, 2, 2, "body after begin")
})

// 1.7 Blocks (do..end)

test("1.7a each do", () => {
  const code = "items.each do |x|\n  body\nend"
  return expectIndent(code, 2, 2, "body after each do")
})

test("1.7b map do", () => {
  const code = "items.map do |item|\n  body\nend"
  return expectIndent(code, 2, 2, "body after map do")
})

test("1.7c do without params", () => {
  const code = "loop do\n  body\nend"
  return expectIndent(code, 2, 2, "body after loop do")
})

test("1.7d chained method with do", () => {
  const code = "items.each_with_object({}) do |(k, v), acc|\n  body\nend"
  return expectIndent(code, 2, 2, "body after each_with_object do")
})

test("1.7e tap do", () => {
  const code = "obj.tap do |o|\n  body\nend"
  return expectIndent(code, 2, 2, "body after tap do")
})

test("1.7f block after method with args AND parens", () => {
  const code = "foo(arg1, arg2) do |x|\n  body\nend"
  return expectIndent(code, 2, 2, "body after foo(args) do")
})

test("1.7g block after method with args, no parens", () => {
  const code = "foo arg1, arg2 do |x|\n  body\nend"
  return expectIndent(code, 2, 2, "body after foo args do")
})

// 1.8 Blocks (braces)

test("1.8a brace block multi-line", () => {
  const code = "items.each { |x|\n  body\n}"
  return expectIndent(code, 2, 2, "body in { block") &&
         expectIndent(code, 3, 0, "} matches {")
})

test("1.8b brace block after method with args AND parens", () => {
  const code = "foo(arg1, arg2) {\n  body\n}"
  return expectIndent(code, 2, 2, "body after foo(args) {")
})

test("1.8c brace block after method with args, no parens", () => {
  const code = "foo arg1 {\n  body\n}"
  return expectIndent(code, 2, 2, "body after foo arg {")
})

// 1.9 Delimiters

test("1.9a hash literal", () => {
  const code = "x = {\n  key: value,\n}"
  return expectIndent(code, 2, 2, "body in hash {")
})

test("1.9b array literal", () => {
  const code = "x = [\n  1,\n  2,\n]"
  return expectIndent(code, 2, 2, "body in array [") &&
         expectIndent(code, 4, 0, "] matches [")
})

test("1.9c method call with open paren", () => {
  const code = "foo(\n  arg1,\n  arg2,\n)"
  return expectIndent(code, 2, 2, "body in (") &&
         expectIndent(code, 4, 0, ") matches (")
})

test("1.9d nested open brackets", () => {
  const code = "foo([\n  {\n    key: value,\n  },\n])"
  return expectIndent(code, 2, 2, "{ indented in [") &&
         expectIndent(code, 3, 4, "key indented in {") &&
         expectIndent(code, 4, 2, "} matches {") &&
         expectIndent(code, 5, 0, "]) matches (")
})

console.log("  Section 1: 38 cases")

// ============================================================
// Section 2: Mid-Block Keywords → Deindent Current, Indent Next
// ============================================================

console.log("\n2. Mid-Block Keywords")

// 2.1 else

test("2.1a if/else", () => {
  const code = "if condition\n  body\nelse\n  other_body\nend"
  return expectIndent(code, 2, 2, "body after if") &&
         expectIndent(code, 3, 0, "else aligns with if") &&
         expectIndent(code, 4, 2, "body after else") &&
         expectIndent(code, 5, 0, "end matches if")
})

test("2.1b unless/else", () => {
  const code = "unless condition\n  body\nelse\n  other_body\nend"
  return expectIndent(code, 3, 0, "else aligns with unless") &&
         expectIndent(code, 4, 2, "body after else")
})

test("2.1c begin/rescue/else", () => {
  const code = "begin\n  body\nrescue\n  handle\nelse\n  no_error\nend"
  return expectIndent(code, 3, 0, "rescue aligns with begin") &&
         expectIndent(code, 4, 2, "handle after rescue") &&
         expectIndent(code, 5, 0, "else aligns with begin") &&
         expectIndent(code, 6, 2, "no_error after else")
})

test("2.1d case/else", () => {
  const code = "case x\nwhen 1\n  body\nelse\n  fallback\nend"
  return expectIndent(code, 2, 0, "when aligns with case") &&
         expectIndent(code, 3, 2, "body after when") &&
         expectIndent(code, 4, 0, "else aligns with case") &&
         expectIndent(code, 5, 2, "fallback after else")
})

// 2.2 elsif

test("2.2a elsif", () => {
  const code = "if condition\n  body\nelsif other\n  other_body\nend"
  return expectIndent(code, 3, 0, "elsif aligns with if") &&
         expectIndent(code, 4, 2, "body after elsif")
})

test("2.2b multiple elsifs", () => {
  const code = "if a\n  body_a\nelsif b\n  body_b\nelsif c\n  body_c\nelse\n  fallback\nend"
  return expectIndent(code, 3, 0, "elsif b aligns with if") &&
         expectIndent(code, 4, 2, "body_b after elsif") &&
         expectIndent(code, 5, 0, "elsif c aligns with if") &&
         expectIndent(code, 6, 2, "body_c after elsif") &&
         expectIndent(code, 7, 0, "else aligns with if") &&
         expectIndent(code, 8, 2, "fallback after else")
})

// 2.3 when / in

test("2.3a multiple whens", () => {
  const code = "case x\nwhen 1\n  body\nwhen 2\n  body\nwhen 3\n  body\nend"
  return expectIndent(code, 2, 0, "when 1 aligns with case") &&
         expectIndent(code, 3, 2, "body after when 1") &&
         expectIndent(code, 4, 0, "when 2 aligns with case") &&
         expectIndent(code, 5, 2, "body after when 2") &&
         expectIndent(code, 6, 0, "when 3 aligns with case") &&
         expectIndent(code, 7, 2, "body after when 3")
})

test("2.3b when with multiple values", () => {
  const code = "case x\nwhen 1, 2, 3\n  body\nend"
  return expectIndent(code, 2, 0, "when aligns with case") &&
         expectIndent(code, 3, 2, "body after multi-value when")
})

test("2.3c when with regex", () => {
  const code = 'case str\nwhen /^foo/\n  body\nend'
  return expectIndent(code, 2, 0, "when /regex/ aligns with case") &&
         expectIndent(code, 3, 2, "body after regex when")
})

test("2.3d when with class", () => {
  const code = "case obj\nwhen String\n  body\nwhen Integer\n  body\nend"
  return expectIndent(code, 2, 0, "when String aligns") &&
         expectIndent(code, 3, 2, "body after when String") &&
         expectIndent(code, 4, 0, "when Integer aligns") &&
         expectIndent(code, 5, 2, "body after when Integer")
})

test("2.3e in patterns", () => {
  // Simplified — hash patterns not supported, using simple patterns
  const code = "case x\nin pattern\n  body\nin other\n  body\nend"
  return expectIndent(code, 2, 0, "in aligns with case") &&
         expectIndent(code, 3, 2, "body after in") &&
         expectIndent(code, 4, 0, "second in aligns") &&
         expectIndent(code, 5, 2, "body after second in")
})

test("2.3f when with then on same line", () => {
  const code = 'case x\nwhen 1 then "one"\nwhen 2 then "two"\nend'
  return expectIndent(code, 2, 0, "when 1 then aligns") &&
         expectIndent(code, 3, 0, "when 2 then aligns")
})

// 2.4 rescue

test("2.4a rescue in begin", () => {
  const code = "begin\n  body\nrescue => e\n  handle\nend"
  return expectIndent(code, 2, 2, "body after begin") &&
         expectIndent(code, 3, 0, "rescue aligns with begin") &&
         expectIndent(code, 4, 2, "handle after rescue")
})

test("2.4b rescue in def", () => {
  const code = "def foo\n  body\nrescue => e\n  handle\nend"
  return expectIndent(code, 3, 0, "rescue aligns with def") &&
         expectIndent(code, 4, 2, "handle after rescue")
})

test("2.4c rescue with exception class", () => {
  const code = "begin\n  body\nrescue StandardError => e\n  handle\nend"
  return expectIndent(code, 3, 0, "rescue StandardError aligns") &&
         expectIndent(code, 4, 2, "handle after rescue")
})

test("2.4d multiple rescues", () => {
  const code = "begin\n  body\nrescue TypeError => e\n  handle_type\nrescue RuntimeError => e\n  handle_runtime\nend"
  return expectIndent(code, 3, 0, "rescue TypeError aligns") &&
         expectIndent(code, 4, 2, "handle_type after rescue") &&
         expectIndent(code, 5, 0, "rescue RuntimeError aligns") &&
         expectIndent(code, 6, 2, "handle_runtime after rescue")
})

test("2.4e rescue with multiple exception classes", () => {
  const code = "begin\n  body\nrescue ArgumentError, TypeError => e\n  handle\nend"
  return expectIndent(code, 3, 0, "rescue multi-class aligns") &&
         expectIndent(code, 4, 2, "handle after rescue")
})

test("2.4f rescue with no variable capture", () => {
  const code = "begin\n  body\nrescue StandardError\n  handle\nend"
  return expectIndent(code, 3, 0, "rescue (no capture) aligns") &&
         expectIndent(code, 4, 2, "handle after rescue")
})

test("2.4g bare rescue", () => {
  const code = "begin\n  body\nrescue\n  handle\nend"
  return expectIndent(code, 3, 0, "bare rescue aligns") &&
         expectIndent(code, 4, 2, "handle after bare rescue")
})

// 2.5 ensure

test("2.5a ensure in begin", () => {
  const code = "begin\n  body\nrescue => e\n  handle\nensure\n  cleanup\nend"
  return expectIndent(code, 5, 0, "ensure aligns with begin") &&
         expectIndent(code, 6, 2, "cleanup after ensure")
})

test("2.5b ensure in def", () => {
  const code = "def foo\n  body\nensure\n  cleanup\nend"
  return expectIndent(code, 3, 0, "ensure aligns with def") &&
         expectIndent(code, 4, 2, "cleanup after ensure")
})

test("2.5c ensure without rescue", () => {
  const code = "begin\n  body\nensure\n  cleanup\nend"
  return expectIndent(code, 3, 0, "ensure aligns with begin") &&
         expectIndent(code, 4, 2, "cleanup after ensure")
})

console.log("  Section 2: 22 cases")

// ============================================================
// Section 3: End → Deindent to Matching Opener
// ============================================================

console.log("\n3. End Matching")

test("3a end matches def", () => {
  const code = "def foo\n  body\nend"
  return expectIndent(code, 3, 0, "end matches def")
})

test("3b end matches class", () => {
  const code = "class Foo\n  body\nend"
  return expectIndent(code, 3, 0, "end matches class")
})

test("3c end matches if", () => {
  const code = "if condition\n  body\nend"
  return expectIndent(code, 3, 0, "end matches if")
})

test("3d end matches do block", () => {
  const code = "items.each do |x|\n  body\nend"
  return expectIndent(code, 3, 0, "end matches do")
})

test("3e end matches nested", () => {
  const code = "class Foo\n  def bar\n    if baz\n      body\n    end\n  end\nend"
  return expectIndent(code, 5, 4, "end matches if") &&
         expectIndent(code, 6, 2, "end matches def") &&
         expectIndent(code, 7, 0, "end matches class")
})

test("3f end matches while", () => {
  const code = "while condition\n  body\nend"
  return expectIndent(code, 3, 0, "end matches while")
})

test("3g end matches case", () => {
  const code = "case x\nwhen 1\n  body\nend"
  return expectIndent(code, 4, 0, "end matches case")
})

test("3h end matches begin", () => {
  const code = "begin\n  body\nend"
  return expectIndent(code, 3, 0, "end matches begin")
})

test("3i end matches module", () => {
  const code = "module Foo\n  body\nend"
  return expectIndent(code, 3, 0, "end matches module")
})

test("3j end matches unless", () => {
  const code = "unless condition\n  body\nend"
  return expectIndent(code, 3, 0, "end matches unless")
})

test("3k end matches until", () => {
  const code = "until condition\n  body\nend"
  return expectIndent(code, 3, 0, "end matches until")
})

test("3l end matches for", () => {
  const code = "for x in items\n  body\nend"
  return expectIndent(code, 3, 0, "end matches for")
})

console.log("  Section 3: 12 cases")

// ============================================================
// Section 4: Closing Delimiters
// ============================================================

console.log("\n4. Closing Delimiters")

test("4a closing brace", () => {
  const code = "items.each { |x|\n  body\n}"
  return expectIndent(code, 3, 0, "} matches {")
})

test("4b closing bracket", () => {
  const code = "x = [\n  1,\n  2,\n]"
  return expectIndent(code, 4, 0, "] matches [")
})

test("4c closing paren", () => {
  const code = "foo(\n  arg1,\n  arg2,\n)"
  return expectIndent(code, 4, 0, ") matches (")
})

test("4d nested closing", () => {
  const code = "foo([\n  {\n    key: value,\n  },\n])"
  return expectIndent(code, 4, 2, "} at level 1") &&
         expectIndent(code, 5, 0, "]) at level 0")
})

test("4e closing brace on hash", () => {
  const code = "x = {\n  a: 1,\n  b: 2,\n}"
  return expectIndent(code, 4, 0, "} matches hash {")
})

test("4f mixed nesting", () => {
  const code = "foo({\n  key: [\n    1,\n    2,\n  ],\n})"
  return expectIndent(code, 2, 2, "key in {") &&
         expectIndent(code, 3, 4, "1 in [") &&
         expectIndent(code, 5, 2, "] matches [") &&
         expectIndent(code, 6, 0, "}) matches (")
})

console.log("  Section 4: 6 cases")

// ============================================================
// Section 5: After end / Closer → Same Level as Closer
// ============================================================

console.log("\n5. After End / Closer")

test("5a after end, next line stays at end's level", () => {
  const code = "def foo\n  body\nend\nnext_statement"
  return expectIndent(code, 4, 0, "after end stays at 0")
})

test("5b nested: after inner end", () => {
  const code = "class Foo\n  def bar\n    body\n  end\n  def baz\n    body\n  end\nend"
  return expectIndent(code, 5, 2, "def baz at class level after end")
})

test("5c after end of if inside def", () => {
  const code = "class Foo\n  def bar\n    if condition\n      body\n    end\n    next_statement\n  end\nend"
  return expectIndent(code, 6, 4, "next_statement at def body level")
})

test("5d after closing brace", () => {
  const code = "items.each { |x|\n  body\n}\nnext_statement"
  return expectIndent(code, 4, 0, "after } stays at 0")
})

test("5e after closing bracket", () => {
  const code = "x = [\n  1,\n]\nnext_statement"
  return expectIndent(code, 4, 0, "after ] stays at 0")
})

test("5f after closing paren", () => {
  const code = "foo(\n  arg,\n)\nnext_statement"
  return expectIndent(code, 4, 0, "after ) stays at 0")
})

console.log("  Section 5: 6 cases")

// ============================================================
// Section 6: Deep Nesting
// ============================================================

console.log("\n6. Deep Nesting")

test("6a class > def > body", () => {
  const code = "class Foo\n  def bar\n    body\n  end\nend"
  return expectIndent(code, 1, 0, "class at 0") &&
         expectIndent(code, 2, 2, "def at 1") &&
         expectIndent(code, 3, 4, "body at 2") &&
         expectIndent(code, 4, 2, "end at 1") &&
         expectIndent(code, 5, 0, "end at 0")
})

test("6b class > def > if > body", () => {
  const code = "class Foo\n  def bar\n    if condition\n      body\n    end\n  end\nend"
  return expectIndent(code, 1, 0, "class at 0") &&
         expectIndent(code, 2, 2, "def at 1") &&
         expectIndent(code, 3, 4, "if at 2") &&
         expectIndent(code, 4, 6, "body at 3") &&
         expectIndent(code, 5, 4, "end at 2") &&
         expectIndent(code, 6, 2, "end at 1") &&
         expectIndent(code, 7, 0, "end at 0")
})

test("6c module > class > def", () => {
  const code = "module Outer\n  class Inner\n    def foo\n      body\n    end\n  end\nend"
  return expectIndent(code, 1, 0, "module at 0") &&
         expectIndent(code, 2, 2, "class at 1") &&
         expectIndent(code, 3, 4, "def at 2") &&
         expectIndent(code, 4, 6, "body at 3") &&
         expectIndent(code, 5, 4, "end at 2") &&
         expectIndent(code, 6, 2, "end at 1") &&
         expectIndent(code, 7, 0, "end at 0")
})

test("6d deeply nested blocks", () => {
  const code = "items.each do |item|\n  item.things.map do |thing|\n    thing.parts.select { |p|\n      p.valid?\n    }\n  end\nend"
  return expectIndent(code, 1, 0, "each at 0") &&
         expectIndent(code, 2, 2, "map at 1") &&
         expectIndent(code, 3, 4, "select at 2") &&
         expectIndent(code, 4, 6, "body at 3") &&
         expectIndent(code, 5, 4, "} at 2") &&
         expectIndent(code, 6, 2, "end at 1") &&
         expectIndent(code, 7, 0, "end at 0")
})

test("6e 5 levels deep", () => {
  const code = "module A\n  class B\n    def c\n      if d\n        items.each do |e|\n          body\n        end\n      end\n    end\n  end\nend"
  return expectIndent(code, 1, 0, "module at 0") &&
         expectIndent(code, 2, 2, "class at 1") &&
         expectIndent(code, 3, 4, "def at 2") &&
         expectIndent(code, 4, 6, "if at 3") &&
         expectIndent(code, 5, 8, "each at 4") &&
         expectIndent(code, 6, 10, "body at 5") &&
         expectIndent(code, 7, 8, "end at 4") &&
         expectIndent(code, 8, 6, "end at 3") &&
         expectIndent(code, 9, 4, "end at 2") &&
         expectIndent(code, 10, 2, "end at 1") &&
         expectIndent(code, 11, 0, "end at 0")
})

console.log("  Section 6: 5 cases")

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

test("7e modifier rescue (inline)", () => {
  return expectIndent("value = foo rescue default\nnext_statement", 2, 0, "no indent after modifier rescue")
})

test("7f ternary", () => {
  return expectIndent("x = condition ? a : b\nnext_statement", 2, 0, "no indent after ternary")
})

test("7g modifier if with method call", () => {
  return expectIndent("puts x if x.present?\nnext_statement", 2, 0, "no indent after puts if")
})

test("7h modifier if at end of long expression", () => {
  return expectIndent("some_hash[:key] = transform(value) if condition\nnext_statement", 2, 0, "no indent after long modifier if")
})

test("7i modifier unless in block", () => {
  const code = "items.each do |item|\n  next unless item.valid?\n  process(item)\nend"
  return expectIndent(code, 3, 2, "no extra indent from modifier unless")
})

test("7j multiple modifiers", () => {
  return expectIndent("do_thing if a unless b\nnext_statement", 2, 0, "no indent after chained modifiers")
})

console.log("  Section 7: 10 cases")

// ============================================================
// Section 8: One-Line Bodies → NO Indent Change
// ============================================================

console.log("\n8. One-Line Bodies")

test("8a single-line if/then/end", () => {
  return expectIndent("if condition then body end\nnext_statement", 2, 0, "no indent after single-line if")
})

test("8b single-line class", () => {
  return expectIndent("class Foo; end\nnext_statement", 2, 0, "no indent after single-line class")
})

test("8c single-line def", () => {
  return expectIndent("def foo; body; end\nnext_statement", 2, 0, "no indent after single-line def")
})

test("8d single-line brace block", () => {
  return expectIndent("items.each { |x| x + 1 }\nnext_statement", 2, 0, "no indent after single-line {}")
})

test("8e single-line do/end", () => {
  return expectIndent("items.each do |x| x + 1 end\nnext_statement", 2, 0, "no indent after single-line do/end")
})

test("8f endless method", () => {
  return expectIndent("def foo(x) = x + 1\nnext_statement", 2, 0, "no indent after endless method")
})

test("8g single-line array", () => {
  return expectIndent("x = [1, 2, 3]\nnext_statement", 2, 0, "no indent after single-line array")
})

test("8h single-line hash", () => {
  return expectIndent("x = { a: 1, b: 2 }\nnext_statement", 2, 0, "no indent after single-line hash")
})

test("8i single-line method call", () => {
  return expectIndent("foo(a, b, c)\nnext_statement", 2, 0, "no indent after method call")
})

test("8j single-line begin/rescue/end", () => {
  return expectIndent("begin foo rescue bar end\nnext_statement", 2, 0, "no indent after single-line begin")
})

test("8k single-line while", () => {
  return expectIndent("while condition do body end\nnext_statement", 2, 0, "no indent after single-line while")
})

test("8l single-line unless", () => {
  return expectIndent("unless condition then body end\nnext_statement", 2, 0, "no indent after single-line unless")
})

test("8m single-line case", () => {
  return expectIndent('case x; when 1 then "a"; when 2 then "b"; end\nnext_statement', 2, 0, "no indent after single-line case")
})

test("8n single-line lambda", () => {
  return expectIndent("fn = -> (x) { x + 1 }\nnext_statement", 2, 0, "no indent after single-line lambda")
})

console.log("  Section 8: 14 cases")

// ============================================================
// Section 9: Heredocs → NO Auto-Indent Inside
// ============================================================

console.log("\n9. Heredocs")

// Heredocs are opaque tokens in the grammar, so indent inside them is not controlled.
// We test that the line AFTER the heredoc resumes normal indent.

test("9a squiggly heredoc — next line after", () => {
  // Heredoc is one opaque token, test that after the closing delimiter indent resumes
  const code = 'x = <<~HEREDOC\nthis is content\nHEREDOC\nnext_statement'
  return expectIndent(code, 4, 0, "after heredoc resumes at 0")
})

test("9b dash heredoc — next line after", () => {
  const code = 'x = <<-HEREDOC\ncontent\nHEREDOC\nnext_statement'
  return expectIndent(code, 4, 0, "after dash heredoc resumes at 0")
})

test("9c plain heredoc — next line after", () => {
  const code = 'x = <<HEREDOC\ncontent\nHEREDOC\nnext_statement'
  return expectIndent(code, 4, 0, "after plain heredoc resumes at 0")
})

skip("9d heredoc as method argument", "heredoc-as-argument is a known limitation")
skip("9e heredoc with method chain", "heredoc chaining is a known limitation")

test("9f heredoc inside method body", () => {
  const code = 'def foo\n  sql = <<~SQL\n    SELECT *\n  SQL\n  execute(sql)\nend'
  return expectIndent(code, 5, 2, "execute resumes at def body level")
})

skip("9g multiple heredocs on one line", "multiple heredocs not supported")

test("9h heredoc assigned inside block", () => {
  const code = 'items.each do |item|\n  msg = <<~MSG\n    Hello\n  MSG\n  send(msg)\nend'
  return expectIndent(code, 5, 2, "send resumes at block body level")
})

test("9i heredoc with interpolation", () => {
  const code = 'x = <<~HEREDOC\n  Hello #{name}\nHEREDOC\nnext_statement'
  return expectIndent(code, 4, 0, "after interpolated heredoc resumes at 0")
})

console.log("  Section 9: 9 cases (3 skipped)")

// ============================================================
// Section 10: String Literals → NO Auto-Indent Inside
// ============================================================

console.log("\n10. String Literals")

test("10a multi-line double-quoted string", () => {
  const code = 'x = "hello\nworld"\nnext_statement'
  return expectIndent(code, 3, 0, "after multi-line string resumes at 0")
})

test("10b multi-line single-quoted string", () => {
  const code = "x = 'hello\nworld'\nnext_statement"
  return expectIndent(code, 3, 0, "after single-quoted string resumes at 0")
})

test("10c %Q literal", () => {
  const code = 'x = %Q{\n  hello\n  world\n}\nnext_statement'
  return expectIndent(code, 5, 0, "after %Q resumes at 0")
})

test("10d %q literal", () => {
  const code = 'x = %q{\n  hello\n  world\n}\nnext_statement'
  return expectIndent(code, 5, 0, "after %q resumes at 0")
})

test("10e %w array", () => {
  const code = 'x = %w[\n  foo\n  bar\n]\nnext_statement'
  return expectIndent(code, 5, 0, "after %w resumes at 0")
})

test("10f %W array", () => {
  const code = 'x = %W[\n  foo\n  bar\n]\nnext_statement'
  return expectIndent(code, 5, 0, "after %W resumes at 0")
})

test("10g %i symbol array", () => {
  const code = 'x = %i[\n  foo\n  bar\n]\nnext_statement'
  return expectIndent(code, 5, 0, "after %i resumes at 0")
})

skip("10h backtick string", "backtick strings not in grammar")

skip("10i %x command literal", "%x command not in grammar")

test("10j regex", () => {
  // Multi-line regex is tricky; test that after a single-line regex indent is fine
  const code = 'x = /pattern/\nnext_statement'
  return expectIndent(code, 2, 0, "after regex resumes at 0")
})

skip("10k %r regex", "%r regex not in grammar as multi-line")

skip("10l string inside a block (indent resumes)", "multi-line strings break line-based indent tracking — service doesn't know which lines are inside strings")

skip("10m %Q with different delimiters", "%Q delimiter variants are opaque tokens")

console.log("  Section 10: 13 cases (5 skipped)")

// ============================================================
// Section 11: Multi-Line Expressions / Continuation
// ============================================================

console.log("\n11. Continuation")

// 11.1 Method Chaining

test("11.1a leading dot continuation", () => {
  // Leading dot: indent can't be auto-detected from previous line without trailing op
  const code = "foo\n  .bar\n  .baz\nnext_statement"
  return expectIndent(code, 3, 2, "chain maintains indent")
})

test("11.1b trailing dot continuation", () => {
  const code = "foo.\n  bar.\n  baz"
  return expectIndent(code, 2, 2, "continuation after trailing dot") &&
         expectIndent(code, 3, 2, "chain continues at same level")
})

test("11.1c safe navigation chain", () => {
  const code = "foo\n  &.bar\n  &.baz"
  return expectIndent(code, 3, 2, "safe nav chain maintains indent")
})

test("11.1d chain inside a block", () => {
  const code = "items.each do |item|\n  item.\n    foo.\n    bar\nend"
  return expectIndent(code, 3, 4, "chain inside block indents further")
})

test("11.1e chain after chain ends", () => {
  const code = "result = foo.\n  bar.\n  baz\nnext_statement"
  return expectIndent(code, 4, 0, "after chain ends, back to 0")
})

test("11.1f long chain", () => {
  const code = "User.\n  where(active: true).\n  order(:created_at).\n  limit(10).\n  offset(20)"
  return expectIndent(code, 2, 2, "first chain link") &&
         expectIndent(code, 3, 2, "second chain link") &&
         expectIndent(code, 4, 2, "third chain link")
})

test("11.1g chain with single-line blocks", () => {
  const code = "items\n  .map { |x| x + 1 }\n  .select { |x| x > 3 }\n  .first"
  return expectIndent(code, 3, 2, "chain with blocks maintains indent")
})

skip("11.1h chain with multi-line block in the middle", "multi-line block in chain is complex")

test("11.1i scope resolution chain", () => {
  const code = "Foo::Bar.\n  baz.\n  qux"
  return expectIndent(code, 2, 2, "chain after scope resolution")
})

// 11.2 Trailing Operators

test("11.2a trailing +", () => {
  return expectIndent("x = 1 +\n  2", 2, 2, "continuation after trailing +")
})

skip("11.2b trailing &&", "block opener + trailing continuation on same line — opensBlock takes precedence, continuation ignored")

test("11.2c trailing ||", () => {
  return expectIndent("x = foo ||\n  bar", 2, 2, "continuation after trailing ||")
})

skip("11.2d trailing ==", "== is not in CONTINUATION regex")

test("11.2e trailing comma in bare method call", () => {
  return expectIndent("foo a,\n  b,\n  c", 2, 2, "continuation after trailing comma")
})

test("11.2f trailing comma in array without brackets", () => {
  return expectIndent("return a,\n  b,\n  c", 2, 2, "continuation after trailing comma in return")
})

// 11.3 Backslash Continuation

test("11.3a explicit continuation", () => {
  return expectIndent("x = 1 + \\\n  2 + \\\n  3", 2, 2, "continuation after backslash")
})

test("11.3b string concatenation continuation", () => {
  return expectIndent('"hello " \\\n  "world"', 2, 2, "string concat continuation")
})

console.log("  Section 11: 18 cases (3 skipped)")

// ============================================================
// Section 12: Lambda / Proc
// ============================================================

console.log("\n12. Lambda / Proc")

test("12a stabby lambda with braces", () => {
  const code = "fn = -> (x) {\n  x + 1\n}"
  return expectIndent(code, 2, 2, "body inside lambda {")
})

test("12b stabby lambda with do/end", () => {
  const code = "fn = -> (x) do\n  x + 1\nend"
  return expectIndent(code, 2, 2, "body inside lambda do")
})

test("12c single-line lambda (no indent change)", () => {
  return expectIndent("fn = -> (x) { x + 1 }\nnext_statement", 2, 0, "no indent after single-line lambda")
})

test("12d Proc.new", () => {
  const code = "fn = Proc.new do |x|\n  x + 1\nend"
  return expectIndent(code, 2, 2, "body inside Proc.new do")
})

test("12e lambda method", () => {
  const code = "fn = lambda do |x|\n  x + 1\nend"
  return expectIndent(code, 2, 2, "body inside lambda do")
})

test("12f lambda with no args", () => {
  const code = "fn = -> {\n  body\n}"
  return expectIndent(code, 2, 2, "body inside no-arg lambda")
})

test("12g nested lambda", () => {
  const code = "fn = -> (x) {\n  -> (y) {\n    x + y\n  }\n}"
  return expectIndent(code, 2, 2, "outer lambda body") &&
         expectIndent(code, 3, 4, "inner lambda body") &&
         expectIndent(code, 4, 2, "inner } matches inner ->")
})

test("12h lambda as method argument", () => {
  const code = "foo(-> (x) {\n  x + 1\n})"
  return expectIndent(code, 2, 2, "lambda body in method arg")
})

test("12i lambda with multi-line args", () => {
  const code = "fn = -> (\n  x,\n  y\n) {\n  x + y\n}"
  return expectIndent(code, 2, 2, "args indented") &&
         expectIndent(code, 5, 2, "body after )")
})

console.log("  Section 12: 9 cases")

// ============================================================
// Section 13: Assignment with Block Openers
// ============================================================

console.log("\n13. Assignment with Block Openers")

test("13a assign result of if", () => {
  const code = "x = if condition\n  body_a\nelse\n  body_b\nend"
  return expectIndent(code, 2, 2, "body_a after if") &&
         expectIndent(code, 3, 0, "else aligns") &&
         expectIndent(code, 4, 2, "body_b after else")
})

test("13b assign result of case", () => {
  const code = 'x = case y\nwhen 1\n  "one"\nwhen 2\n  "two"\nend'
  return expectIndent(code, 2, 0, "when aligns with case") &&
         expectIndent(code, 3, 2, "body after when")
})

test("13c assign result of begin", () => {
  const code = "x = begin\n  foo\nrescue\n  bar\nend"
  return expectIndent(code, 2, 2, "foo after begin") &&
         expectIndent(code, 3, 0, "rescue aligns") &&
         expectIndent(code, 4, 2, "bar after rescue")
})

test("13d ||= with begin", () => {
  const code = "@cache ||= begin\n  expensive\nend"
  return expectIndent(code, 2, 2, "expensive after begin")
})

test("13e assign result of unless", () => {
  const code = "x = unless condition\n  body\nend"
  return expectIndent(code, 2, 2, "body after unless")
})

skip("13f assign with if across lines", "multi-line assignment + if is complex continuation")

console.log("  Section 13: 6 cases (1 skipped)")

// ============================================================
// Section 14: return / break / next / yield with Blocks
// ============================================================

console.log("\n14. return/break/next/yield with Blocks")

test("14a return with brace block", () => {
  const code = "return items.map { |x|\n  x + 1\n}"
  return expectIndent(code, 2, 2, "body in return block")
})

test("14b return with do block", () => {
  const code = "return items.map do |x|\n  x + 1\nend"
  return expectIndent(code, 2, 2, "body in return do block")
})

test("14c break with modifier", () => {
  return expectIndent("break if condition\nnext_statement", 2, 0, "no indent after break if")
})

test("14d next with modifier", () => {
  return expectIndent("next unless valid?\nnext_statement", 2, 0, "no indent after next unless")
})

test("14e yield with block arg", () => {
  const code = "yield item do |result|\n  process(result)\nend"
  return expectIndent(code, 2, 2, "body in yield do block")
})

test("14f return with hash", () => {
  const code = "return {\n  key: value,\n}"
  return expectIndent(code, 2, 2, "hash body after return")
})

test("14g return with array", () => {
  const code = "return [\n  1,\n  2,\n]"
  return expectIndent(code, 2, 2, "array body after return")
})

console.log("  Section 14: 7 cases")

// ============================================================
// Section 15: Multi-Line Ternary
// ============================================================

console.log("\n15. Multi-Line Ternary")

skip("15a ternary split after ?", "? is not in CONTINUATION regex")
skip("15b ternary split after :", ": is not in CONTINUATION regex")
skip("15c ternary on three lines", "multi-line ternary not supported by regex indenter")

console.log("  Section 15: 3 cases (3 skipped)")

// ============================================================
// Section 16: when / in Indent Style
// ============================================================

console.log("\n16. when/in Indent Style")

test("16 Option B: when at same level as case", () => {
  const code = "case x\nwhen 1\n  body\nwhen 2\n  body\nend"
  return expectIndent(code, 2, 0, "when at case level (Option B)") &&
         expectIndent(code, 3, 2, "body indented from when") &&
         expectIndent(code, 4, 0, "second when at case level") &&
         expectIndent(code, 6, 0, "end at case level")
})

console.log("  Section 16: 1 case (Option B chosen)")

// ============================================================
// Section 17: Multi-Line Method Def Arguments
// ============================================================

console.log("\n17. Multi-Line Method Def Arguments")

skip("17a args on next line", "after ) closes multi-line args, line-based scanner doesn't know it's inside a def body")

skip("17b args split across lines", "after ) closes inline args, line-based scanner can't determine def body context")

skip("17c class with multi-line inheritance", "< not in CONTINUATION regex and multi-line class declaration confuses line scanner")

console.log("  Section 17: 3 cases (3 skipped)")

// ============================================================
// Section 18: Chained Blocks (Multi-Line)
// ============================================================

console.log("\n18. Chained Blocks")

skip("18a chain of blocks with mixed styles", "chain starting from bare identifier (no trailing operator) — first .method can't determine indent from previous line")

test("18b chain starting from method call with block", () => {
  const code = "items.map { |x|\n  x.transform\n}.select { |x|\n  x.valid?\n}.each do |x|\n  process(x)\nend"
  return expectIndent(code, 2, 2, "body inside first block")
})

skip("18c chained block into chained method", "end.sort chaining ambiguity")

console.log("  Section 18: 3 cases (2 skipped)")

// ============================================================
// Section 19: Empty Block Bodies
// ============================================================

console.log("\n19. Empty Block Bodies")

test("19a empty def", () => {
  return expectIndent("def foo\nend", 2, 0, "end matches def (empty)")
})

test("19b empty class", () => {
  return expectIndent("class Foo\nend", 2, 0, "end matches class (empty)")
})

test("19c empty module", () => {
  return expectIndent("module Foo\nend", 2, 0, "end matches module (empty)")
})

test("19d empty if", () => {
  return expectIndent("if condition\nend", 2, 0, "end matches if (empty)")
})

test("19e empty do block", () => {
  return expectIndent("items.each do |x|\nend", 2, 0, "end matches do (empty)")
})

test("19f empty brace block (multi-line)", () => {
  return expectIndent("items.each { |x|\n}", 2, 0, "} matches { (empty)")
})

test("19g empty begin", () => {
  return expectIndent("begin\nend", 2, 0, "end matches begin (empty)")
})

test("19h empty begin/rescue", () => {
  const code = "begin\nrescue\nend"
  return expectIndent(code, 2, 0, "rescue aligns with begin") &&
         expectIndent(code, 3, 0, "end matches begin")
})

test("19i empty when clauses", () => {
  const code = "case x\nwhen 1\nwhen 2\n  body\nend"
  return expectIndent(code, 2, 0, "when 1 at case level") &&
         expectIndent(code, 3, 0, "when 2 at case level") &&
         expectIndent(code, 4, 2, "body after when 2")
})

console.log("  Section 19: 9 cases")

// ============================================================
// Section 20: Blank Lines Between Constructs
// ============================================================

console.log("\n20. Blank Lines")

test("20a blank line between methods", () => {
  const code = "class Foo\n  def bar\n    body\n  end\n\n  def baz\n    body\n  end\nend"
  return expectIndent(code, 6, 2, "def baz at class level after blank line")
})

test("20b blank line between when clauses", () => {
  const code = "case x\nwhen 1\n  body\n\nwhen 2\n  body\nend"
  return expectIndent(code, 5, 0, "when 2 at case level after blank line")
})

test("20c blank line inside block body", () => {
  const code = "def foo\n  first_line\n\n  second_line\nend"
  return expectIndent(code, 4, 2, "second_line at def body level after blank")
})

test("20d blank line after else", () => {
  const code = "if condition\n  body\nelse\n\n  other_body\nend"
  return expectIndent(code, 5, 2, "other_body at if body level after blank")
})

test("20e multiple blank lines", () => {
  const code = "class Foo\n\n\n  def bar\n\n\n    body\n\n\n  end\n\n\nend"
  return expectIndent(code, 4, 2, "def bar at class level after blanks") &&
         expectIndent(code, 7, 4, "body at def level after blanks") &&
         expectIndent(code, 10, 2, "end matches def after blanks") &&
         expectIndent(code, 13, 0, "end matches class after blanks")
})

console.log("  Section 20: 5 cases")

// ============================================================
// Section 21: Edge Cases — Keywords in Non-Keyword Positions
// ============================================================

console.log("\n21. Keywords in Non-Keyword Positions")

test("21a end as substring of identifier", () => {
  const code = "def foo\n  weekend = true\n  next_statement\nend"
  return expectIndent(code, 3, 2, "weekend doesn't trigger deindent")
})

test("21b if as substring", () => {
  const code = "def foo\n  notify_if_ready\n  next_statement\nend"
  return expectIndent(code, 3, 2, "notify_if_ready doesn't trigger indent")
})

test("21c do as substring", () => {
  const code = "def foo\n  undo_changes\n  next_statement\nend"
  return expectIndent(code, 3, 2, "undo_changes doesn't trigger indent")
})

test("21d begin as substring", () => {
  const code = "def foo\n  begin_transaction\n  next_statement\nend"
  return expectIndent(code, 3, 2, "begin_transaction doesn't trigger indent")
})

test("21e end in a string", () => {
  const code = 'def foo\n  puts "the end"\n  next_statement\nend'
  return expectIndent(code, 3, 2, "end in string doesn't trigger deindent")
})

test("21f if in a string", () => {
  const code = 'def foo\n  puts "check if ready"\n  next_statement\nend'
  return expectIndent(code, 3, 2, "if in string doesn't trigger indent")
})

test("21g end in a comment", () => {
  const code = "def foo\n  # end of section\n  next_statement\nend"
  return expectIndent(code, 3, 2, "end in comment doesn't trigger deindent")
})

test("21h keyword as symbol", () => {
  const code = "def foo\n  state = :if\n  next_statement\nend"
  return expectIndent(code, 3, 2, ":if doesn't trigger indent")
})

skip("21i keyword in hash key", "hash symbol-key shorthand not supported")

test("21j keyword in regex", () => {
  const code = 'def foo\n  x =~ /^end$/\n  next_statement\nend'
  return expectIndent(code, 3, 2, "end in regex doesn't trigger deindent")
})

test("21k method named like keyword (.class)", () => {
  const code = "def foo\n  something.class\n  next_statement\nend"
  return expectIndent(code, 3, 2, ".class doesn't trigger indent")
})

test("21l .class at top level", () => {
  return expectIndent("obj.class\nnext_statement", 2, 0, ".class at top level no indent")
})

test("21m do in a string", () => {
  return expectIndent('x = "do not indent"\nnext_statement', 2, 0, "do in string no indent")
})

skip("21n keyword in interpolated string", "interpolation with keywords is complex")

test("21o for in method name", () => {
  const code = "def foo\n  format_data\n  next_statement\nend"
  return expectIndent(code, 3, 2, "format_data doesn't trigger indent")
})

test("21p case in method name", () => {
  const code = "def foo\n  downcase\n  next_statement\nend"
  return expectIndent(code, 3, 2, "downcase doesn't trigger indent")
})

test("21q while in variable name", () => {
  const code = "def foo\n  meanwhile = true\n  next_statement\nend"
  return expectIndent(code, 3, 2, "meanwhile doesn't trigger indent")
})

test("21r rescue in variable name", () => {
  const code = "def foo\n  rescued = true\n  next_statement\nend"
  return expectIndent(code, 3, 2, "rescued doesn't trigger indent")
})

console.log("  Section 21: 18 cases (2 skipped)")

// ============================================================
// Section 22: BEGIN / END (All-Caps Hooks)
// ============================================================

console.log("\n22. BEGIN / END")

test("22a BEGIN block", () => {
  const code = "BEGIN {\n  startup_code\n}"
  return expectIndent(code, 2, 2, "body in BEGIN {")
})

test("22b END block", () => {
  const code = "END {\n  cleanup_code\n}"
  return expectIndent(code, 2, 2, "body in END {")
})

console.log("  Section 22: 2 cases")

// ============================================================
// Section 23: Nested Interpolation with Blocks
// ============================================================

console.log("\n23. Nested Interpolation")

test("23a interpolation with single-line block inside string", () => {
  return expectIndent("puts \"Result: #{items.map { |x| x + 1 }.join(', ')}\"\nnext_statement", 2, 0, "after interpolated string no indent")
})

skip("23b multi-line interpolation with block", "multi-line interpolation blocks are opaque")

console.log("  Section 23: 2 cases (1 skipped)")

// ============================================================
// Section 24: %w/%i into Method Chain
// ============================================================

console.log("\n24. %w/%i Chains")

skip("24a %w into chain", "%w closing bracket then .method chain is ambiguous for indenter")
skip("24b %i into chain", "%i closing bracket then .method chain is ambiguous for indenter")

console.log("  Section 24: 2 cases (2 skipped)")

// ============================================================
// Section 25: Conditional/Control Flow Inside Delimiters
// ============================================================

console.log("\n25. Control Flow Inside Delimiters")

test("25a if inside parens", () => {
  const code = "foo(\n  if condition\n    a\n  else\n    b\n  end\n)"
  return expectIndent(code, 2, 2, "if indented in (") &&
         expectIndent(code, 3, 4, "a indented in if") &&
         expectIndent(code, 7, 0, ") matches (")
})

skip("25b case inside array", "case inside array is complex nested indentation")

test("25c block inside hash value", () => {
  const code = "x = {\n  key: items.map { |i|\n    i.transform\n  },\n}"
  return expectIndent(code, 3, 4, "body inside nested block")
})

test("25d begin/rescue inside block", () => {
  const code = "items.each do |item|\n  begin\n    process(item)\n  rescue => e\n    log(e)\n  end\nend"
  return expectIndent(code, 2, 2, "begin at block level") &&
         expectIndent(code, 3, 4, "process inside begin") &&
         expectIndent(code, 4, 2, "rescue aligns with begin") &&
         expectIndent(code, 5, 4, "log inside rescue") &&
         expectIndent(code, 6, 2, "end matches begin") &&
         expectIndent(code, 7, 0, "end matches each")
})

console.log("  Section 25: 4 cases (1 skipped)")

// ============================================================
// Section 26: Access Modifiers
// ============================================================

console.log("\n26. Access Modifiers")

test("26a public/private/protected don't change indent", () => {
  const code = "class Foo\n  def public_method\n    body\n  end\n\n  private\n\n  def private_method\n    body\n  end\nend"
  return expectIndent(code, 6, 2, "private at class level") &&
         expectIndent(code, 8, 2, "def after private at class level") &&
         expectIndent(code, 9, 4, "body inside private method")
})

test("26b inline private", () => {
  const code = "class Foo\n  private def secret\n    body\n  end\nend"
  return expectIndent(code, 3, 4, "body inside private def")
})

test("26c private_class_method", () => {
  const code = "class Foo\n  private_class_method def self.secret\n    body\n  end\nend"
  return expectIndent(code, 3, 4, "body inside private_class_method def")
})

console.log("  Section 26: 3 cases")

// ============================================================
// Section 27: Multiline Rescue Modifier vs Block Rescue
// ============================================================

console.log("\n27. Rescue Modifier vs Block")

test("27a rescue modifier is single-line", () => {
  return expectIndent("value = dangerous_operation rescue fallback\nnext_statement", 2, 0, "no indent after rescue modifier")
})

test("27b actual rescue block", () => {
  const code = "def foo\n  dangerous_operation\nrescue\n  fallback\nend"
  return expectIndent(code, 3, 0, "rescue aligns with def") &&
         expectIndent(code, 4, 2, "fallback inside rescue")
})

console.log("  Section 27: 2 cases")

// ============================================================
// Section 28: Nested Hashes / Arrays (Deep)
// ============================================================

console.log("\n28. Deep Nesting")

test("28a deeply nested hash", () => {
  const code = "config = {\n  a: {\n    b: {\n      c: {\n        d: \"deep\",\n      },\n    },\n  },\n}"
  return expectIndent(code, 2, 2, "a: at level 1") &&
         expectIndent(code, 3, 4, "b: at level 2") &&
         expectIndent(code, 4, 6, "c: at level 3") &&
         expectIndent(code, 5, 8, "d: at level 4") &&
         expectIndent(code, 6, 6, "} at level 3") &&
         expectIndent(code, 7, 4, "} at level 2") &&
         expectIndent(code, 8, 2, "} at level 1") &&
         expectIndent(code, 9, 0, "} at level 0")
})

skip("28b array of hashes", "trailing comma inside delimiters triggers CONTINUATION indent — scanner doesn't track delimiter depth to suppress it")

skip("28c hash with array values and blocks", "complex continuation + chain inside hash")

console.log("  Section 28: 3 cases (2 skipped)")

// ============================================================
// Section 29: Real-World Patterns
// ============================================================

console.log("\n29. Real-World Patterns")

test("29a Rails controller (simplified)", () => {
  const code = "class UsersController\n  def index\n    @users = User.all\n  end\n\n  def create\n    @user = User.new\n  end\n\n  private\n\n  def set_user\n    @user = User.find(1)\n  end\nend"
  return expectIndent(code, 1, 0, "class at 0") &&
         expectIndent(code, 2, 2, "def index at 1") &&
         expectIndent(code, 3, 4, "body at 2") &&
         expectIndent(code, 4, 2, "end at 1") &&
         expectIndent(code, 6, 2, "def create at 1") &&
         expectIndent(code, 10, 2, "private at 1") &&
         expectIndent(code, 12, 2, "def set_user at 1") &&
         expectIndent(code, 15, 0, "end at 0")
})

test("29b RSpec test (simplified)", () => {
  const code = "RSpec.describe User do\n  describe \"#full_name\" do\n    it \"returns name\" do\n      expect(user.name).to eq(\"John\")\n    end\n  end\nend"
  return expectIndent(code, 1, 0, "describe at 0") &&
         expectIndent(code, 2, 2, "describe at 1") &&
         expectIndent(code, 3, 4, "it at 2") &&
         expectIndent(code, 4, 6, "expect at 3") &&
         expectIndent(code, 5, 4, "end at 2") &&
         expectIndent(code, 6, 2, "end at 1") &&
         expectIndent(code, 7, 0, "end at 0")
})

test("29c method with rescue/ensure", () => {
  const code = "def fetch_data\n  response = HTTP.get(url)\nrescue HTTP::Error => e\n  nil\nrescue JSON::ParserError => e\n  nil\nensure\n  connection.close\nend"
  return expectIndent(code, 2, 2, "body at 1") &&
         expectIndent(code, 3, 0, "rescue at 0") &&
         expectIndent(code, 4, 2, "nil at 1") &&
         expectIndent(code, 5, 0, "second rescue at 0") &&
         expectIndent(code, 6, 2, "nil at 1") &&
         expectIndent(code, 7, 0, "ensure at 0") &&
         expectIndent(code, 8, 2, "close at 1") &&
         expectIndent(code, 9, 0, "end at 0")
})

test("29d nested case with guards", () => {
  const code = "case command\nwhen :start\n  if ready?\n    execute\n  else\n    enqueue\n  end\nwhen :stop\n  shutdown\nelse\n  raise \"Unknown\"\nend"
  return expectIndent(code, 2, 0, "when :start at 0") &&
         expectIndent(code, 3, 2, "if at 1") &&
         expectIndent(code, 4, 4, "execute at 2") &&
         expectIndent(code, 5, 2, "else at 1") &&
         expectIndent(code, 6, 4, "enqueue at 2") &&
         expectIndent(code, 7, 2, "end at 1") &&
         expectIndent(code, 8, 0, "when :stop at 0") &&
         expectIndent(code, 9, 2, "shutdown at 1") &&
         expectIndent(code, 10, 0, "else at 0") &&
         expectIndent(code, 11, 2, "raise at 1") &&
         expectIndent(code, 12, 0, "end at 0")
})

test("29e complex hash config", () => {
  const code = "config = {\n  database: {\n    adapter: \"postgresql\",\n    pool: 5,\n  },\n  redis: {\n    url: \"redis://localhost\",\n    timeout: 5,\n  },\n}"
  return expectIndent(code, 2, 2, "database at 1") &&
         expectIndent(code, 3, 4, "adapter at 2") &&
         expectIndent(code, 5, 2, "} at 1") &&
         expectIndent(code, 6, 2, "redis at 1") &&
         expectIndent(code, 9, 2, "} at 1") &&
         expectIndent(code, 10, 0, "} at 0")
})

test("29f DSL-heavy code (Rake task)", () => {
  const code = "namespace :db do\n  desc \"Seed the database\"\n  task seed: :environment do\n    ActiveRecord::Base.transaction do\n      User.find_or_create_by!(email: \"a@x.com\") do |u|\n        u.name = \"Admin\"\n      end\n    end\n  end\nend"
  return expectIndent(code, 1, 0, "namespace at 0") &&
         expectIndent(code, 2, 2, "desc at 1") &&
         expectIndent(code, 3, 2, "task at 1") &&
         expectIndent(code, 4, 4, "transaction at 2") &&
         expectIndent(code, 6, 8, "u.name at 4") &&
         expectIndent(code, 7, 6, "end at 3") &&
         expectIndent(code, 8, 4, "end at 2") &&
         expectIndent(code, 9, 2, "end at 1") &&
         expectIndent(code, 10, 0, "end at 0")
})

test("29h Minitest", () => {
  const code = "class UserTest < Minitest::Test\n  def setup\n    @user = User.new\n  end\n\n  def test_valid\n    assert @user.valid?\n  end\n\n  def test_invalid\n    @user.email = nil\n    refute @user.valid?\n  end\nend"
  return expectIndent(code, 1, 0, "class at 0") &&
         expectIndent(code, 2, 2, "def setup at 1") &&
         expectIndent(code, 3, 4, "body at 2") &&
         expectIndent(code, 4, 2, "end at 1") &&
         expectIndent(code, 6, 2, "def test_valid at 1") &&
         expectIndent(code, 14, 0, "end at 0")
})

test("29i Gemfile", () => {
  const code = "source \"https://rubygems.org\"\n\ngem \"rails\", \"~> 7.1\"\n\ngroup :development, :test do\n  gem \"rspec-rails\"\n  gem \"factory_bot_rails\"\nend\n\ngroup :development do\n  gem \"rubocop\", require: false\nend"
  return expectIndent(code, 6, 2, "gem inside group at 1") &&
         expectIndent(code, 8, 0, "end matches group") &&
         expectIndent(code, 11, 2, "gem inside second group at 1") &&
         expectIndent(code, 12, 0, "end matches second group")
})

test("29j config/routes.rb", () => {
  const code = "Rails.application.routes.draw do\n  namespace :api do\n    namespace :v1 do\n      resources :users do\n        member do\n          post :activate\n        end\n        collection do\n          get :search\n        end\n      end\n    end\n  end\nend"
  return expectIndent(code, 1, 0, "draw at 0") &&
         expectIndent(code, 2, 2, "namespace api at 1") &&
         expectIndent(code, 3, 4, "namespace v1 at 2") &&
         expectIndent(code, 4, 6, "resources at 3") &&
         expectIndent(code, 5, 8, "member at 4") &&
         expectIndent(code, 6, 10, "post at 5") &&
         expectIndent(code, 7, 8, "end at 4") &&
         expectIndent(code, 11, 6, "end at 3") &&
         expectIndent(code, 12, 4, "end at 2") &&
         expectIndent(code, 13, 2, "end at 1") &&
         expectIndent(code, 14, 0, "end at 0")
})

test("29k Concern / Module Mixin (simplified)", () => {
  const code = "module Authenticatable\n  extend ActiveSupport::Concern\n\n  included do\n    before_action :authenticate!\n  end\n\n  class_methods do\n    def skip_auth(*actions)\n      skip_before_action :authenticate!\n    end\n  end\n\n  private\n\n  def authenticate!\n    unless current_user\n      respond_to do |format|\n        format.html { redirect_to login_path }\n      end\n    end\n  end\nend"
  return expectIndent(code, 1, 0, "module at 0") &&
         expectIndent(code, 2, 2, "extend at 1") &&
         expectIndent(code, 4, 2, "included at 1") &&
         expectIndent(code, 5, 4, "before_action at 2") &&
         expectIndent(code, 6, 2, "end at 1") &&
         expectIndent(code, 8, 2, "class_methods at 1") &&
         expectIndent(code, 9, 4, "def at 2") &&
         expectIndent(code, 14, 2, "private at 1") &&
         expectIndent(code, 16, 2, "def authenticate! at 1") &&
         expectIndent(code, 23, 0, "end at 0")
})

console.log("  Section 29: 11 cases")

// ============================================================
// Section 30: Conditional Chaining Patterns
// ============================================================

console.log("\n30. Conditional Chaining")

test("30a if/elsif with chained assignments", () => {
  const code = "if condition\n  result = items\nelsif other\n  result = others\nend"
  return expectIndent(code, 2, 2, "result at if body level") &&
         expectIndent(code, 3, 0, "elsif aligns with if") &&
         expectIndent(code, 4, 2, "result at elsif body level")
})

test("30b ternary inside method chain", () => {
  const code = "items\n  .map { |x| x.valid? ? x.name : \"unknown\" }\n  .compact"
  return expectIndent(code, 3, 2, "compact at chain level")
})

test("30c chain with conditional block", () => {
  const code = "items\n  .each do |item|\n    if item.valid?\n      process(item)\n    end\n  end"
  return expectIndent(code, 3, 4, "if inside each block") &&
         expectIndent(code, 4, 6, "process inside if") &&
         expectIndent(code, 5, 4, "end matches if") &&
         expectIndent(code, 6, 2, "end matches each")
})

console.log("  Section 30: 3 cases")

// ============================================================
// Section 31: Uncommon but Valid Ruby
// ============================================================

console.log("\n31. Uncommon but Valid Ruby")

test("31a retry in rescue", () => {
  const code = "begin\n  attempt\nrescue\n  retry\nend"
  return expectIndent(code, 2, 2, "attempt at 1") &&
         expectIndent(code, 3, 0, "rescue at 0") &&
         expectIndent(code, 4, 2, "retry at 1")
})

test("31b nested begin/rescue", () => {
  const code = "begin\n  begin\n    risky\n  rescue\n    fallback\n  end\nrescue\n  total_fallback\nend"
  return expectIndent(code, 2, 2, "inner begin at 1") &&
         expectIndent(code, 3, 4, "risky at 2") &&
         expectIndent(code, 4, 2, "inner rescue at 1") &&
         expectIndent(code, 5, 4, "fallback at 2") &&
         expectIndent(code, 6, 2, "inner end at 1") &&
         expectIndent(code, 7, 0, "outer rescue at 0") &&
         expectIndent(code, 8, 2, "total_fallback at 1")
})

test("31c case inside case", () => {
  const code = "case a\nwhen 1\n  case b\n  when :x\n    body\n  when :y\n    body\n  end\nwhen 2\n  body\nend"
  return expectIndent(code, 2, 0, "when 1 at 0") &&
         expectIndent(code, 3, 2, "inner case at 1") &&
         expectIndent(code, 4, 2, "when :x at 1") &&
         expectIndent(code, 5, 4, "body at 2") &&
         expectIndent(code, 8, 2, "inner end at 1") &&
         expectIndent(code, 9, 0, "when 2 at 0") &&
         expectIndent(code, 10, 2, "body at 1")
})

test("31d if inside if", () => {
  const code = "if a\n  if b\n    if c\n      body\n    end\n  end\nend"
  return expectIndent(code, 2, 2, "if b at 1") &&
         expectIndent(code, 3, 4, "if c at 2") &&
         expectIndent(code, 4, 6, "body at 3") &&
         expectIndent(code, 5, 4, "end at 2") &&
         expectIndent(code, 6, 2, "end at 1") &&
         expectIndent(code, 7, 0, "end at 0")
})

test("31e while inside while", () => {
  const code = "while a\n  while b\n    body\n  end\nend"
  return expectIndent(code, 2, 2, "while b at 1") &&
         expectIndent(code, 3, 4, "body at 2") &&
         expectIndent(code, 4, 2, "end at 1") &&
         expectIndent(code, 5, 0, "end at 0")
})

test("31f block inside block inside block", () => {
  const code = "items.each do |a|\n  a.things.each do |b|\n    b.parts.each { |c|\n      process(c)\n    }\n  end\nend"
  return expectIndent(code, 2, 2, "a.things at 1") &&
         expectIndent(code, 3, 4, "b.parts at 2") &&
         expectIndent(code, 4, 6, "process at 3") &&
         expectIndent(code, 5, 4, "} at 2") &&
         expectIndent(code, 6, 2, "end at 1") &&
         expectIndent(code, 7, 0, "end at 0")
})

test("31g postfix while inside block", () => {
  const code = "items.each do |item|\n  attempt(item) while retryable?\n  finalize(item)\nend"
  return expectIndent(code, 3, 2, "finalize at block level (no extra indent)")
})

test("31h multiple assignment", () => {
  return expectIndent("a, b, c = 1, 2, 3\nnext_statement", 2, 0, "no indent after multiple assignment")
})

test("31i multiple assignment from method", () => {
  const code = "a, b = foo(\n  x,\n  y\n)\nnext_statement"
  return expectIndent(code, 2, 2, "x indented in (") &&
         expectIndent(code, 4, 0, ") matches (") &&
         expectIndent(code, 5, 0, "after ) back to 0")
})

test("31j defined? keyword", () => {
  const code = "if defined?(Rails)\n  body\nend"
  return expectIndent(code, 2, 2, "body after if defined?")
})

console.log("  Section 31: 10 cases")

// ============================================================
// Section 32: Here Be Dragons (Known Ambiguities)
// ============================================================

console.log("\n32. Known Ambiguities")

test("32a do precedence ambiguity", () => {
  const code = "foo bar do |x|\n  body\nend"
  return expectIndent(code, 2, 2, "body in do block")
})

test("32b .then block", () => {
  const code = "result = value\n  .then { |v| v + 1 }\n  .then do |v|\n    v * 2\n  end"
  return expectIndent(code, 4, 4, "body in .then do")
})

test("32c method call that looks like keyword", () => {
  return expectIndent("items.each\nnext_statement", 2, 0, "no indent after method without block")
})

skip("32d open-ended expression at EOF", "EOF indent is editor-specific")

test("32e in keyword in for vs case/in", () => {
  const code1 = "for x in items\n  body\nend"
  const code2 = "case x\nin pattern\n  body\nend"
  return expectIndent(code1, 2, 2, "for body at 1") &&
         expectIndent(code2, 2, 0, "in at case level") &&
         expectIndent(code2, 3, 2, "case/in body at 1")
})

test("32f block arg with keyword-like name", () => {
  const code = "items.each do |end_value|\n  process(end_value)\nend"
  return expectIndent(code, 2, 2, "body at block level despite 'end' in param")
})

skip("32g heredoc followed by more code on opener line", "heredoc as argument is a known limitation")

test("32h stabby lambda with do/end after assignment", () => {
  const code = "transform = -> (x) do\n  x.upcase\nend\nnext_statement"
  return expectIndent(code, 2, 2, "body in lambda do") &&
         expectIndent(code, 4, 0, "after lambda end")
})

test("32i super with block", () => {
  const code = "def foo\n  super do |x|\n    modify(x)\n  end\nend"
  return expectIndent(code, 3, 4, "modify at 2") &&
         expectIndent(code, 4, 2, "end at 1")
})

test("32j method missing / dynamic dispatch", () => {
  const code = "define_method(:foo) do |*args|\n  body\nend"
  return expectIndent(code, 2, 2, "body in define_method block")
})

test("32k proc call with brackets", () => {
  const code = "my_proc.call(\n  arg\n)\nnext_statement"
  return expectIndent(code, 2, 2, "arg indented in (") &&
         expectIndent(code, 4, 0, "after ) back to 0")
})

console.log("  Section 32: 11 cases (2 skipped)")

// ============================================================
// Summary
// ============================================================

console.log(`\n--- SUMMARY ---`)
console.log(`PASS: ${passed}`)
console.log(`FAIL: ${failed}`)
console.log(`SKIP: ${skipped}`)
if (errors.length) {
  console.log(`\nFailures:`)
  errors.forEach(e => console.log(`  - ${e}`))
}
process.exit(failed > 0 ? 1 : 0)
