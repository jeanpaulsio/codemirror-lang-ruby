import {parser} from "./syntax.grammar"
import {
  LRLanguage, LanguageSupport,
  indentNodeProp, foldNodeProp, foldInside,
  delimitedIndent, TreeIndentContext
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

// Deindent keywords — when these appear on the current line, deindent to
// match the opening keyword (def, class, if, etc.)
const DEINDENT = /^\s*(end|else|elsif|when|in|rescue|ensure)\b/

// Ruby indentation: indent after block-opening keywords, deindent on
// closing/intermediate keywords. The indent function checks textAfter
// (what the user is typing on the current line) to deindent immediately
// when typing `end`, `else`, `elsif`, etc.
function rubyIndent(context: TreeIndentContext) {
  const closing = DEINDENT.test(context.textAfter)
  return context.baseIndent + (closing ? 0 : context.unit)
}

// For intermediate keywords (elsif, else, rescue, ensure, when, in) —
// these are at the same level as the opening keyword, but content inside
// them indents one level.
function rubyIntermediateIndent(context: TreeIndentContext) {
  const closing = DEINDENT.test(context.textAfter)
  return context.baseIndent + (closing ? 0 : context.unit)
}

export const rubyLanguage = LRLanguage.define({
  name: "ruby",
  parser: parser.configure({
    props: [
      rubyHighlighting,
      indentNodeProp.add({
        "ClassBody ModuleBody MethodBody": rubyIndent,
        "IfStatement UnlessStatement WhileStatement UntilStatement ForStatement CaseStatement": rubyIndent,
        BeginBlock: rubyIndent,
        DoBlock: rubyIndent,
        "ElsifClause ElseClause WhenClause InClause RescueClause EnsureClause": rubyIntermediateIndent,
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
  return new LanguageSupport(rubyLanguage)
}
