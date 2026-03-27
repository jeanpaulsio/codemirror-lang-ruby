import {parser} from "./syntax.grammar"
import {
  LRLanguage, LanguageSupport,
  indentNodeProp, foldNodeProp, foldInside,
  delimitedIndent, indentService, IndentContext
} from "@codemirror/language"
import {completeFromList} from "@codemirror/autocomplete"
import {rubyHighlighting} from "./highlight"

const rubyCompletion = completeFromList([
  {label: "def", type: "keyword"},
  {label: "end", type: "keyword"},
  {label: "class", type: "keyword"},
  {label: "module", type: "keyword"},
  {label: "if", type: "keyword"},
  {label: "elsif", type: "keyword"},
  {label: "else", type: "keyword"},
  {label: "unless", type: "keyword"},
  {label: "case", type: "keyword"},
  {label: "when", type: "keyword"},
  {label: "in", type: "keyword"},
  {label: "while", type: "keyword"},
  {label: "until", type: "keyword"},
  {label: "for", type: "keyword"},
  {label: "do", type: "keyword"},
  {label: "begin", type: "keyword"},
  {label: "rescue", type: "keyword"},
  {label: "ensure", type: "keyword"},
  {label: "raise", type: "keyword"},
  {label: "return", type: "keyword"},
  {label: "yield", type: "keyword"},
  {label: "and", type: "keyword"},
  {label: "or", type: "keyword"},
  {label: "not", type: "keyword"},
  {label: "nil", type: "constant"},
  {label: "true", type: "constant"},
  {label: "false", type: "constant"},
  {label: "self", type: "constant"},
  {label: "then", type: "keyword"},
  {label: "break", type: "keyword"},
  {label: "next", type: "keyword"},
])

// Block-opening keyword at line start (or after `=` for assignment forms)
const INDENT_KEYWORD = /\b(def|class|module|if|unless|while|until|for|case|begin)\b/
const INDENT_AFTER = /^\s*(?:(?:private|protected|public|private_class_method|public_class_method)\s+)?(def|class|module|if|unless|while|until|for|case|begin)\b/
// Also matches `x = if condition`, `x = begin`, `@foo ||= begin`, etc.
const INDENT_ASSIGN = /[=]\s*(if|unless|case|begin)\b/
const INDENT_END = /\b(do)\s*(\|[^|]*\|)?\s*(#.*)?$|\{\s*(\|[^|]*\|)?\s*(#.*)?$/

// Single-line forms that should NOT indent:
// - contains `;` (e.g. `class Foo; end`, `def foo; body; end`)
// - ends with `end` (e.g. `if x then y end`)
// - endless method `def foo(x) = expr`
const SINGLE_LINE = /;|\bend\s*(#.*)?$|^\s*def\s+\w+\(.*\)\s*=/

// Keywords that deindent to match their opening keyword
const DEINDENT_ON = /^\s*(end|else|elsif|when|in|rescue|ensure)\b/

// Closing delimiters that deindent to match their opener
const DEINDENT_CLOSE = /^\s*[\}\]\)]/

// Intermediate keywords whose body should indent
const INTERMEDIATE = /^\s*(else|elsif|when|in|rescue|ensure)\b/

// Line ends with a continuation indicator (trailing operator, comma, backslash)
// The optional trailing comment uses (#(?:[^{].*)?)? to avoid matching #{interpolation} inside strings
const CONTINUATION = /(\+|-|\*|&&|\|\||\\|,|\.)\s*(#(?:[^{].*)?)?$/

// Line starts with a dot (method chaining continuation)
const LEADING_DOT = /^\s*\./

function opensBlock(text: string): boolean {
  return (INDENT_AFTER.test(text) || INDENT_ASSIGN.test(text) || INDENT_END.test(text)) && !SINGLE_LINE.test(text)
}

// Get the text of a line from an IndentContext (respects simulateBreak)
function lineText(cx: IndentContext, lineFrom: number): string {
  const line = cx.lineAt(lineFrom)
  return line.text
}

// Find the previous line's start position, or -1 if at the first line.
// Uses cx.lineAt() which respects simulateBreak.
function prevLineFrom(cx: IndentContext, lineFrom: number): number {
  if (lineFrom <= 0) return -1
  const prevLine = cx.lineAt(lineFrom - 1)
  return prevLine.from
}

// Check if a line is inside an unclosed delimiter ({, [, ()
// by scanning backwards from lineFrom to count unmatched openers
function isInsideDelimiter(cx: IndentContext, lineFrom: number): boolean {
  let depth = 0
  let scanFrom = lineFrom
  while (true) {
    scanFrom = prevLineFrom(cx, scanFrom)
    if (scanFrom < 0) break
    const text = lineText(cx, scanFrom)
    for (let i = text.length - 1; i >= 0; i--) {
      const ch = text[i]
      if (ch === "}" || ch === "]" || ch === ")") depth++
      else if (ch === "{" || ch === "[" || ch === "(") {
        if (depth === 0) return true
        depth--
      }
    }
  }
  return false
}

function rubyIndentService(cx: IndentContext, pos: number): number | undefined {
  const line = cx.lineAt(pos)
  const text = line.text
  const lineFrom = line.from

  // Current line starts with a deindent keyword → find the right level
  if (DEINDENT_ON.test(text)) {
    const isEnd = /^\s*end\b/.test(text)
    // Scan backwards to find the matching opening keyword at the right nesting level
    let depth = 0
    let braceDepth = 0
    let scanFrom = lineFrom
    while (true) {
      scanFrom = prevLineFrom(cx, scanFrom)
      if (scanFrom < 0) break
      const prev = lineText(cx, scanFrom)
      // Track } closers for brace-style blocks
      if (/^\s*\}/.test(prev)) braceDepth++
      if (/^\s*end\b/.test(prev)) depth++
      else if (INDENT_AFTER.test(prev) || INDENT_ASSIGN.test(prev)) {
        if (depth === 0) return cx.lineIndent(scanFrom)
        depth--
      } else if (INDENT_END.test(prev)) {
        // Distinguish brace-style ({) from do-style openers
        if (/\{\s*(\|[^|]*\|)?\s*(#.*)?$/.test(prev)) {
          // Brace-style opener — pair with } closers
          if (braceDepth > 0) {
            braceDepth--
          } else if (!isEnd) {
            // Non-end keywords (else, rescue, etc.) can match brace openers
            if (depth === 0) return cx.lineIndent(scanFrom)
            depth--
          }
          // `end` never closes a `{`, so skip this opener
        } else {
          // do-style opener
          if (depth === 0) return cx.lineIndent(scanFrom)
          depth--
        }
      }
    }
    return 0
  }

  // Current line starts with closing delimiter → scan backwards for matching opener
  if (DEINDENT_CLOSE.test(text)) {
    const closeChar = text.trim()[0]
    const openChar = closeChar === "}" ? "{" : closeChar === "]" ? "[" : "("
    let depth = 0
    let scanFrom = lineFrom
    while (true) {
      scanFrom = prevLineFrom(cx, scanFrom)
      if (scanFrom < 0) break
      const prev = lineText(cx, scanFrom)
      for (let j = prev.length - 1; j >= 0; j--) {
        if (prev[j] === closeChar) depth++
        else if (prev[j] === openChar) {
          if (depth === 0) return cx.lineIndent(scanFrom)
          depth--
        }
      }
    }
    return 0
  }

  // For blank/new lines: determine indent from previous non-blank line
  if (lineFrom > 0) {
    // Find the previous non-blank line
    let prevFrom = prevLineFrom(cx, lineFrom)
    while (prevFrom >= 0 && lineText(cx, prevFrom).trim() === "") {
      prevFrom = prevLineFrom(cx, prevFrom)
    }
    if (prevFrom < 0) return 0

    const prevText = lineText(cx, prevFrom)
    const prevIndent = cx.lineIndent(prevFrom)

    // Previous line opens a block → indent
    if (opensBlock(prevText)) {
      return prevIndent + cx.unit
    }

    // Previous line is an intermediate keyword → indent body
    if (INTERMEDIATE.test(prevText)) {
      return prevIndent + cx.unit
    }

    // Previous line is `end` → stay at end's level
    if (/^\s*end\b/.test(prevText)) {
      return prevIndent
    }

    // Previous line ends with { [ ( → indent
    if (/[\{\[\(]\s*(#.*)?$/.test(prevText)) {
      return prevIndent + cx.unit
    }

    // Previous line starts with dot AND current line also starts with dot (or is blank) → maintain chain level
    if (LEADING_DOT.test(prevText) && (LEADING_DOT.test(text) || text.trim() === "")) {
      return prevIndent
    }

    // Previous line starts with dot but current doesn't → chain ended, deindent
    if (LEADING_DOT.test(prevText)) {
      // Walk back to find the line that started the chain
      let chainFrom = prevFrom
      while (true) {
        let checkFrom = prevLineFrom(cx, chainFrom)
        while (checkFrom >= 0 && lineText(cx, checkFrom).trim() === "") {
          checkFrom = prevLineFrom(cx, checkFrom)
        }
        if (checkFrom < 0) break
        if (LEADING_DOT.test(lineText(cx, checkFrom))) {
          chainFrom = checkFrom
        } else {
          chainFrom = checkFrom
          break
        }
      }
      return cx.lineIndent(chainFrom)
    }

    // Previous line ends with continuation (trailing operator, comma, backslash)
    if (CONTINUATION.test(prevText)) {
      // Inside delimited constructs ({}, [], ()), don't add extra indent —
      // delimitedIndent already handles the correct level
      if (isInsideDelimiter(cx, prevFrom)) {
        return prevIndent
      }
      // Check if the line before that was also a continuation — if so, stay at same level
      if (prevFrom > 0) {
        let prev2From = prevLineFrom(cx, prevFrom)
        while (prev2From >= 0 && lineText(cx, prev2From).trim() === "") {
          prev2From = prevLineFrom(cx, prev2From)
        }
        if (prev2From >= 0) {
          const prev2Text = lineText(cx, prev2From)
          if (CONTINUATION.test(prev2Text) || LEADING_DOT.test(prev2Text)) {
            return prevIndent
          }
        }
      }
      return prevIndent + cx.unit
    }

    // Previous line is NOT a continuation, but the one before it was → deindent back
    if (prevFrom > 0) {
      let prev2From = prevLineFrom(cx, prevFrom)
      while (prev2From >= 0 && lineText(cx, prev2From).trim() === "") {
        prev2From = prevLineFrom(cx, prev2From)
      }
      if (prev2From >= 0) {
        const prev2Text = lineText(cx, prev2From)
        if ((CONTINUATION.test(prev2Text) || LEADING_DOT.test(prev2Text)) && !opensBlock(prev2Text)) {
          // The continuation chain ended — go back to the original indent level
          // Walk back to find the start of the chain
          let chainFrom = prev2From
          while (true) {
            let checkFrom = prevLineFrom(cx, chainFrom)
            while (checkFrom >= 0 && lineText(cx, checkFrom).trim() === "") {
              checkFrom = prevLineFrom(cx, checkFrom)
            }
            if (checkFrom < 0) break
            const checkText = lineText(cx, checkFrom)
            if (CONTINUATION.test(checkText) || LEADING_DOT.test(checkText)) {
              chainFrom = checkFrom
            } else {
              chainFrom = checkFrom
              break
            }
          }
          return cx.lineIndent(chainFrom)
        }
      }
    }

    // Default: maintain previous line's indentation
    return prevIndent
  }

  return 0
}

export const rubyLanguage = LRLanguage.define({
  name: "ruby",
  parser: parser.configure({
    props: [
      rubyHighlighting,
      indentNodeProp.add({
        Block: delimitedIndent({closing: "}"}),
        Array: delimitedIndent({closing: "]"}),
        Hash: delimitedIndent({closing: "}"}),
        ArgList: delimitedIndent({closing: ")"}),
        ParamList: delimitedIndent({closing: ")"}),
      }),
      foldNodeProp.add({
        "ClassBody ModuleBody MethodBody Block DoBlock BeginBlock": foldInside,
        "MethodDef ClassDef ModuleDef"(tree, state) {
          // Fold from end of first line to before `end`
          const firstLine = state.doc.lineAt(tree.from)
          const lastLine = state.doc.lineAt(tree.to)
          if (firstLine.number >= lastLine.number) return null
          return {from: firstLine.to, to: lastLine.from}
        },
        "IfStatement UnlessStatement WhileStatement UntilStatement ForStatement CaseStatement"(tree) {
          return {from: tree.from, to: tree.to}
        },
        InterpolatedString(tree) {
          return {from: tree.from + 1, to: tree.to - 1}
        },
      }),
    ],
  }),
  languageData: {
    commentTokens: {line: "#", block: {open: "=begin", close: "=end"}},
    closeBrackets: {brackets: ["(", "[", "{", "'", '"', "|"]},
    indentOnInput: /^\s*(end|else|elsif|when|in|rescue|ensure|\}|\])$/,
    autocomplete: rubyCompletion,
  },
})

export function ruby() {
  return new LanguageSupport(rubyLanguage, [
    indentService.of(rubyIndentService),
  ])
}
