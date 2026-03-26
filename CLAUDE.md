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
- [x] Get all existing test cases passing
- [x] Fix all shift/reduce and reduce/reduce conflicts
- [x] Set up GitHub Actions CI

### Phase 2: String interpolation and literals ✅
- [x] String interpolation: `"hello #{name}"` via `@local tokens` pattern
- [x] `%`-literals: `%w[a b c]`, `%i[foo bar]`, `%q(string)`, `%Q(string)` with `[]`, `()`, `{}`, `<>` delimiters
- [x] Character literals: `?a`, `?\n`

### Phase 3: Method call edge cases ✅ (partial)
- [x] Hash symbol-key shorthand: `{ name: "Alice" }`
- [x] Splat in method calls: `foo(*args, **kwargs, &block)`
- [x] Safe navigation: `obj&.method`
- Deferred to external tokenizer (see open issues):
  - Block/DoBlock attachment (#8)
  - Bare method calls without parens (#9)

### Phase 4: Operators and constructs ✅ (partial)
- [x] Conditional assignment: `||=`, `&&=` (already in AssignOp)
- [x] Multiple assignment: `a, b = 1, 2`
- [x] Destructuring: `a, *b = [1, 2, 3]`
- [x] Endless method: `def square(x) = x * x` (Ruby 3.0+)
- [x] Operator precedence: `**` @right > `*`/`/` @left > `+`/`-` @left
- Deferred to external tokenizer:
  - Regex `/` vs division (#7)

### Phase 5: Pattern matching (Ruby 3.0+) ✅ (partial)
- [x] `case/in` pattern matching with `InClause`
- [x] Pin operator: `in ^variable` (scoped to InClause)
- Deferred:
  - Guard clauses (`in x if x > 0`) — conflicts with IfStatement in LR parser

### Phase 6: Editor integration ✅
- [x] Indentation: `indentNodeProp` for all block constructs, `delimitedIndent` for `[]`/`{}`/`()`
- [x] Folding: method/class/module bodies, blocks, control flow, strings
- [x] Autocompletion: 31 Ruby keywords via `completeFromList()`
- [x] Bracket closing, comment toggling
- [x] 67 test cases

### Phase 7: Production readiness ✅
- [x] Demo page with GitHub Pages deployment
- [x] README with installation and usage docs
- [x] LICENSE (MIT)

### Open issues (external tokenizer required)
These are the remaining hard problems that need `src/tokens.ts`:
- [#7](https://github.com/jeanpaulsio/codemirror-lang-ruby/issues/7) — Regex literals (`/pattern/` vs division)
- [#8](https://github.com/jeanpaulsio/codemirror-lang-ruby/issues/8) — Block attachment to method calls
- [#9](https://github.com/jeanpaulsio/codemirror-lang-ruby/issues/9) — Bare method calls without parens
- [#10](https://github.com/jeanpaulsio/codemirror-lang-ruby/issues/10) — Heredoc support
- [#11](https://github.com/jeanpaulsio/codemirror-lang-ruby/issues/11) — `%`-literal interpolation and non-bracket delimiters

## Coding Standards

- **Test-driven**: Write the test case first, then fix the grammar to make it pass
- **Incremental**: Each PR should tackle one construct or one phase item
- **Build before test**: Always `npm run build && npm test`
- **Grammar comments**: Add comments in `syntax.grammar` explaining non-obvious rules
- **Reference tree-sitter-ruby**: When in doubt about how Ruby parses something, check tree-sitter-ruby's grammar and test corpus
- **External tokenizers**: When the grammar notation can't express something (string interpolation, heredocs, regex/division ambiguity), use external tokenizers in a separate `tokens.ts` file. See `@lezer/python` and `@lezer/javascript` for examples.

## Known Hard Problems

These require an external tokenizer (`src/tokens.ts`) and are tracked as GitHub issues:

1. **`/` ambiguity** (#7): `/regex/` vs `a / b`. Requires an external tokenizer that checks preceding context. See `@lezer/javascript` for this pattern.

2. **Block attachment** (#8): `items.each { |x| x }`. The `MethodCall` expression reduces before `{` can attach. Needs grammar restructure or external tokenizer.

3. **Optional parentheses** (#9): `puts "hello"` vs `puts("hello")`. The biggest source of parse conflicts in Ruby. tree-sitter-ruby uses an external scanner.

4. **Heredocs** (#10): `<<~RUBY\n  code\nRUBY`. The delimiter is arbitrary, can be indented, and can stack. Needs a `ContextTracker`.

5. **String interpolation** is SOLVED -- uses `@local tokens` pattern from `@lezer/javascript`.

## Git Workflow

- Always work on a branch, never push to main directly
- Use conventional commits: `feat:`, `fix:`, `test:`, `refactor:`, `docs:`
- Each PR should be focused on one thing
- Run `npm run build && npm test` before committing
