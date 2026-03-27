// Quick check of all grammar bugs from grammar-bug-list.md
import { rubyLanguage } from "../dist/index.js";

function hasError(code) {
  const tree = rubyLanguage.parser.parse(code);
  let found = false;
  tree.iterate({ enter(node) { if (node.type.isError) found = true; } });
  return found;
}

function check(label, code, expectPass = true) {
  const err = hasError(code);
  const status = expectPass ? (err ? "FAIL" : "PASS") : (err ? "expected-fail" : "FIXED!");
  if (status === "FAIL" || status === "FIXED!") {
    console.log(`  ${status}: ${label}`);
  }
  return { label, status };
}

const results = { pass: 0, fail: 0, expectedFail: 0, fixed: 0 };

function section(name, tests) {
  console.log(`\n${name}`);
  for (const [label, code, expectPass] of tests) {
    const r = check(label, code, expectPass);
    if (r.status === "PASS") results.pass++;
    else if (r.status === "FAIL") results.fail++;
    else if (r.status === "expected-fail") results.expectedFail++;
    else if (r.status === "FIXED!") results.fixed++;
  }
}

// BUG-001: Blank lines
section("BUG-001: Blank lines between statements", [
  ["blank line between stmts", "x = 1\n\ny = 2", true],
  ["blank line after comment", "# comment\n\nx = 1", true],
  ["blank line before def", "x = 1\n\ndef foo\nend", true],
  ["blank line in class body", "class Foo\n\n  def bar\n    1\n  end\n\nend", true],
  ["blank lines between methods", "class Foo\n  def a\n    1\n  end\n\n  def b\n    2\n  end\nend", true],
  ["blank line between when", "case x\nwhen 1\n  a\n\nwhen 2\n  b\nend", true],
]);

// BUG-002: Multi-line arrays
section("BUG-002: Multi-line arrays", [
  ["array across lines", "[1,\n2]", true],
  ["array indented", "[\n  1,\n  2\n]", true],
  ["array trailing comma", "[\n  1,\n  2,\n]", true],
  ["trailing comma single line", "[1, 2, 3,]", true],
]);

// BUG-003: Multi-line hashes
section("BUG-003: Multi-line hashes", [
  ["hash multi-line symbol keys", "{\n  a: 1,\n  b: 2\n}", true],
  ["hash trailing comma", "{\n  a: 1,\n  b: 2,\n}", true],
  ["hash trailing comma single", "{ a: 1, b: 2, }", true],
  ["hash rocket multi-line", "{\n  :a => 1,\n  :b => 2,\n}", true],
  ["nested multi-line hash", "{\n  a: {\n    b: 1,\n  },\n}", true],
]);

// BUG-004: Multi-line method calls
section("BUG-004: Multi-line method calls", [
  ["multi-line call", "foo(\n  1,\n  2\n)", true],
  ["multi-line trailing comma", "foo(\n  1,\n  2,\n)", true],
  ["trailing comma single line", "foo(1, 2,)", true],
]);

// BUG-005: Keyword arguments
section("BUG-005: Keyword arguments", [
  ["keyword arg in def", "def foo(name:, age: 0)\n  1\nend", true],
  ["keyword arg with default", "def foo(x: 1)\n  1\nend", true],
  ["keyword args in call", "foo(name: \"x\", age: 1)", true],
  ["keyword arg hash value", "foo(config: { a: 1 })", true],
  ["keyword arg array value", "foo(ids: [1, 2, 3])", true],
]);

// BUG-006: Bare calls with keyword args
section("BUG-006: Bare calls with keyword args", [
  ["gem with version", 'gem "rails", "~> 7.1"', true],
  ["gem with require", 'gem "pg", "~> 1.5", require: false', true],
  ["validates", "validates :email, presence: true", true],
  ["validates multi", "validates :email, presence: true, uniqueness: true", true],
  ["has_many", "has_many :posts, dependent: :destroy", true],
  ["has_many through", "has_many :comments, through: :posts", true],
  ["belongs_to", "belongs_to :user, optional: true", true],
  ["before_action", "before_action :auth, only: [:show]", true],
  ["before_action multi", "before_action :auth, only: [:show, :edit]", true],
  ["render with kw", "render :new, status: :unprocessable_entity", true],
  ["render json", "render json: @user, status: :ok", true],
  ["redirect_to", 'redirect_to root_path, notice: "Done"', true],
  ["delegate", "delegate :name, to: :user, prefix: true", true],
  ["scope", "scope :active, -> { where(active: true) }", true],
]);

// BUG-007: rescue => e
section("BUG-007: rescue => e", [
  ["rescue => e in begin", "begin\n  x\nrescue => e\n  y\nend", true],
  ["rescue => e in def", "def foo\n  x\nrescue => e\n  y\nend", true],
  ["inline rescue", "value = foo rescue default", true],
]);

// BUG-008: Nested class/module bodies
section("BUG-008: Nested class/module bodies", [
  ["class with method", "class Foo\n  def bar\n    1\n  end\nend", true],
  ["module with class", "module M\n  class C\n  end\nend", true],
  ["deep nesting", "module M\n  class C\n    def f\n      1\n    end\n  end\nend", true],
]);

// BUG-009: Assignment with keyword expressions
section("BUG-009: Assignment with keyword expressions", [
  ["assign if", "x = if condition\n  1\nend", true],
  ["assign if/else", "x = if true\n  1\nelse\n  2\nend", true],
  ["assign unless", "x = unless false\n  1\nend", true],
  ["assign case", "x = case y\nwhen 1\n  \"a\"\nend", true],
  ["assign begin/rescue", "x = begin\n  foo\nrescue\n  bar\nend", true],
  ["||= begin", "@x ||= begin\n  1\nend", true],
]);

// BUG-010: Block pass
section("BUG-010: Block pass", [
  ["&:symbol", "items.map(&:to_s)", true],
  ["&method", "items.map(&method(:puts))", true],
  ["&lambda", "items.map(&-> (x) { x })", true],
  ["&block var", "items.map(&block)", true],
]);

// BUG-011: Operators
section("BUG-011: Operators", [
  ["bitwise and", "a & b", true],
  ["bitwise or", "a | b", true],
  ["bitwise xor", "a ^ b", true],
  ["shift left", "a << b", true],
  ["shift right", "a >> b", true],
  ["complement", "~a", true],
  ["match =~", "a =~ /pattern/", true],
  ["not match !~", "a !~ /pattern/", true],
  ["unary plus", "+a", true],
  ["compound +=", "x += 1", true],
  ["compound **=", "x **= 2", true],
  ["compound >>=", "x >>= 1", true],
  ["compound |=", "x |= 1", true],
  ["compound &=", "x &= 1", true],
  ["compound ^=", "x ^= 1", true],
]);

// BUG-012: raise with args
section("BUG-012: raise with args", [
  ["raise string", 'raise "error"', true],
  ["raise class, msg", 'raise ArgumentError, "msg"', true],
  ["raise in def", 'def foo\n  raise ArgumentError, "msg"\nend', true],
]);

// BUG-013: Multi-line chaining
section("BUG-013: Multi-line chaining", [
  ["leading dot", "foo\n  .bar\n  .baz", true],
  ["trailing dot", "foo.\n  bar.\n  baz", true],
]);

// BUG-014: return/yield at top level
section("BUG-014: return/yield top level", [
  ["return top", "return", true],
  ["return 1 top", "return 1", true],
  ["yield top", "yield", true],
  ["yield(1) top", "yield(1)", true],
  ["raise string top", 'raise "error"', true],
]);

// BUG-015: Scoped class/module defs
section("BUG-015: Scoped class/module", [
  ["class Foo::Bar", "class Foo::Bar\nend", true],
  ["class Foo::Bar < Baz", "class Foo::Bar < Baz\nend", true],
  ["module Foo::Bar", "module Foo::Bar\nend", true],
  ["Foo::BAR = 1", "Foo::BAR = 1", true],
  ["::TopLevel", "::TopLevel", true],
]);

// BUG-016: Symbol edge cases
section("BUG-016: Symbol edge cases", [
  [":foo?", ":foo?", true],
  [":foo!", ":foo!", true],
  [":==", ":==", true],
  [":[]", ":[]", true],
  [':"hello"', ':"hello world"', true],
  [':"hello #{name}"', ':"hello #{name}"', true],
]);

// BUG-017: Operator method defs
section("BUG-017: Operator method defs", [
  ["def <=>", "def <=>(other)\n  1\nend", true],
  ["def []", "def [](index)\n  1\nend", true],
  ["def []=", "def []=(index, value)\n  1\nend", true],
]);

// BUG-018: while/until do
section("BUG-018: while/until do", [
  ["while do", "while condition do\n  body\nend", true],
  ["until do", "until condition do\n  body\nend", true],
]);

// BUG-019: Block param destructuring
section("BUG-019: Block param destructuring", [
  ["|(a, b)|", "foo { |(a, b)| a }", true],
]);

// BUG-020: enum DSL
section("BUG-020: enum DSL", [
  ["enum role", "enum role: { user: 0, admin: 1 }", true],
]);

// BUG-021: super with bare args
section("BUG-021: super bare args", [
  ["super 1, 2", "super 1, 2", true],
]);

// BUG-022: endless self method
section("BUG-022: endless self method", [
  ["def self.foo(x) = x + 1", "def self.foo(x) = x + 1", true],
]);

// BUG-023: Multi-line def params
section("BUG-023: Multi-line def params", [
  ["multi-line params", "def foo(\n  x,\n  y\n)\n  1\nend", true],
]);

// BUG-024: Special globals
section("BUG-024: Special globals", [
  ["$!", "$!", true],
  ["$~", "$~", true],
  ["$&", "$&", true],
  ["$;", "$;", true],
  ["$,", "$,", true],
]);

// BUG-025: proc.() syntax
section("BUG-025: proc.() syntax", [
  ["my_proc.(1)", "my_proc.(1)", true],
]);

// BUG-026: Pattern matching hash
section("BUG-026: Pattern matching", [
  ["hash pattern", 'case {name: "x"}\nin {name: String => n}\n  n\nend', true],
  ["guard clause", "case x\nin Integer => n if n > 0\n  n\nend", true],
  ["find pattern", "case [1, 2, 3]\nin [*, 2, *]\n  true\nend", true],
]);

// BUG-027: Lambda without parens
section("BUG-027: Lambda no parens", [
  ["-> x { x }", "-> x { x }", true],
]);

// BUG-028: Heredoc as argument
section("BUG-028: Heredoc as argument", [
  ["foo(<<~SQL)", "foo(<<~SQL)\n  SELECT 1\nSQL", true],
  ["heredoc.strip", "<<~HEREDOC.strip\n  hello\nHEREDOC", true],
]);

// BUG-029: Backslash continuation
section("BUG-029: Backslash continuation", [
  ["backslash join", 'x = "hello " \\\n  "world"', true],
]);

// BUG-030: respond_to
section("BUG-030: respond_to block", [
  ["respond_to", "respond_to do |format|\n  format.html\n  format.json { render json: @x }\nend", true],
]);

// BUG-031: Struct.new
section("BUG-031: Struct.new", [
  ["Struct.new(:a, :b)", "Foo = Struct.new(:a, :b)", true],
]);

// BUG-033: raise class, message
section("BUG-033: raise class, msg", [
  ["raise ArgumentError, msg", 'raise ArgumentError, "bad input"', true],
  ["raise Class.new(msg)", 'raise ArgumentError.new("bad input")', true],
]);

// BUG-034: Complex params
section("BUG-034: Complex params", [
  ["all param types", "def foo(a, b = 1, *c, d:, e: 2, **f, &g)\n  1\nend", true],
]);

// BUG-035: Keyword args with receiver (obj.foo(kw: 1))
section("BUG-035: Keyword args with receiver", [
  ["obj.foo(a: 1)", "obj.foo(a: 1)", true],
  ["obj.foo(1, a: 1)", "obj.foo(1, a: 1)", true],
  ["Foo.bar(a: 1)", "Foo.bar(a: 1)", true],
  ["@x.foo(a: 1)", "@x.foo(a: 1)", true],
  ["self.foo(a: 1)", "self.foo(a: 1)", true],
  ["User.where(active: true).order(:name)", "User.where(active: true).order(:name)", true],
  ["posts.update_all(hidden: true)", "posts.update_all(hidden: true)", true],
  // Regression checks
  ["foo(a: 1) — no receiver", "foo(a: 1)", true],
  ["obj.foo(1) — positional with receiver", "obj.foo(1)", true],
  ["obj.foo(1, 2) — multiple positional with receiver", "obj.foo(1, 2)", true],
]);

// BUG-036: Scoped constants in rescue
section("BUG-036: Scoped constants in rescue", [
  ["rescue Foo::Bar => e", "begin\n  x\nrescue Foo::Bar => e\n  y\nend", true],
  ["rescue Foo::Bar, Baz => e", "begin\n  x\nrescue Foo::Bar, Baz => e\n  y\nend", true],
  ["rescue Foo::Bar::Baz => e", "begin\n  x\nrescue Foo::Bar::Baz => e\n  y\nend", true],
  ["rescue Foo => e — still works", "begin\n  x\nrescue Foo => e\n  y\nend", true],
  ["rescue StandardError => e — still works", "begin\n  x\nrescue StandardError => e\n  y\nend", true],
]);

// BUG-037: New bare method names
section("BUG-037: New bare methods", [
  ["skip_before_action", "skip_before_action :auth", true],
  ["skip_after_action", "skip_after_action :log", true],
  ["skip_around_action", "skip_around_action :wrap", true],
  ["class_methods", "class_methods :foo", true],
  ["included", "included :mod", true],
  ["concerning", 'concerning :Authentication', true],
  ["validates_presence_of", "validates_presence_of :name", true],
  ["validates_uniqueness_of", "validates_uniqueness_of :email", true],
  ["validates_length_of", "validates_length_of :name, maximum: 100", true],
  ["validates_format_of", 'validates_format_of :email, with: /\\A.+@.+\\z/', true],
  ["has_and_belongs_to_many", "has_and_belongs_to_many :tags", true],
  ["after_initialize", "after_initialize :setup", true],
  ["after_find", "after_find :decorate", true],
  ["before_destroy", "before_destroy :cleanup", true],
  ["after_destroy", "after_destroy :log_deletion", true],
  ["before_update", "before_update :normalize", true],
  ["after_update", "after_update :broadcast", true],
  ["before_validation", "before_validation :strip_whitespace", true],
  ["after_validation", "after_validation :set_slug", true],
  ["rescue_from", "rescue_from StandardError, with: :handle", true],
  ["helper_method", "helper_method :current_user", true],
  ["helper", "helper :formatting", true],
  ["memoize", "memoize :expensive_calc", true],
  ["freeze", "freeze :config", true],
]);

// BUG-035 integration: realistic multi-line code with receiver + kw args
section("BUG-035: Integration", [
  ["ActiveRecord where + order", "User.where(active: true, role: :admin).order(created_at: :desc)", true],
  ["multi-line chained call", "Post\n  .where(published: true)\n  .order(date: :desc)\n  .limit(10)", true],
  ["update_all in class", "class PostCleaner\n  def run\n    Post.where(stale: true).update_all(hidden: true)\n  end\nend", true],
]);

// Summary
console.log("\n--- SUMMARY ---");
console.log(`PASS: ${results.pass}`);
console.log(`FAIL: ${results.fail}`);
console.log(`FIXED (was expected-fail): ${results.fixed}`);
console.log(`Expected failures: ${results.expectedFail}`);
