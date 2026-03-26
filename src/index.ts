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

// Keywords after which the next line should indent one level
const INDENT_AFTER = /^\s*(def|class|module|if|unless|while|until|for|case|begin)\b/
const INDENT_END = /\b(do)\s*(\|[^|]*\|)?\s*(#.*)?$|\{\s*(\|[^|]*\|)?\s*(#.*)?$/

// Single-line forms that should NOT indent:
// - contains `;` (e.g. `class Foo; end`, `def foo; body; end`)
// - ends with `end` (e.g. `if x then y end`)
// - endless method `def foo(x) = expr`
const SINGLE_LINE = /;|\bend\s*(#.*)?$|^\s*def\s+\w+\(.*\)\s*=/

// Keywords that deindent to match their opening keyword
const DEINDENT_ON = /^\s*(end|else|elsif|when|in|rescue|ensure)\b/

// Intermediate keywords whose body should indent
const INTERMEDIATE = /^\s*(else|elsif|when|in|rescue|ensure)\b/

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
      else if (INDENT_AFTER.test(prev) || INDENT_END.test(prev)) {
        if (depth === 0) return cx.lineIndent(doc.line(i).from)
        depth--
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

    // Previous line opens a block → indent (but not single-line forms like `def foo; end`)
    if ((INDENT_AFTER.test(prevText) || INDENT_END.test(prevText)) && !SINGLE_LINE.test(prevText)) {
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

    // Previous line ends with { [ ( → defer to tree-based delimitedIndent
    if (/[\{\[\(]\s*(#.*)?$/.test(prevText)) {
      return prevIndent + cx.unit
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
