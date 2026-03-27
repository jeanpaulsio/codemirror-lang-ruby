// Autocompletion tests for Ruby CodeMirror language support
// Tests that keyword completion provides correct suggestions

import {ruby, rubyLanguage} from "../dist/index.js"
import {EditorState} from "@codemirror/state"
import {CompletionContext} from "@codemirror/autocomplete"
import {syntaxTree} from "@codemirror/language"

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

// Helper: get completions at cursor position (marked by |)
async function getCompletions(codeWithCursor) {
  const pos = codeWithCursor.indexOf("|")
  const code = codeWithCursor.slice(0, pos) + codeWithCursor.slice(pos + 1)

  const state = EditorState.create({
    doc: code,
    extensions: [ruby()],
  })

  // Force parse
  syntaxTree(state)

  const ctx = new CompletionContext(state, pos, false)
  // Get the autocomplete function from languageData
  const completions = rubyLanguage.data.of({})
  // Try to get completions through the language support
  const source = state.languageDataAt("autocomplete", pos)
  const results = []
  for (const src of source) {
    const result = await src(ctx)
    if (result) results.push(result)
  }
  return results.flatMap(r => r.options || [])
}

// Helper: check if completions include expected labels
async function hasCompletions(codeWithCursor, expectedLabels) {
  const options = await getCompletions(codeWithCursor)
  const labels = options.map(o => o.label)
  for (const expected of expectedLabels) {
    if (!labels.includes(expected)) {
      console.log(`  Missing: "${expected}" in [${labels.join(", ")}]`)
      return false
    }
  }
  return true
}

// ============================================================
// 6.1 Keyword Completion
// ============================================================

console.log("\n6.1 Keyword Completion")

test("'de' suggests def and defined?", async () => {
  return await hasCompletions("de|", ["def", "defined?"])
})

test("'cl' suggests class", async () => {
  return await hasCompletions("cl|", ["class"])
})

test("'un' suggests unless and until", async () => {
  return await hasCompletions("un|", ["unless", "until"])
})

test("'re' suggests rescue, return, retry, require", async () => {
  return await hasCompletions("re|", ["rescue", "return", "retry", "require"])
})

test("'do' suggests do", async () => {
  return await hasCompletions("do|", ["do"])
})

test("'be' suggests begin", async () => {
  return await hasCompletions("be|", ["begin"])
})

test("'wh' suggests while and when", async () => {
  return await hasCompletions("wh|", ["while", "when"])
})

test("'yi' suggests yield", async () => {
  return await hasCompletions("yi|", ["yield"])
})

test("'mo' suggests module", async () => {
  return await hasCompletions("mo|", ["module"])
})

// ============================================================
// 6.3 Full Keyword List Check
// ============================================================

console.log("\n6.3 Keyword List")

test("all 31 keywords present in completion set", async () => {
  // Get all completions by checking with empty prefix won't work,
  // so check specific prefixes to cover all keywords
  const prefixes = [
    "de|", "cl|", "mo|", "if|", "el|", "un|", "ca|", "wh|", "in|",
    "fo|", "do|", "be|", "re|", "en|", "ra|", "br|", "ne|", "yi|",
    "se|", "su|", "ni|", "tr|", "fa|", "an|", "or|", "no|", "pr|",
    "pu|", "at|", "la|",
  ]
  const allLabels = new Set()
  for (const prefix of prefixes) {
    const options = await getCompletions(prefix)
    for (const o of options) allLabels.add(o.label)
  }
  if (allLabels.size < 31) {
    console.log(`  Only ${allLabels.size} keywords found: ${[...allLabels].sort().join(", ")}`)
    return false
  }
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
