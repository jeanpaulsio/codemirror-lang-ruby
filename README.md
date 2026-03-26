# codemirror-lang-ruby

Ruby language support for [CodeMirror 6](https://codemirror.net/), built on a [Lezer](https://lezer.codemirror.net/) grammar.

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
| [Fastlane](https://github.com/fastlane/fastlane) | runner.rb | 379 | **91.3%** |
| [Grape](https://github.com/ruby-grape/grape) | api.rb | 166 | **90.1%** |
| [Jekyll](https://github.com/jekyll/jekyll) | site.rb | 577 | **88.4%** |
| [Devise](https://github.com/heartcombo/devise) | devise.rb | 534 | **87.9%** |
| [Sidekiq](https://github.com/sidekiq/sidekiq) | config.rb | 321 | **87.5%** |
| [Rails](https://github.com/rails/rails) | query_methods.rb | 2291 | **86.6%** |
| [Faker](https://github.com/faker-ruby/faker) | internet.rb | 579 | **85.3%** |

## What's supported

- **Definitions**: methods (with params, endless `def f(x) = expr`), classes (with inheritance), modules
- **Control flow**: if/elsif/else, unless, while, until, for/in, case/when, case/in (pattern matching)
- **Error handling**: begin/rescue/ensure/raise
- **Strings**: single-quoted, double-quoted with `#{interpolation}`, heredocs (`<<~DELIM`), `%`-literals with any delimiter
- **Literals**: integers, floats, symbols, character literals (`?a`), arrays, hashes, regex (`/pattern/flags`), nil, true, false
- **Expressions**: assignment (including `||=`, `&&=`), multiple assignment (`a, b = 1, 2`), method calls (with receiver, args, splat `*args`/`**kwargs`/`&block`), chained calls, binary/unary/ternary operators, lambdas, ranges, conditional modifiers
- **Blocks**: brace blocks and do/end blocks attached to method calls (`items.each { |x| x }`)
- **Operators**: proper precedence (`**` > `*`/`/` > `+`/`-` > comparison > logic), safe navigation (`&.`), scope resolution (`::`)
- **Bare method calls**: `puts "hello"`, `require "json"`, `attr_reader :name`, `include Comparable` (25 common Ruby methods)
- **Variables**: local, `@instance`, `@@class`, `$global`, `Constants`
- **Comments**: line `#` and block `=begin`/`=end`
- **Editor features**: smart indentation (119 test cases), code folding, bracket closing, keyword autocompletion (31 keywords)

## Known limitations

- Blank lines inside class/method bodies can produce spurious error nodes (~38% of parse errors)
- Multi-arg bare method calls (`raise ArgumentError, "msg"`) not fully supported
- Compound assignment operators (`+=`, `-=`, `|=`) in some contexts
- Heredoc and `%`-literal bodies are opaque tokens (no interpolation highlighting inside)
- `<<` left-shift operator not distinguished from heredoc start

## Development

```bash
npm install          # Install dependencies
npm run build        # Build grammar + bundle to dist/
npm test             # Run all 89 grammar tests
npm run lint         # TypeScript type check
npm run demo:build   # Build the demo page
```

## Built with Claude Code

This entire project — grammar, external tokenizers, tests, editor integration, and demo — was written by [Claude Code](https://claude.ai/code), guided by [@jeanpaulsio](https://github.com/jeanpaulsio).

## License

MIT
