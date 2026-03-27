# Changelog

All notable changes to this project will be documented in this file.

This project follows [Semantic Versioning](https://semver.org/).

## [0.4.0] - 2026-03-26

### Added

- **`::TopLevel` leading scope resolution** — `::TopLevel`, `::TopLevel::Foo`, and `::Foo.bar` now parse correctly. Class/module definitions with leading `::` also supported.
- **Hash patterns in `case/in`** — Pattern matching now supports `in {name: String => n}` and `in {name:}` shorthand via new `HashPattern` rule.
- **Find patterns in `case/in`** — Pattern matching now supports `in [*, 2, *]` and `in [*pre, value, *post]` via new `FindPattern` rule.

### Fixed

- **Auto-indent on Enter** — The indent service now uses `IndentContext.lineAt()` instead of raw document access, correctly respecting `simulateBreak` for real-time indent-on-Enter behavior.
- Rails parse accuracy improved from 94.2% to 94.3%.

### Changed

- Known limitations updated: removed fixed items (`::TopLevel`, hash patterns, find patterns), added guard clause limitation explanation.

## [0.3.0] - 2026-03-26

### Added

- **575 tests** across 7 suites (up from 105):
  - 247 indentation tests covering all 32 sections of the indent spec
  - 139 syntax highlighting tests for all token types
  - 39 grammar accuracy and performance tests
  - 25 code folding tests
  - 20 autocompletion tests (10 with documented skips)
  - 10 full-file integration tests
- Parse accuracy benchmark script (`test/benchmark.mjs`)

### Fixed

- **35 grammar bugs identified, 29 fixed** across 8 root causes:
  - Bare `rescue` inside method body without `begin`
  - Lambda without params (`-> { body }`)
  - Setter assignment via dot (`self.email = value`)
  - Constants as method calls (`URI(url)`, `Integer("42")`)
  - Scope resolution assignment (`Foo::BAR = 1`)
  - Block param destructuring (`|(k, v), acc|`)
  - `super` with bare arguments
  - Proc call syntax (`proc_var.(args)`)
  - Backslash line continuation
  - Pattern binding in `case/in`
- `private def`, `protected def`, `private_class_method def` now correctly recognized as block openers for indentation
- Mixed `do/end` + `{}` block nesting no longer confuses the deindent scanner
- `super` highlighted as keyword

### Changed

- Parse accuracy improved significantly (85-91% → 93-98%) across all benchmark files

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
