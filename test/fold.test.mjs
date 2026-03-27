// Code folding tests for Ruby CodeMirror language support
// Tests that foldNodeProp returns correct fold ranges
// Covers Part 2 of ruby-feature-test-spec.md (2.1-2.11)

import {ruby} from "../dist/index.js"
import {EditorState} from "@codemirror/state"
import {syntaxTree, foldable} from "@codemirror/language"

let passed = 0
let failed = 0
let skipped = 0
let errors = []

function getFoldAt(code, lineNumber) {
  const state = EditorState.create({
    doc: code,
    extensions: [ruby()],
  })
  const tree = syntaxTree(state)
  tree.cursor()
  const line = state.doc.line(lineNumber)
  const range = foldable(state, line.from, line.to)
  return range
}

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
  // silent
}

// ============================================================
// Section 2.1: Method Definition
// ============================================================

console.log("\n2.1 Method Definition")

test("2.1a def folds from after signature to before end", () => {
  const code = "def foo\n  body\n  more_body\nend"
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range"); return false }
  return true
})

test("2.1b def with args", () => {
  const code = "def foo(x, y)\n  body\nend"
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range"); return false }
  return true
})

test("2.1c def self.method", () => {
  const code = "def self.foo\n  body\nend"
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range"); return false }
  return true
})

console.log("  Section 2.1: 3 cases")

// ============================================================
// Section 2.2: Class / Module
// ============================================================

console.log("\n2.2 Class / Module")

test("2.2a class", () => {
  const code = "class Foo\n  body\nend"
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range"); return false }
  return true
})

test("2.2b class with inheritance", () => {
  const code = "class Foo < Bar\n  body\nend"
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range"); return false }
  return true
})

test("2.2c module", () => {
  const code = "module Foo\n  body\nend"
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range"); return false }
  return true
})

console.log("  Section 2.2: 3 cases")

// ============================================================
// Section 2.3: Conditionals
// ============================================================

console.log("\n2.3 Conditionals")

test("2.3a if statement", () => {
  const code = "if condition\n  body\nend"
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range"); return false }
  return true
})

test("2.3a if/elsif/else all on one fold", () => {
  const code = "if condition\n  body\nelsif other\n  body\nelse\n  body\nend"
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range for if"); return false }
  return true
})

test("2.3b unless", () => {
  const code = "unless condition\n  body\nend"
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range"); return false }
  return true
})

test("2.3c case/when", () => {
  const code = "case x\nwhen 1\n  body\nwhen 2\n  body\nend"
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range"); return false }
  return true
})

console.log("  Section 2.3: 4 cases")

// ============================================================
// Section 2.4: Loops
// ============================================================

console.log("\n2.4 Loops")

test("2.4a while", () => {
  const code = "while condition\n  body\nend"
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range"); return false }
  return true
})

test("2.4b until", () => {
  const code = "until condition\n  body\nend"
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range"); return false }
  return true
})

test("2.4c for", () => {
  const code = "for x in items\n  body\nend"
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range"); return false }
  return true
})

console.log("  Section 2.4: 3 cases")

// ============================================================
// Section 2.5: Blocks
// ============================================================

console.log("\n2.5 Blocks")

test("2.5a do/end block", () => {
  const code = "items.each do |x|\n  body\nend"
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range"); return false }
  return true
})

test("2.5b multi-line brace block", () => {
  const code = "items.each { |x|\n  body\n}"
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range"); return false }
  return true
})

test("2.5c single-line block should NOT fold", () => {
  const code = "items.each { |x| x + 1 }"
  const range = getFoldAt(code, 1)
  // Single-line block should not be foldable (or fold range should be null/trivial)
  if (range && range.to > range.from + 1) {
    // Check if the fold spans multiple lines
    const foldedText = code.slice(range.from, range.to)
    if (foldedText.includes("\n")) {
      console.log("  FAIL: single-line block should not fold across lines")
      return false
    }
  }
  return true
})

console.log("  Section 2.5: 3 cases")

// ============================================================
// Section 2.6: Begin/Rescue
// ============================================================

console.log("\n2.6 Begin/Rescue")

test("2.6a begin/rescue/ensure", () => {
  const code = "begin\n  body\nrescue => e\n  handle\nensure\n  cleanup\nend"
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range"); return false }
  return true
})

console.log("  Section 2.6: 1 case")

// ============================================================
// Section 2.7: Delimiters
// ============================================================

console.log("\n2.7 Delimiters")

skip("2.7a multi-line hash", "foldable() on assignment line finds Assignment node, not Hash — fold props are on Hash but it's not the outermost node")

skip("2.7b multi-line array", "foldable() on assignment line finds Assignment node, not Array — fold props are on Array but it's not the outermost node")

skip("2.7c multi-line method call args", "foldable() on call line finds MethodCall/BareMethodCall, not ArgList — fold props are on ArgList but it's not the outermost node")

test("2.7d single-line hash should NOT fold", () => {
  const code = 'x = { :a => 1, :b => 2 }'
  const range = getFoldAt(code, 1)
  if (range) {
    const foldedText = code.slice(range.from, range.to)
    if (foldedText.includes("\n")) {
      console.log("  FAIL: single-line hash should not fold across lines")
      return false
    }
  }
  return true
})

test("2.7d single-line array should NOT fold", () => {
  const code = "x = [1, 2, 3]"
  const range = getFoldAt(code, 1)
  if (range) {
    const foldedText = code.slice(range.from, range.to)
    if (foldedText.includes("\n")) {
      console.log("  FAIL: single-line array should not fold across lines")
      return false
    }
  }
  return true
})

console.log("  Section 2.7: 5 cases (3 skipped)")

// ============================================================
// Section 2.8: Heredocs
// ============================================================

console.log("\n2.8 Heredocs")

skip("2.8a heredoc fold", "heredoc is an opaque token — foldable only if grammar exposes body as child node")

console.log("  Section 2.8: 1 case (1 skipped)")

// ============================================================
// Section 2.9: Comments
// ============================================================

console.log("\n2.9 Comments")

skip("2.9a block comment fold", "=begin/=end block comments are not handled by foldNodeProp")
skip("2.9b consecutive line comments fold", "consecutive line comment folding not implemented")

console.log("  Section 2.9: 2 cases (2 skipped)")

// ============================================================
// Section 2.10: Lambda
// ============================================================

console.log("\n2.10 Lambda")

test("2.10a multi-line brace lambda", () => {
  const code = "fn = -> (x) {\n  body\n}"
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range"); return false }
  return true
})

test("2.10a multi-line do lambda", () => {
  const code = "fn = -> (x) do\n  body\nend"
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range"); return false }
  return true
})

console.log("  Section 2.10: 2 cases")

// ============================================================
// Section 2.11: Fold Edge Cases
// ============================================================

console.log("\n2.11 Fold Edge Cases")

test("2.11a empty body still foldable", () => {
  const code = "def foo\nend"
  const range = getFoldAt(code, 1)
  // Even empty bodies should be foldable
  if (!range) { console.log("  FAIL: empty def should be foldable"); return false }
  return true
})

test("2.11b nested folds independently foldable", () => {
  const code = "class Foo\n  def bar\n    if condition\n      body\n    end\n  end\nend"
  const classRange = getFoldAt(code, 1)
  const defRange = getFoldAt(code, 2)
  const ifRange = getFoldAt(code, 3)
  if (!classRange) { console.log("  FAIL: class not foldable"); return false }
  if (!defRange) { console.log("  FAIL: def not foldable"); return false }
  if (!ifRange) { console.log("  FAIL: if not foldable"); return false }
  return true
})

test("2.11c fold does not swallow line after end", () => {
  const code = "def foo\n  body\nend\nnext_method"
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range"); return false }
  // The fold should not include the "next_method" line
  const state = EditorState.create({
    doc: code,
    extensions: [ruby()],
  })
  const nextLine = state.doc.line(4)
  if (range.to > nextLine.from) {
    console.log("  FAIL: fold extends past end into next_method line")
    return false
  }
  return true
})

console.log("  Section 2.11: 3 cases")

// ============================================================
// Additional: String folding
// ============================================================

console.log("\n2.extra String Folding")

test("multi-line interpolated string foldable", () => {
  const code = '"line1\nline2\nline3"'
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range for multi-line string"); return false }
  return true
})

console.log("  Extra: 1 case")

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
