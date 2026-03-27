# codemirror-lang-ruby

Ruby language support for [CodeMirror 6](https://codemirror.net/), built on a [Lezer](https://lezer.codemirror.net/) grammar.

Targets **Ruby 3.0+** syntax (including endless methods and basic pattern matching).

[**Live Demo**](https://jeanpaulsio.github.io/codemirror-lang-ruby/)

## Install

```bash
npm install codemirror-lang-ruby
```

## Usage

```typescript
import {EditorView, basicSetup} from "codemirror"
import {ruby} from "codemirror-lang-ruby"

new EditorView({
  doc: 'puts "hello"',
  extensions: [basicSetup, ruby()],
  parent: document.getElementById("editor")!,
})
```

## Real-world parse accuracy

Tested against popular open source Ruby projects (large, representative files):

| Project | File | Lines | Accuracy |
|---------|------|-------|----------|
| [Faker](https://github.com/faker-ruby/faker) | internet.rb | 579 | **98.6%** |
| [Devise](https://github.com/heartcombo/devise) | devise.rb | 534 | **98.1%** |
| [Jekyll](https://github.com/jekyll/jekyll) | site.rb | 577 | **97.6%** |
| [Fastlane](https://github.com/fastlane/fastlane) | runner.rb | 379 | **95.0%** |
| [Rails](https://github.com/rails/rails) | query_methods.rb | 2291 | **94.3%** |
| [Grape](https://github.com/ruby-grape/grape) | api.rb | 166 | **94.0%** |
| [Sidekiq](https://github.com/sidekiq/sidekiq) | config.rb | 321 | **93.5%** |

## What's supported

- **Definitions**: methods (with params, endless `def f(x) = expr`), classes (with inheritance), modules
- **Control flow**: if/elsif/else, unless, while, until, for/in, case/when, case/in (pattern matching with pin operators, hash patterns, find patterns)
- **Error handling**: begin/rescue/ensure/raise, rescue with scoped constants (`rescue Foo::Bar => e`)
- **Strings**: single-quoted, double-quoted with `#{interpolation}`, heredocs (`<<~DELIM`), `%`-literals with any delimiter
- **Literals**: integers, floats, symbols, character literals (`?a`), arrays, hashes, regex (`/pattern/flags`), nil, true, false
- **Expressions**: assignment (including `||=`, `&&=`), multiple assignment (`a, b = 1, 2`), method calls (with receiver and keyword args like `User.where(active: true)`, splat `*args`/`**kwargs`/`&block`), chained calls, binary/unary/ternary operators, lambdas, ranges, conditional modifiers
- **Blocks**: brace blocks and do/end blocks attached to method calls (`items.each { |x| x }`)
- **Operators**: proper precedence (`**` > `*`/`/` > `+`/`-` > comparison > logic), safe navigation (`&.`), scope resolution (`::` including leading `::TopLevel`)
- **Bare method calls**: `puts "hello"`, `require "json"`, `attr_reader :name`, `include Comparable`, `validates_presence_of :name`, `rescue_from`, `helper_method` (49 common Ruby/Rails methods)
- **Variables**: local, `@instance`, `@@class`, `$global`, `Constants`
- **Comments**: line `#` and block `=begin`/`=end`
- **Editor features**: smart indentation, code folding, bracket closing, keyword autocompletion (31 keywords)

## Known limitations

- **Heredocs as arguments or in chains** — `foo(<<~SQL)` and `<<~HEREDOC.strip` don't parse correctly. Heredocs assigned to variables (`x = <<~SQL`) work fine. The limitation is architectural: the heredoc body starts on the next line but the closing `)` or `.method` needs to be parsed on the current line, which requires a split-token approach not yet implemented.
- **Guard clauses in pattern matching** — `in x if x > 0` is not supported. The `if`/`unless` keyword conflicts with `IfStatement`/`ConditionalModifier` in the LR parser and cannot be resolved without an external tokenizer.
- **Heredoc and `%`-literal bodies** are opaque tokens (no interpolation highlighting inside).
- **Inline rescue as a standalone expression** — `value = foo rescue nil` works (rescue in assignments), but `foo rescue bar` as a standalone expression outside of assignment context is not supported.
- **Newline as statement separator** — Ruby uses newlines to separate statements, but the grammar is whitespace-insensitive. An expression followed by `if` on the next line may be parsed as a conditional modifier (e.g., `x = 1\nif cond` parses as `x = (1 if cond)`).
- **Line-based indentation** — The indent engine uses regex line scanning rather than tree-based analysis. Most patterns work well, but complex multi-line expressions (e.g., multi-line method args followed by a body, trailing commas inside nested delimiters) may not indent perfectly.

## Development

```bash
npm install          # Install dependencies
npm run build        # Build grammar + bundle to dist/
npm test             # Run 105 grammar tests (721 total across all suites)
npm run lint         # TypeScript type check
npm run demo:build   # Build the demo page
```

## Built with Claude Code

This entire project — grammar, external tokenizers, tests, editor integration, and demo — was written by [Claude Code](https://claude.ai/code), guided by [@jeanpaulsio](https://github.com/jeanpaulsio).

## License

MIT
