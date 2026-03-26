// Comprehensive Ruby indentation tests — covers all 18 sections
// Run with: node test/indent-test.mjs

import {EditorState} from "@codemirror/state"
import {getIndentation} from "@codemirror/language"
import {ruby} from "../dist/index.js"

let pass = 0, fail = 0

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
test("1.1f singleton method", "def obj.foo\n", 2, 2)

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
test("1.7d chained method with do", "items.each_with_object({}) do |(k, v), acc|\n", 2, 2)
test("1.7e tap do", "obj.tap do |o|\n", 2, 2)

// 1.8 Blocks (braces) and brackets
test("1.8a brace block", "items.each { |x|\n", 2, 2)
test("1.8b hash literal", "x = {\n", 2, 2)
test("1.8c array literal", "x = [\n", 2, 2)
test("1.8d method call open paren", "foo(\n", 2, 2)

// ============================================================
// 2. Mid-Block Keywords → Deindent Current, Indent Next
// ============================================================

// 2.1 else
test("2.1a else deindent", "if condition\n  body\nelse", 3, 0)
test("2.1a else body indent", "if condition\n  body\nelse\n", 4, 2)
test("2.1b unless/else deindent", "unless condition\n  body\nelse", 3, 0)
test("2.1b unless/else body indent", "unless condition\n  body\nelse\n", 4, 2)

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
test("2.4c rescue with exception class", "begin\n  body\nrescue StandardError => e", 3, 0)
test("2.4d multiple rescues", "begin\n  body\nrescue TypeError\n  handle\nrescue RuntimeError", 5, 0)

// 2.5 ensure
test("2.5a ensure deindent", "begin\n  body\nrescue => e\n  handle\nensure", 5, 0)
test("2.5a ensure body indent", "begin\n  body\nrescue => e\n  handle\nensure\n", 6, 2)
test("2.5b ensure in def deindent", "def foo\n  body\nensure", 3, 0)
test("2.5b ensure in def body indent", "def foo\n  body\nensure\n", 4, 2)

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
// 4. Closing Delimiters → Deindent to Matching Open
// (handled by delimitedIndent — verify it works)
// ============================================================

test("4a closing brace", "items.each { |x|\n  body\n}", 3, 0)
test("4b closing bracket", "x = [\n  1,\n  2,\n]", 4, 0)
test("4c closing paren", "foo(\n  arg1,\n  arg2,\n)", 4, 0)

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
test("6d class > def > end", "class Foo\n  def bar\n    body\n  end\n", 5, 2)
test("6e class > end", "class Foo\n  def bar\n    body\n  end\nend\n", 6, 0)
test("6f nested class+def continuation", "class Foo\n  def bar\n    x\n", 4, 4)

// ============================================================
// 7. Modifier Forms → NO Indent Change
// ============================================================

test("7a modifier if", "return x if condition\n", 2, 0)
test("7b modifier unless", "do_something unless condition\n", 2, 0)
test("7c modifier while", "sleep 1 while condition\n", 2, 0)
test("7d modifier until", "retry until condition\n", 2, 0)
test("7e modifier rescue", "value = foo rescue default\n", 2, 0)
test("7f ternary", "x = condition ? a : b\n", 2, 0)

// ============================================================
// 8. One-Line Bodies → NO Indent Change
// ============================================================

test("8a single-line if then end", "if condition then body end\n", 2, 0)
test("8b single-line class", "class Foo; end\n", 2, 0)
test("8c single-line def", "def foo; body; end\n", 2, 0)
test("8d single-line block braces", "items.each { |x| x + 1 }\n", 2, 0)
test("8e single-line do end", "items.each do |x| x + 1 end\n", 2, 0)
test("8f endless method", "def foo(x) = x + 1\n", 2, 0)
test("8g single-line array", "x = [1, 2, 3]\n", 2, 0)
test("8h single-line hash", "x = { a: 1, b: 2 }\n", 2, 0)
test("8i single-line call", "foo(a, b, c)\n", 2, 0)

// ============================================================
// 9. Heredocs → NO Auto-Indent Inside
// (Heredocs are opaque tokens — indent should maintain level)
// ============================================================

test("9a after heredoc", "x = <<~HEREDOC\n  content\nHEREDOC\n", 4, 0)

// ============================================================
// 10. Multi-Line Expressions / Continuation
// ============================================================

// 10.1 Method Chaining — trailing dot
test("10.1a trailing dot indent", "foo\n  .bar\n", 3, 2)
test("10.1b trailing dot chain ends", "foo\n  .bar\n  .baz\nnext_statement\n", 4, 0)

// 10.2 Trailing Operators
test("10.2a trailing +", "x = 1 +\n", 2, 2)
test("10.2b trailing &&", "if a &&\n", 2, 2)
test("10.2c trailing ||", "x = foo ||\n", 2, 2)

// 10.3 Backslash Continuation
test("10.3a backslash continuation", "x = 1 + \\\n", 2, 2)

// 10.4 Trailing Comma
test("10.4a trailing comma", "foo a,\n", 2, 2)

// ============================================================
// 11. Lambda / Proc
// ============================================================

test("11a stabby lambda brace", "fn = -> (x) {\n", 2, 2)
test("11b stabby lambda do", "fn = -> (x) do\n", 2, 2)
test("11c single-line lambda no indent", "fn = -> (x) { x + 1 }\n", 2, 0)
test("11d Proc.new do", "fn = Proc.new do |x|\n", 2, 2)
test("11e lambda do", "fn = lambda do |x|\n", 2, 2)

// ============================================================
// 12. String Literals → NO Auto-Indent Inside
// (Strings are opaque — maintain level after closing)
// ============================================================

test("12a after multi-line double-quoted string", "x = \"hello\nworld\"\n", 3, 0)

// ============================================================
// 13. Assignment with Block Openers
// ============================================================

test("13a assign if", "x = if condition\n", 2, 2)
test("13b assign case", "x = case y\n", 2, 2)
test("13c assign begin", "x = begin\n", 2, 2)

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

// ============================================================
// 15. Edge Cases / Tricky Bits
// ============================================================

test("15a weekend variable", "def foo\n  weekend = true\n", 3, 2)
test("15b end in string", "def foo\n  puts \"the end\"\n", 3, 2)
test("15c if in string", "def foo\n  puts \"if you say so\"\n", 3, 2)
test("15d comment with keyword", "def foo\n  # if this happens\n", 3, 2)
test("15e keyword in symbol", "def foo\n  state = :if\n", 3, 2)
test("15i empty line preserves context", "class Foo\n  def bar\n    body\n\n", 5, 4)
test("15j do in string", "x = \"do not indent\"\n", 2, 0)

// ============================================================
// 16. when/in Indent Style (Option B — same level as case)
// ============================================================

test("16a when at case level", "case x\nwhen 1\n  body\nwhen 2", 4, 0)
test("16b when body indents from when", "case x\nwhen 1\n", 3, 2)

// ============================================================
// 17. Multi-Line Method Def Arguments
// ============================================================

test("17a def args on next line", "def foo(\n", 2, 2)
test("17b def args split", "def foo(arg1,\n", 2, 2)

// ============================================================
// 18. Conditional Assignment with Blocks
// ============================================================

test("18a ||= begin", "@foo ||= begin\n", 2, 2)
test("18b &&= with open paren", "@foo &&= transform(\n", 2, 2)

console.log(`\n${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
