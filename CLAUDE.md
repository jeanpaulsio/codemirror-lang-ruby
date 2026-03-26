# CLAUDE.md

## Project: codemirror-lang-ruby

A Lezer grammar and CodeMirror 6 language package for Ruby. The goal is comprehensive, production-quality Ruby syntax highlighting and editor support.

## Tech Stack

- **Grammar**: Lezer (`.grammar` files compiled to LR parse tables)
- **Language package**: TypeScript, exports `ruby()` LanguageSupport for CodeMirror 6
- **Build**: Rollup with `@lezer/generator/rollup` plugin + `@rollup/plugin-typescript`
- **Test**: Mocha + Lezer's `fileTests` format (`.txt` files in `test/`)
- **No framework, no UI** -- this is a pure library package

## Commands

```bash
npm install          # Install dependencies
npm run build        # Build grammar + bundle to dist/
npm test             # Run all grammar tests
npm run test:watch   # Watch mode for tests
npm run lint         # TypeScript type check
```

## Architecture

```
src/
  syntax.grammar      # The Lezer grammar definition (THE core artifact)
  syntax.grammar.d.ts # Type declaration so TS can import .grammar
  tokens.ts           # External tokenizers (Phase 2+: string interpolation, heredocs, regex)
  highlight.ts        # Maps grammar node names to @lezer/highlight tags
  index.ts            # Exports LRLanguage + LanguageSupport wrapper
test/
  test.js             # Mocha runner that loads all .txt test files
  literals.txt        # Test cases for literals (strings, numbers, symbols, etc.)
  statements.txt      # Test cases for statements (def, class, if, while, etc.)
  expressions.txt     # Test cases for expressions (assignment, method calls, blocks, etc.)
```

### How Lezer grammars work

- `syntax.grammar` is a declarative LR grammar. The `@lezer/generator` compiles it into parse tables.
- The Rollup `lezer()` plugin handles this at build time -- `src/index.ts` imports `parser` from `"./syntax.grammar"`.
- `highlight.ts` maps node names from the grammar to CodeMirror highlight tags (keyword, string, comment, etc.).
- `index.ts` wraps the parser in `LRLanguage.define()` and adds indent/fold props.

### How tests work

Tests use Lezer's `fileTests` format. Each `.txt` file in `test/` contains test cases:

```
# Test Name

source code here

==>

ExpectedTree(Node(ChildNode, ChildNode))
```

The test runner (`test/test.js`) loads all `.txt` files, parses each source with the grammar, and asserts the tree matches. Run with `npm test`.

**IMPORTANT**: Always run `npm run build` before `npm test`. Tests import from `dist/`, not `src/`.

### Adding a new test

1. Pick the right file (`literals.txt`, `statements.txt`, `expressions.txt`) or create a new one
2. Add a test case in the fileTests format
3. Run `npm run build && npm test`
4. If the test fails, inspect the actual tree output to understand what the parser produced
5. Fix the grammar, rebuild, retest

### Key references

- **Lezer grammar guide**: https://lezer.codemirror.net/docs/guide/
- **Lezer reference**: https://lezer.codemirror.net/docs/ref/
- **tree-sitter-ruby** (reference grammar): https://github.com/tree-sitter/tree-sitter-ruby
- **Ruby syntax docs**: https://docs.ruby-lang.org/en/master/syntax_rdoc.html
- **@lezer/python** (example of similar complexity): https://github.com/lezer-parser/python
- **@lezer/javascript** (example of regex/division ambiguity): https://github.com/lezer-parser/javascript
- **codemirror/lang-example** (template for lang packages): https://github.com/codemirror/lang-example
- **jared-hughes/codemirror-lang-ruby** (prior partial attempt, 840 lines): https://github.com/jared-hughes/codemirror-lang-ruby

## Current State

Phase 1 complete. The grammar builds cleanly and all 26 tests pass.

What works:
- Literals: integers, floats, strings (single/double quote), symbols, arrays, hashes (rocket `=>` only), nil, true, false
- Definitions: methods (with params), classes (with inheritance), modules
- Control flow: if/elsif/else, unless, while, until, for/in, case/when
- Error handling: begin/rescue/ensure/raise
- Expressions: assignment, method calls (with receiver or args), chained calls, binary ops, unary ops, ternary
- Lambdas: `->` syntax with brace or do/end blocks
- Ranges: `..` and `...`
- Variables: local, @instance, @@class, $global, Constants
- Comments: line `#` and block `=begin/=end`
- Highlight: path-based selectors for method names (`MethodDef/Identifier`, `MethodCall/Identifier`)
- Editor: basic indentation, folding, comment toggling, bracket closing
- CI: GitHub Actions runs lint + build + test on every PR

Known limitations (to be addressed in later phases):
- No string interpolation (`"hello #{name}"`)
- No block attachment to method calls without parens (`items.each { |x| x }`)
- No hash symbol-key shorthand (`{ name: "Alice" }`)
- No bare method calls (`puts "hello"`)
- No regex literals (ambiguous with division)
- MethodName merged into Identifier (no `=` suffix on setter methods)
- `semi` is optional on ExpressionStatement (workaround for EOF handling)

## Roadmap

### Phase 1: Stabilize the starter grammar ✅
- [x] Get `npm run build` passing cleanly
- [x] Get all existing test cases passing (26/26)
- [x] Fix all shift/reduce and reduce/reduce conflicts
- [x] Set up GitHub Actions CI

### Phase 2: String interpolation and external tokenizers
This phase introduces `src/tokens.ts` -- our first external tokenizer file.

- [ ] String interpolation: `"hello #{name}"` -- use `@local tokens` pattern (see `@lezer/javascript` template literals)
- [ ] Heredocs: `<<~RUBY`, `<<-RUBY`, `<<RUBY` -- needs `ContextTracker` to store delimiter
- [ ] `%`-literals: `%w[a b c]`, `%i[foo bar]`, `%q(string)`, `%Q(string)`, `%r(regex)`
- [ ] Character literals: `?a`

**What's an external tokenizer?** The `.grammar` file can only express regular patterns. Some Ruby syntax needs runtime logic:
- String interpolation requires tracking `#{}` brace depth inside strings
- Heredocs require remembering an arbitrary delimiter word
- Regex vs division requires knowing what token came before `/`

An external tokenizer is a TypeScript function that the parser calls when it needs a token the grammar can't express. It reads characters from the input stream, decides what token to emit, and hands control back to the parser. Declared in the grammar with `@external tokens tokenizer from "./tokens" { Token1, Token2 }` and implemented in `src/tokens.ts` as `ExternalTokenizer` instances. See `@lezer/javascript` and `@lezer/python` for working examples.

### Phase 3: Block attachment + method call edge cases
- [ ] Block/DoBlock attachment to method calls: `items.each { |x| x }`, `items.each do |x| x end`
- [ ] Hash symbol-key shorthand: `{ name: "Alice" }` (needs `:` vs Symbol disambiguation)
- [ ] Bare method calls without parens: `puts "hello"`, `attr_reader :name`
- [ ] Operator method definitions: `def <=>(other)`, `def [](index)`, `def []=(index, val)`
- [ ] Method names with `?`, `!`, `=` suffixes (separate MethodName token, context-dependent)
- [ ] Splat in method calls: `foo(*args, **kwargs, &block)`
- [ ] Safe navigation: `obj&.method`

### Phase 4: Regex + more operators
- [ ] Regex: `/` vs division ambiguity (external tokenizer checks preceding context)
- [ ] Conditional assignment: `||=`, `&&=`
- [ ] Multiple assignment: `a, b = 1, 2`
- [ ] Destructuring: `a, *b = [1, 2, 3]`
- [ ] Defined? operator
- [ ] Endless method: `def square(x) = x * x` (Ruby 3.0+)
- [ ] Numbered block params: `_1`, `_2` (Ruby 2.7+)
- [ ] Proc/lambda: `proc { }`, `lambda { }`, `Proc.new { }`

### Phase 5: Pattern matching (Ruby 3.0+)
- [ ] `case/in` pattern matching
- [ ] Array patterns: `in [x, y, *rest]`
- [ ] Hash patterns: `in { name:, age: }`
- [ ] Find patterns: `in [*, x, *]`
- [ ] Guard clauses: `in x if x > 0`
- [ ] Pin operator: `in ^variable`

### Phase 6: Editor integration
This is what makes the package actually *usable* in an editor, not just a parser.

- [ ] **Indentation**: proper `indentNodeProp` for every block construct; use `delimitedIndent` for `[]`/`{}`; deindent on `end`/`else`/`elsif`/`when`/`rescue`/`ensure`
- [ ] **Folding**: fold ranges for method/class/module bodies, blocks, multiline strings, heredocs
- [ ] **Autocompletion**: keyword completions (`def`, `class`, `if`, `end`, etc.) via `completeFromList()`; snippets for common patterns (`def...end`, `class...end`, `begin...rescue...end`)
- [ ] **Error recovery**: add `@isGroup` for expressions/statements; add `[isolate]` on strings/comments for better incremental parsing
- [ ] **Comprehensive tests**: 50+ test cases covering edge cases, error recovery, and real-world Ruby patterns (Rails, RSpec)

### Phase 7: Production readiness
- [ ] Performance testing with large files (1000+ lines of real Rails code)
- [ ] npm package publishing setup (README, LICENSE, .npmignore, package.json metadata)
- [ ] Demo page / playground (CodeMirror editor with Ruby highlighting)
- [ ] Comparison testing against tree-sitter-ruby's test corpus

## Coding Standards

- **Test-driven**: Write the test case first, then fix the grammar to make it pass
- **Incremental**: Each PR should tackle one construct or one phase item
- **Build before test**: Always `npm run build && npm test`
- **Grammar comments**: Add comments in `syntax.grammar` explaining non-obvious rules
- **Reference tree-sitter-ruby**: When in doubt about how Ruby parses something, check tree-sitter-ruby's grammar and test corpus
- **External tokenizers**: When the grammar notation can't express something (string interpolation, heredocs, regex/division ambiguity), use external tokenizers in a separate `tokens.ts` file. See `@lezer/python` and `@lezer/javascript` for examples.

## Known Hard Problems

These are documented so you can plan around them:

1. **`/` ambiguity**: `/regex/` vs `a / b`. Requires an external tokenizer that tracks whether a `/` is in a "regex-allowed" position (after operators, keywords, `(`, `[`, etc.) vs "division" position (after identifiers, numbers, `)`, `]`). See `@lezer/javascript` for exactly this pattern.

2. **String interpolation**: `"hello #{1 + 2}"` nests arbitrary Ruby expressions inside strings. Requires an external tokenizer that tracks brace depth. See `@lezer/javascript` template literal handling.

3. **Heredocs**: `<<~RUBY\n  code\nRUBY` -- the delimiter is arbitrary, can be indented, and can stack (`<<A; <<B`). This is one of the hardest parts. tree-sitter-ruby uses an external scanner for this.

4. **Optional parentheses**: `puts "hello"` and `puts("hello")` are both valid. This creates ambiguity in the grammar. Lezer's GLR mode (`@ambiguity`) may help, but method calls without parens are the biggest source of parse conflicts in Ruby.

## Git Workflow

- Always work on a branch, never push to main directly
- Use conventional commits: `feat:`, `fix:`, `test:`, `refactor:`, `docs:`
- Each PR should be focused on one thing
- Run `npm run build && npm test` before committing
