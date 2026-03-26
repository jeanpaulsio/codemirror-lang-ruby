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
const INDENT_AFTER = /^\s*(def|class|module|if|unless|while|until|for|case|begin)\b/
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
const CONTINUATION = /(\+|-|\*|&&|\|\||\\|,)\s*(#.*)?$/

// Line starts with a dot (method chaining continuation)
const LEADING_DOT = /^\s*\./

function opensBlock(text: string): boolean {
  return (INDENT_AFTER.test(text) || INDENT_ASSIGN.test(text) || INDENT_END.test(text)) && !SINGLE_LINE.test(text)
}

function rubyIndentService(cx: IndentContext, pos: number): number | undefined {
  const doc = cx.state.doc
  const line = doc.lineAt(pos)
  const text = line.text
  const lineNum = line.number

  // Current line starts with a deindent keyword → find the right level
  if (DEINDENT_ON.test(text)) {
    // Scan backwards to find the matching opening keyword at the right nesting level
    let depth = 0
    for (let i = lineNum - 1; i >= 1; i--) {
      const prev = doc.line(i).text
      if (/^\s*end\b/.test(prev)) depth++
      else if (INDENT_AFTER.test(prev) || INDENT_ASSIGN.test(prev) || INDENT_END.test(prev)) {
        if (depth === 0) return cx.lineIndent(doc.line(i).from)
        depth--
      }
    }
    return 0
  }

  // Current line starts with closing delimiter → scan backwards for matching opener
  if (DEINDENT_CLOSE.test(text)) {
    const closeChar = text.trim()[0]
    const openChar = closeChar === "}" ? "{" : closeChar === "]" ? "[" : "("
    let depth = 0
    for (let i = lineNum - 1; i >= 1; i--) {
      const prev = doc.line(i).text
      for (let j = prev.length - 1; j >= 0; j--) {
        if (prev[j] === closeChar) depth++
        else if (prev[j] === openChar) {
          if (depth === 0) return cx.lineIndent(doc.line(i).from)
          depth--
        }
      }
    }
    return 0
  }

  // For blank/new lines: determine indent from previous non-blank line
  if (lineNum > 1) {
    // Find the previous non-blank line
    let prevNum = lineNum - 1
    while (prevNum >= 1 && doc.line(prevNum).text.trim() === "") prevNum--
    if (prevNum < 1) return 0

    const prevLine = doc.line(prevNum)
    const prevText = prevLine.text
    const prevIndent = cx.lineIndent(prevLine.from)

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
      let chainStart = prevNum
      while (chainStart > 1) {
        let checkNum = chainStart - 1
        while (checkNum >= 1 && doc.line(checkNum).text.trim() === "") checkNum--
        if (checkNum < 1) break
        if (LEADING_DOT.test(doc.line(checkNum).text)) {
          chainStart = checkNum
        } else {
          chainStart = checkNum
          break
        }
      }
      return cx.lineIndent(doc.line(chainStart).from)
    }

    // Previous line ends with continuation (trailing operator, comma, backslash)
    if (CONTINUATION.test(prevText)) {
      // Check if the line before that was also a continuation — if so, stay at same level
      if (prevNum > 1) {
        let prev2Num = prevNum - 1
        while (prev2Num >= 1 && doc.line(prev2Num).text.trim() === "") prev2Num--
        if (prev2Num >= 1) {
          const prev2Text = doc.line(prev2Num).text
          if (CONTINUATION.test(prev2Text) || LEADING_DOT.test(prev2Text)) {
            return prevIndent
          }
        }
      }
      return prevIndent + cx.unit
    }

    // Previous line is NOT a continuation, but the one before it was → deindent back
    if (prevNum > 1) {
      let prev2Num = prevNum - 1
      while (prev2Num >= 1 && doc.line(prev2Num).text.trim() === "") prev2Num--
      if (prev2Num >= 1) {
        const prev2Text = doc.line(prev2Num).text
        if ((CONTINUATION.test(prev2Text) || LEADING_DOT.test(prev2Text)) && !opensBlock(prev2Text)) {
          // The continuation chain ended — go back to the original indent level
          // Walk back to find the start of the chain
          let chainStart = prev2Num
          while (chainStart > 1) {
            let checkNum = chainStart - 1
            while (checkNum >= 1 && doc.line(checkNum).text.trim() === "") checkNum--
            if (checkNum < 1) break
            const checkText = doc.line(checkNum).text
            if (CONTINUATION.test(checkText) || LEADING_DOT.test(checkText)) {
              chainStart = checkNum
            } else {
              chainStart = checkNum
              break
            }
          }
          return cx.lineIndent(doc.line(chainStart).from)
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
