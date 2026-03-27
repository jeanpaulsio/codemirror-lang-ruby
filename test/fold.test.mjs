// Code folding tests for Ruby CodeMirror language support
// Tests that foldNodeProp returns correct fold ranges

import {ruby} from "../dist/index.js"
import {EditorState} from "@codemirror/state"
import {syntaxTree, foldable} from "@codemirror/language"

let passed = 0
let failed = 0
let errors = []

// Helper: create state and find fold range at a given line
function getFoldAt(code, lineNumber) {
  const state = EditorState.create({
    doc: code,
    extensions: [ruby()],
  })
  const tree = syntaxTree(state)
  // Force full parse
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

// ============================================================
// 2.1 Method Definition
// ============================================================

console.log("\n2.1 Method Definition")

test("def folds body", () => {
  const code = "def foo\n  body\n  more_body\nend"
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range"); return false }
  return true
})

test("def with args folds body", () => {
  const code = "def foo(x, y)\n  body\nend"
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range"); return false }
  return true
})

// ============================================================
// 2.2 Class / Module
// ============================================================

console.log("\n2.2 Class / Module")

test("class folds body", () => {
  const code = "class Foo\n  body\nend"
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range"); return false }
  return true
})

test("class with inheritance folds body", () => {
  const code = "class Foo < Bar\n  body\nend"
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range"); return false }
  return true
})

test("module folds body", () => {
  const code = "module Foo\n  body\nend"
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range"); return false }
  return true
})

// ============================================================
// 2.3 Conditionals
// ============================================================

console.log("\n2.3 Conditionals")

test("if statement is foldable", () => {
  const code = "if condition\n  body\nend"
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range"); return false }
  return true
})

test("unless statement is foldable", () => {
  const code = "unless condition\n  body\nend"
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range"); return false }
  return true
})

test("case statement is foldable", () => {
  const code = "case x\nwhen 1\n  body\nwhen 2\n  body\nend"
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range"); return false }
  return true
})

// ============================================================
// 2.4 Loops
// ============================================================

console.log("\n2.4 Loops")

test("while loop is foldable", () => {
  const code = "while condition\n  body\nend"
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range"); return false }
  return true
})

test("until loop is foldable", () => {
  const code = "until condition\n  body\nend"
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range"); return false }
  return true
})

test("for loop is foldable", () => {
  const code = "for x in items\n  body\nend"
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range"); return false }
  return true
})

// ============================================================
// 2.5 Blocks
// ============================================================

console.log("\n2.5 Blocks")

test("do/end block is foldable", () => {
  const code = "items.each do |x|\n  body\nend"
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range"); return false }
  return true
})

test("brace block is foldable", () => {
  const code = "items.each { |x|\n  body\n}"
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range"); return false }
  return true
})

// ============================================================
// 2.6 Begin/Rescue
// ============================================================

console.log("\n2.6 Begin/Rescue")

test("begin block is foldable", () => {
  const code = "begin\n  body\nrescue => e\n  handle\nensure\n  cleanup\nend"
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range"); return false }
  return true
})

// ============================================================
// 2.7 Strings
// ============================================================

console.log("\n2.7 Strings")

test("multi-line string is foldable", () => {
  const code = '"line1\nline2\nline3"'
  const range = getFoldAt(code, 1)
  if (!range) { console.log("  FAIL: no fold range"); return false }
  return true
})

// ============================================================
// 2.8 Nested Folds
// ============================================================

console.log("\n2.8 Nested Folds")

test("nested class/def/if all foldable", () => {
  const code = "class Foo\n  def bar\n    if condition\n      body\n    end\n  end\nend"
  const classRange = getFoldAt(code, 1)
  const defRange = getFoldAt(code, 2)
  const ifRange = getFoldAt(code, 3)
  if (!classRange) { console.log("  FAIL: class not foldable"); return false }
  if (!defRange) { console.log("  FAIL: def not foldable"); return false }
  if (!ifRange) { console.log("  FAIL: if not foldable"); return false }
  return true
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
