import {parser} from "./syntax.grammar"
import {
  LRLanguage, LanguageSupport,
  indentNodeProp, foldNodeProp, foldInside,
  delimitedIndent
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

export const rubyLanguage = LRLanguage.define({
  name: "ruby",
  parser: parser.configure({
    props: [
      rubyHighlighting,
      indentNodeProp.add({
        // Block bodies indent one level
        "ClassBody ModuleBody MethodBody": context => {
          return context.baseIndent + context.unit
        },
        // Brace-delimited constructs use delimitedIndent
        Block: delimitedIndent({closing: "}"}),
        Array: delimitedIndent({closing: "]"}),
        Hash: delimitedIndent({closing: "}"}),
        ArgList: delimitedIndent({closing: ")"}),
        ParamList: delimitedIndent({closing: ")"}),
        // Control flow bodies indent
        "IfStatement UnlessStatement WhileStatement UntilStatement ForStatement CaseStatement": context => {
          return context.baseIndent + context.unit
        },
        // Begin/rescue/ensure indent
        BeginBlock: context => {
          return context.baseIndent + context.unit
        },
        // Do blocks indent
        DoBlock: context => {
          return context.baseIndent + context.unit
        },
        // Deindent for intermediate keywords
        "ElsifClause ElseClause WhenClause InClause RescueClause EnsureClause": context => {
          return context.baseIndent
        },
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
