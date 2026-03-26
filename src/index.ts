import {parser} from "./syntax.grammar"
import {
  LRLanguage, LanguageSupport,
  indentNodeProp, foldNodeProp, foldInside,
  delimitedIndent, indentService
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

// Keywords that open a new indentation level
const INDENT_AFTER = /^\s*(def|class|module|if|unless|while|until|for|case|begin|do)\b/
// Also indent after lines ending with block openers
const INDENT_END = /(\bdo\s*(\|[^|]*\|)?\s*$|\{(\s*\|[^|]*\|)?\s*$)/

// Keywords that should deindent (align with opening keyword)
const DEINDENT_BEFORE = /^\s*(end|else|elsif|when|in|rescue|ensure)\b/

// Text-based indentation service. This runs BEFORE tree-based indentation
// and handles the common case of incomplete code (no `end` yet).
// It looks at the previous line to decide whether to indent/deindent.
function rubyIndentService(context: {
  state: {doc: {lineAt(pos: number): {text: string, from: number, number: number}}},
  lineAt(pos: number, bias?: number): {text: string, from: number},
  lineIndent(pos: number, bias?: number): number,
  unit: number,
}, pos: number): number | undefined {
  const line = context.state.doc.lineAt(pos)
  const lineText = line.text

  // If the current line has a deindent keyword, find the matching indent
  if (DEINDENT_BEFORE.test(lineText)) {
    // Look backwards for the matching opening keyword
    if (line.number > 1) {
      const prevLine = context.state.doc.lineAt(line.from - 1)
      const prevIndent = context.lineIndent(prevLine.from)
      const prevText = prevLine.text

      // If previous line was an indent keyword, stay at its level
      if (INDENT_AFTER.test(prevText)) {
        return prevIndent
      }
      // Otherwise deindent one level from the previous line
      return Math.max(0, prevIndent - context.unit)
    }
    return 0
  }

  // For new lines: check if the previous line should cause indentation
  if (line.number > 1) {
    const prevLine = context.state.doc.lineAt(line.from - 1)
    const prevText = prevLine.text
    const prevIndent = context.lineIndent(prevLine.from)

    // Previous line is a block-opening keyword → indent
    if (INDENT_AFTER.test(prevText) || INDENT_END.test(prevText)) {
      return prevIndent + context.unit
    }

    // Previous line is `end` → stay at end's level (not indented)
    if (/^\s*end\b/.test(prevText)) {
      return prevIndent
    }

    // Previous line is an intermediate keyword → indent body
    if (/^\s*(else|elsif|when|in|rescue|ensure)\b/.test(prevText)) {
      return prevIndent + context.unit
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
