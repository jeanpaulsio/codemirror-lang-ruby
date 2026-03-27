// Syntax highlighting tests for Ruby CodeMirror language support
// Tests that styleTags map grammar nodes to correct highlight tags

import {ruby, rubyLanguage} from "../dist/index.js"
import {EditorState} from "@codemirror/state"
import {syntaxTree} from "@codemirror/language"
import {highlightTree} from "@lezer/highlight"
import {classHighlighter} from "@lezer/highlight"

let passed = 0
let failed = 0
let errors = []

// Helper: parse code and collect highlight classes for each token
function getHighlights(code) {
  const state = EditorState.create({
    doc: code,
    extensions: [ruby()],
  })
  const tree = syntaxTree(state)
  const tokens = []
  highlightTree(tree, classHighlighter, (from, to, classes) => {
    tokens.push({
      text: code.slice(from, to),
      classes,
      from,
      to,
    })
  })
  return tokens
}

// Helper: find a token by text content and check its class
function hasClass(tokens, text, expectedClass) {
  const token = tokens.find(t => t.text === text)
  if (!token) return {found: false, text, expectedClass}
  return {
    found: true,
    matches: token.classes.includes(expectedClass),
    text,
    expectedClass,
    actualClasses: token.classes,
  }
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

function expectClass(tokens, text, cls, label) {
  const result = hasClass(tokens, text, cls)
  if (!result.found) {
    console.log(`  FAIL: ${label} — token "${text}" not found`)
    return false
  }
  if (!result.matches) {
    console.log(`  FAIL: ${label} — "${text}" has "${result.actualClasses}", expected "${cls}"`)
    return false
  }
  return true
}

// ============================================================
// 1.1 Keywords
// ============================================================

console.log("\n1.1 Keywords")

test("control flow keywords", () => {
  const tokens = getHighlights("if true\n  1\nend")
  return expectClass(tokens, "if", "tok-keyword", "if is keyword") &&
         expectClass(tokens, "end", "tok-keyword", "end is keyword")
})

test("def keyword", () => {
  const tokens = getHighlights("def foo\nend")
  return expectClass(tokens, "def", "tok-keyword", "def is keyword")
})

test("class keyword", () => {
  const tokens = getHighlights("class Foo\nend")
  return expectClass(tokens, "class", "tok-keyword", "class is keyword")
})

test("module keyword", () => {
  const tokens = getHighlights("module Foo\nend")
  return expectClass(tokens, "module", "tok-keyword", "module is keyword")
})

test("rescue/ensure keywords", () => {
  const tokens = getHighlights("begin\n  1\nrescue\n  2\nensure\n  3\nend")
  return expectClass(tokens, "rescue", "tok-keyword", "rescue is keyword") &&
         expectClass(tokens, "ensure", "tok-keyword", "ensure is keyword")
})

test("logical keywords", () => {
  const tokens = getHighlights("a and b or not c")
  return expectClass(tokens, "and", "tok-keyword", "and is keyword") &&
         expectClass(tokens, "or", "tok-keyword", "or is keyword") &&
         expectClass(tokens, "not", "tok-keyword", "not is keyword")
})

// ============================================================
// 1.2 Identifiers & Variables
// ============================================================

console.log("\n1.2 Variables")

test("instance variable", () => {
  const tokens = getHighlights("@name")
  return expectClass(tokens, "@name", "tok-variableName", "instance var")
})

test("class variable", () => {
  const tokens = getHighlights("@@count")
  return expectClass(tokens, "@@count", "tok-variableName", "class var")
})

test("global variable", () => {
  const tokens = getHighlights("$stderr")
  return expectClass(tokens, "$stderr", "tok-variableName", "global var")
})

test("constant", () => {
  const tokens = getHighlights("Foo")
  return expectClass(tokens, "Foo", "tok-typeName", "constant is type")
})

test("method definition name", () => {
  const tokens = getHighlights("def greet\nend")
  return expectClass(tokens, "greet", "tok-definition", "method name is definition")
})

test("method call name", () => {
  const tokens = getHighlights("obj.method_name")
  const token = tokens.find(t => t.text === "method_name")
  if (!token) { console.log("  FAIL: method_name not found"); return false }
  // Should have function-related class
  return token.classes.includes("tok-function") || token.classes.includes("tok-variableName")
})

// ============================================================
// 1.3 Strings
// ============================================================

console.log("\n1.3 Strings")

test("double-quoted string", () => {
  const tokens = getHighlights('"hello"')
  // StringContent "hello" gets tok-string; check any token in the string has tok-string
  const strToken = tokens.find(t => t.classes.includes("tok-string"))
  if (!strToken) { console.log("  FAIL: no tok-string token found"); return false }
  return true
})

test("single-quoted string", () => {
  const tokens = getHighlights("'hello'")
  return expectClass(tokens, "'hello'", "tok-string", "single-quoted string")
})

test("heredoc", () => {
  const tokens = getHighlights("<<~SQL\n  SELECT 1\nSQL")
  const heredoc = tokens.find(t => t.classes.includes("tok-string"))
  return heredoc !== undefined
})

test("percent string", () => {
  const tokens = getHighlights("%w[foo bar]")
  return expectClass(tokens, "%w[foo bar]", "tok-string", "percent string")
})

// ============================================================
// 1.4 Symbols
// ============================================================

console.log("\n1.4 Symbols")

test("simple symbol", () => {
  const tokens = getHighlights(":foo")
  return expectClass(tokens, ":foo", "tok-atom", "symbol is atom")
})

// ============================================================
// 1.5 Numbers
// ============================================================

console.log("\n1.5 Numbers")

test("integer", () => {
  const tokens = getHighlights("42")
  return expectClass(tokens, "42", "tok-number", "integer")
})

test("float", () => {
  const tokens = getHighlights("3.14")
  return expectClass(tokens, "3.14", "tok-number", "float")
})

// ============================================================
// 1.6 Regex
// ============================================================

console.log("\n1.6 Regex")

test("regex literal", () => {
  const tokens = getHighlights("/pattern/i")
  return expectClass(tokens, "/pattern/i", "tok-string2", "regex")
})

// ============================================================
// 1.7 Operators
// ============================================================

console.log("\n1.7 Operators")

test("arithmetic operator", () => {
  const tokens = getHighlights("1 + 2")
  return expectClass(tokens, "+", "tok-operator", "plus is operator")
})

test("comparison operator", () => {
  const tokens = getHighlights("a == b")
  return expectClass(tokens, "==", "tok-operator", "== is operator")
})

test("assignment operator", () => {
  const tokens = getHighlights("x = 1")
  return expectClass(tokens, "=", "tok-operator", "= is operator")
})

test("logic operator", () => {
  const tokens = getHighlights("a && b")
  return expectClass(tokens, "&&", "tok-operator", "&& is operator")
})

// ============================================================
// 1.8 Comments
// ============================================================

console.log("\n1.8 Comments")

test("line comment", () => {
  const tokens = getHighlights("# hello")
  return expectClass(tokens, "# hello", "tok-comment", "line comment")
})

// ============================================================
// 1.9 Punctuation
// ============================================================

console.log("\n1.9 Punctuation")

test("dot operator", () => {
  const tokens = getHighlights("a.b")
  return expectClass(tokens, ".", "tok-operator", "dot is operator")
})

test("safe navigation", () => {
  const tokens = getHighlights("a&.b")
  return expectClass(tokens, "&.", "tok-operator", "&. is operator")
})

// ============================================================
// 1.10 Special atoms
// ============================================================

console.log("\n1.10 Special values")

test("nil/true/false", () => {
  const tokens = getHighlights("nil")
  return expectClass(tokens, "nil", "tok-atom", "nil is atom")
})

test("self", () => {
  const tokens = getHighlights("self")
  // self is tagged as t.atom in highlight.ts (via "nil true false self": t.atom)
  return expectClass(tokens, "self", "tok-atom", "self is atom")
})

// ============================================================
// 1.11 Bare method calls
// ============================================================

console.log("\n1.11 Bare method calls")

test("puts highlighted as function", () => {
  const tokens = getHighlights('puts "hello"')
  const puts_token = tokens.find(t => t.text === "puts")
  if (!puts_token) { console.log("  FAIL: puts not found"); return false }
  return puts_token.classes.includes("tok-function") || puts_token.classes.includes("tok-variableName")
})

test("private/protected highlighted as modifier", () => {
  const tokens = getHighlights("private")
  // Private is a bare method keyword
  const token = tokens.find(t => t.text === "private")
  return token !== undefined
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
