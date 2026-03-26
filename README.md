# codemirror-lang-ruby

Ruby language support for [CodeMirror 6](https://codemirror.net/), built on a [Lezer](https://lezer.codemirror.net/) grammar.

[**Live Demo**](https://jeanpaulsio.github.io/codemirror-lang-ruby/)

## Install

```bash
npm install github:jeanpaulsio/codemirror-lang-ruby
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

## What's supported

- **Definitions**: methods (with params, endless `def f(x) = expr`), classes (with inheritance), modules
- **Control flow**: if/elsif/else, unless, while, until, for/in, case/when, case/in (pattern matching)
- **Error handling**: begin/rescue/ensure/raise
- **Strings**: single-quoted, double-quoted with `#{interpolation}`, `%`-literals (`%w[]`, `%i[]`, `%q()`, `%Q()`)
- **Literals**: integers, floats, symbols, character literals (`?a`), arrays, hashes (rocket `=>` and symbol-key `name:` shorthand), nil, true, false
- **Expressions**: assignment (including `||=`, `&&=`), multiple assignment (`a, b = 1, 2`), method calls (with receiver, args, splat `*args`/`**kwargs`/`&block`), chained calls, binary/unary/ternary operators, lambdas, ranges, conditional modifiers
- **Operators**: proper precedence (`**` > `*`/`/` > `+`/`-` > comparison > logic), safe navigation (`&.`)
- **Variables**: local, `@instance`, `@@class`, `$global`, `Constants`
- **Comments**: line `#` and block `=begin`/`=end`
- **Editor features**: indentation, code folding, bracket closing, keyword autocompletion (31 keywords)

## Known limitations

These are tracked as [open issues](https://github.com/jeanpaulsio/codemirror-lang-ruby/issues) and require external tokenizers:

- No regex literals (`/pattern/` conflicts with division)
- No block attachment to method calls (`items.each { |x| x }`)
- No bare method calls without parens (`puts "hello"`)
- No heredocs (`<<~RUBY`)
- No `%`-literal interpolation or non-bracket delimiters

## Development

```bash
npm install          # Install dependencies
npm run build        # Build grammar + bundle to dist/
npm test             # Run all 67 grammar tests
npm run lint         # TypeScript type check
npm run demo:build   # Build the demo page
```

## License

MIT
