# Changelog

All notable changes to this project will be documented in this file.

This project follows [Semantic Versioning](https://semver.org/).

## [0.2.0] - 2026-03-26

### Added

- **Comprehensive indentation** — 119 programmatic tests covering all Ruby indent/dedent patterns:
  - Block openers (def, class, module, if, unless, while, until, for, case, begin, do, braces)
  - Mid-block keywords (else, elsif, when, rescue, ensure)
  - Closing delimiters (}, ], ))
  - Continuation lines (trailing +, -, &&, ||, \, comma)
  - Method chaining with leading dots
  - Assignment with block openers (`x = if`, `@foo ||= begin`)
  - Modifier forms and single-line bodies (no indent change)
  - Nested blocks at arbitrary depth
- **Subscript expressions** — `arr[0]`, `hash[:key]`, `matrix[i][j]`
- **Subscript assignment** — `hash[:key] = value`
- **Setter method definitions** — `def name=(value)`
- **Class method definitions** — `def self.method_name`
- Tab key support in demo editor
- Cmd+Shift+Enter inserts properly indented line above in demo editor

### Fixed

- Single-line forms (`class Foo; end`, `def foo; end`, endless methods) no longer incorrectly indent the next line
- `end`, `else`, `elsif`, `when`, `rescue`, `ensure` correctly deindent to match their opening keyword at any nesting depth
- Empty lines inside blocks preserve surrounding indent context
- Closing delimiters align with their matching opener

### Changed

- Indentation engine rewritten from tree-based `indentNodeProp` to text-based `indentService` for robust handling of incomplete code while typing
- Updated parse accuracy benchmarks with larger, more representative real-world files

## [0.1.0] - 2026-03-26

### Added

- Initial release
- Lezer grammar for Ruby with 89 grammar tests
- **Definitions**: methods (with params, endless `def f(x) = expr`), classes (with inheritance), modules
- **Control flow**: if/elsif/else, unless, while, until, for/in, case/when, case/in (pattern matching)
- **Error handling**: begin/rescue/ensure/raise
- **Strings**: single-quoted, double-quoted with `#{interpolation}`, heredocs (`<<~DELIM`), `%`-literals
- **Literals**: integers, floats, symbols, character literals, arrays, hashes, regex, nil, true, false
- **Expressions**: assignment (including `||=`, `&&=`), multiple assignment, method calls, chained calls, binary/unary/ternary operators, lambdas, ranges, conditional modifiers
- **Blocks**: brace blocks and do/end blocks attached to method calls
- **Operators**: proper precedence, safe navigation (`&.`), scope resolution (`::`)
- **Bare method calls**: 25 common Ruby methods (puts, require, attr_reader, include, etc.)
- **Variables**: local, @instance, @@class, $global, Constants
- **Comments**: line `#` and block `=begin`/`=end`
- 5 external tokenizers for context-dependent tokens (regex/division, heredoc/less-than, percent-literal/modulo, symbol/colon, string interpolation)
- Code folding, bracket closing, keyword autocompletion (31 keywords)
- Demo page with One Dark theme
- GitHub Actions CI
