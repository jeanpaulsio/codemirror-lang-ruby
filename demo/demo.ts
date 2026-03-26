import {EditorView, basicSetup} from "codemirror"
import {keymap} from "@codemirror/view"
import {indentWithTab} from "@codemirror/commands"
import {oneDark} from "@codemirror/theme-one-dark"
import {ruby} from "../src/index"

const sampleCode = `# Ruby syntax highlighting demo
# Powered by codemirror-lang-ruby

class User
  attr_reader :name, :email

  def initialize(name, email)
    @name = name
    @email = email
  end

  def greet
    "Hello, #{@name}!"
  end

  def admin?
    @role == :admin
  end
end

# Pattern matching (Ruby 3.0+)
case response
in {status: 200, body:}
  process(body)
in {status: 404}
  handle_not_found
else
  raise "Unexpected: #{response[:status]}"
end

# Multiple assignment
a, b, *rest = [1, 2, 3, 4, 5]

# Endless method
def square(x) = x ** 2

# Lambdas
transform = -> (x) { x * 2 + 1 }

# Safe navigation
user&.profile&.avatar

# Conditional modifier
puts("done") if tasks.empty?

# Ranges and ternary
score = points > 100 ? "high" : "low"
(1..10).each { |n| puts(n) }

# Begin/rescue/ensure
begin
  data = fetch_data(url)
rescue StandardError => e
  log(e)
ensure
  cleanup
end

# Hash with symbol keys
config = {host: "localhost", port: 3000, debug: true}

# Character literals and percent strings
char = ?a
words = %w[hello world]
symbols = %i[foo bar baz]
`

new EditorView({
  doc: sampleCode,
  extensions: [
    basicSetup,
    keymap.of([
      indentWithTab,
      {key: "Mod-Shift-Enter", run: (view) => {
        const line = view.state.doc.lineAt(view.state.selection.main.head)
        view.dispatch({changes: {from: line.from, insert: "\n"}, selection: {anchor: line.from}})
        return true
      }},
    ]),
    ruby(),
    oneDark,
    EditorView.theme({
      "&": {height: "100%"},
    }),
  ],
  parent: document.getElementById("editor")!,
})
