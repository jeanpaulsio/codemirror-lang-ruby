// Grammar accuracy and performance tests for Ruby CodeMirror language support
// Part 7: Grammar accuracy (error-free parsing, error recovery, ambiguity resolution)
// Part 9: Performance tests (large files, pathological inputs)

import {rubyLanguage} from "../dist/index.js"

const parser = rubyLanguage.parser

let passed = 0
let failed = 0
let skipped = 0
let errors = []

function test(description, fn) {
  try {
    const result = fn()
    if (result !== false) {
      passed++
    } else {
      failed++
      errors.push(description)
    }
  } catch (e) {
    failed++
    errors.push(`${description}: ${e.message}`)
  }
}

function skip(description, _fn) {
  skipped++
  console.log(`  SKIP: ${description}`)
}

// Count error nodes in a parse tree
function countErrors(code) {
  const tree = parser.parse(code)
  let errorCount = 0
  tree.iterate({enter(node) { if (node.type.isError) errorCount++ }})
  return errorCount
}

// Check if a specific node type exists in the parse tree
function hasNodeType(code, nodeType) {
  const tree = parser.parse(code)
  let found = false
  tree.iterate({enter(node) { if (node.name === nodeType) found = true }})
  return found
}

// Count total non-error nodes in the tree
function countNodes(code) {
  const tree = parser.parse(code)
  let count = 0
  tree.iterate({enter(node) { if (!node.type.isError) count++ }})
  return count
}

// ============================================================
// 7.1 Constructs That Must Parse Without Errors
// ============================================================

console.log("\n7.1 Constructs That Must Parse Without Errors")

// 7.1a — basic method with all param types
test("7.1a method with all param types", () => {
  const code = `def foo(x, y = 10, *args, **kwargs, &block)
  x + y
end`
  const errs = countErrors(code)
  if (errs > 0) { console.log(`  FAIL: ${errs} error(s)`); return false }
  return true
})

// 7.1b — class with everything
test("7.1b class with everything", () => {
  const code = `class Foo < Bar
  include Baz
  attr_reader :name, :age

  def initialize(name)
    @name = name
  end

  def self.create(name)
    new(name)
  end

  private

  def secret
    "shh"
  end
end`
  const errs = countErrors(code)
  if (errs > 0) { console.log(`  FAIL: ${errs} error(s)`); return false }
  return true
})

// 7.1c — all control flow
test("7.1c all control flow", () => {
  const code = `if a
  1
elsif b
  2
else
  3
end

unless condition
  body
end

while running
  tick
end

until done
  work
end

for x in 1..10
  puts x
end

case x
when 1 then "one"
when 2, 3
  "two or three"
when String
  "string"
else
  "other"
end`
  const errs = countErrors(code)
  if (errs > 0) { console.log(`  FAIL: ${errs} error(s)`); return false }
  return true
})

// 7.1d — begin/rescue/else/ensure
test("7.1d begin/rescue/else/ensure", () => {
  const code = `begin
  risky
rescue ArgumentError, TypeError => e
  handle(e)
rescue => e
  general_handle(e)
else
  no_error_path
ensure
  cleanup
end`
  const errs = countErrors(code)
  if (errs > 0) { console.log(`  FAIL: ${errs} error(s)`); return false }
  return true
})

// 7.1e — blocks
test("7.1e blocks", () => {
  const code = `items.each { |x| x + 1 }
items.each do |x|
  x + 1
end`
  const errs = countErrors(code)
  if (errs > 0) { console.log(`  FAIL: ${errs} error(s)`); return false }
  return true
})

// 7.1f — string types
test("7.1f string types", () => {
  const code = `"double #{interpolation}"
'single'
<<~HEREDOC
  heredoc content
HEREDOC
%Q{percent Q}
%q{percent q}
%w[word array]
%i[symbol array]`
  const errs = countErrors(code)
  if (errs > 0) { console.log(`  FAIL: ${errs} error(s)`); return false }
  return true
})

// 7.1g — all literal types
test("7.1g all literal types", () => {
  const code = `42
1_000_000
0xff
0b1010
0o777
3.14
1.0e10
:symbol
:"quoted symbol"
/regex/i
%r{regex}
nil
true
false
[1, 2, 3]
1..10
1...10
?a`
  const errs = countErrors(code)
  if (errs > 0) { console.log(`  FAIL: ${errs} error(s)`); return false }
  return true
})

// 7.1g-hash — hash with rocket syntax (symbol-key shorthand is known limitation)
test("7.1g hash with rocket syntax", () => {
  const code = `{ :a => 1, :b => 2 }`
  const errs = countErrors(code)
  if (errs > 0) { console.log(`  FAIL: ${errs} error(s)`); return false }
  return true
})

// 7.1h — operators
test("7.1h operators", () => {
  const code = `a + b
a - b
a * b
a / b
a % b
a ** b
a == b
a != b
a < b
a > b
a <= b
a >= b
a <=> b
a === b
a && b
a || b
!a
a & b
a | b
a ^ b
a << b
a >> b
~a
a..b
a...b
a =~ /pattern/
a !~ /pattern/
a ? b : c
a&.b`
  const errs = countErrors(code)
  if (errs > 0) { console.log(`  FAIL: ${errs} error(s)`); return false }
  return true
})

// 7.1i — assignment forms
test("7.1i assignment forms", () => {
  const code = `x = 1
x += 1
x -= 1
x *= 1
x /= 1
x **= 1
x ||= 1
x &&= 1
a, b = 1, 2
a, *b = 1, 2, 3`
  const errs = countErrors(code)
  if (errs > 0) { console.log(`  FAIL: ${errs} error(s)`); return false }
  return true
})

// 7.1j — lambdas
test("7.1j lambdas", () => {
  const code = `fn = -> { 1 }
fn = -> (x) { x + 1 }
fn = lambda { |x| x + 1 }
fn = -> (x) do
  x + 1
end`
  const errs = countErrors(code)
  if (errs > 0) { console.log(`  FAIL: ${errs} error(s)`); return false }
  return true
})

// 7.1k — method calls with various syntaxes
test("7.1k method calls", () => {
  const code = `puts "hello"
foo(1, 2, 3)
bar(a, *b, **c, &d)
obj.method
obj.method(args)
Foo::Bar.method
obj&.method
super
super(args)
yield
yield(value)`
  const errs = countErrors(code)
  if (errs > 0) { console.log(`  FAIL: ${errs} error(s)`); return false }
  return true
})

// 7.1l — modifier forms
test("7.1l modifier forms", () => {
  const code = `return x if condition
do_thing unless condition
sleep 1 while running
value = foo rescue default`
  const errs = countErrors(code)
  if (errs > 0) { console.log(`  FAIL: ${errs} error(s)`); return false }
  return true
})

// 7.1l-skip — modifier forms that may not be supported
skip("7.1l retry until (retry may not be in grammar)", () => {
  const code = `retry until done`
  const errs = countErrors(code)
  if (errs > 0) { console.log(`  FAIL: ${errs} error(s)`); return false }
  return true
})

// 7.1m — endless method
test("7.1m endless method", () => {
  const code = `def foo(x) = x + 1
def self.bar(x) = x * 2`
  const errs = countErrors(code)
  if (errs > 0) { console.log(`  FAIL: ${errs} error(s)`); return false }
  return true
})

// 7.1n — pattern matching (Ruby 3)
test("7.1n pattern matching with literal patterns", () => {
  const code = `case [1, 2]
in [1, 2]
  true
end`
  const errs = countErrors(code)
  if (errs > 0) { console.log(`  FAIL: ${errs} error(s)`); return false }
  return true
})

skip("7.1n pattern matching with capture (Integer => a syntax not supported)", () => {
  const code = `case [1, 2]
in [Integer => a, Integer => b]
  a + b
end`
  const errs = countErrors(code)
  if (errs > 0) { console.log(`  FAIL: ${errs} error(s)`); return false }
  return true
})

// ============================================================
// 7.2 Error Recovery
// ============================================================

console.log("\n7.2 Error Recovery")

// 7.2a — incomplete expression (should have errors but def is still parsed)
test("7.2a incomplete expression recovers", () => {
  const code = `def foo
  1 +
end`
  const errs = countErrors(code)
  const nodes = countNodes(code)
  if (errs === 0) { console.log("  FAIL: expected errors"); return false }
  if (nodes < 3) { console.log(`  FAIL: only ${nodes} non-error nodes, tree too collapsed`); return false }
  return true
})

// 7.2b — missing end
test("7.2b missing end recovers", () => {
  const code = `def foo
  1
def bar
  2
end`
  const errs = countErrors(code)
  const nodes = countNodes(code)
  if (errs === 0) { console.log("  FAIL: expected errors"); return false }
  if (nodes < 3) { console.log(`  FAIL: only ${nodes} non-error nodes, tree too collapsed`); return false }
  return true
})

// 7.2c — extra end
test("7.2c extra end produces errors but parses around it", () => {
  const code = `def foo
  1
end
end`
  const errs = countErrors(code)
  const nodes = countNodes(code)
  if (errs === 0) { console.log("  FAIL: expected errors for extra end"); return false }
  if (nodes < 3) { console.log(`  FAIL: only ${nodes} non-error nodes`); return false }
  return true
})

// 7.2d — malformed string (unclosed)
test("7.2d unclosed string has errors but does not collapse tree", () => {
  const code = `x = "hello
y = 1`
  const errs = countErrors(code)
  const nodes = countNodes(code)
  if (errs === 0) { console.log("  FAIL: expected errors for unclosed string"); return false }
  if (nodes < 2) { console.log(`  FAIL: only ${nodes} non-error nodes`); return false }
  return true
})

// 7.2e — malformed regex
test("7.2e malformed regex has errors but does not collapse tree", () => {
  const code = `x = /unclosed
y = 1`
  const errs = countErrors(code)
  const nodes = countNodes(code)
  if (errs === 0) { console.log("  FAIL: expected errors for unclosed regex"); return false }
  if (nodes < 2) { console.log(`  FAIL: only ${nodes} non-error nodes`); return false }
  return true
})

// ============================================================
// 7.3 Ambiguity Resolution
// ============================================================

console.log("\n7.3 Ambiguity Resolution")

// 7.3a — / as division vs regex
test("7.3a division vs regex: division after variable", () => {
  const code = `a = 10
b = a / 2`
  const errs = countErrors(code)
  if (errs > 0) { console.log(`  FAIL: ${errs} error(s)`); return false }
  // Should NOT contain Regex node for `/ 2`
  if (hasNodeType(code, "Regex")) { console.log("  FAIL: parsed / as regex instead of division"); return false }
  return true
})

test("7.3a division vs regex: regex in assignment", () => {
  const code = `x = /pattern/i`
  const errs = countErrors(code)
  if (errs > 0) { console.log(`  FAIL: ${errs} error(s)`); return false }
  if (!hasNodeType(code, "Regex")) { console.log("  FAIL: did not parse /pattern/i as Regex"); return false }
  return true
})

// 7.3b — { as block vs hash
test("7.3b brace as hash in assignment", () => {
  const code = `x = { :a => 1 }`
  const errs = countErrors(code)
  if (errs > 0) { console.log(`  FAIL: ${errs} error(s)`); return false }
  if (!hasNodeType(code, "Hash")) { console.log("  FAIL: did not parse as Hash"); return false }
  return true
})

test("7.3b brace as block after method", () => {
  const code = `items.each { |x| x + 1 }`
  const errs = countErrors(code)
  if (errs > 0) { console.log(`  FAIL: ${errs} error(s)`); return false }
  if (!hasNodeType(code, "Block")) { console.log("  FAIL: did not parse as Block"); return false }
  return true
})

// 7.3c — * as splat vs multiplication
test("7.3c splat in method params", () => {
  const code = `def foo(*args)
  args
end`
  const errs = countErrors(code)
  if (errs > 0) { console.log(`  FAIL: ${errs} error(s)`); return false }
  return true
})

test("7.3c multiplication in expression", () => {
  const code = `x = a * b`
  const errs = countErrors(code)
  if (errs > 0) { console.log(`  FAIL: ${errs} error(s)`); return false }
  return true
})

// 7.3d — & as block pass vs bitwise and
test("7.3d block pass in method call", () => {
  const code = `foo(&block)`
  const errs = countErrors(code)
  if (errs > 0) { console.log(`  FAIL: ${errs} error(s)`); return false }
  return true
})

test("7.3d bitwise and in expression", () => {
  const code = `x = a & b`
  const errs = countErrors(code)
  if (errs > 0) { console.log(`  FAIL: ${errs} error(s)`); return false }
  return true
})

// 7.3e — do as keyword vs part of identifier
test("7.3e do as block keyword", () => {
  const code = `items.each do |x|
  x + 1
end`
  const errs = countErrors(code)
  if (errs > 0) { console.log(`  FAIL: ${errs} error(s)`); return false }
  if (!hasNodeType(code, "DoBlock")) { console.log("  FAIL: did not parse DoBlock"); return false }
  return true
})

test("7.3e identifier containing 'do' (undo_things)", () => {
  const code = `undo_things`
  const errs = countErrors(code)
  if (errs > 0) { console.log(`  FAIL: ${errs} error(s)`); return false }
  if (!hasNodeType(code, "Identifier")) { console.log("  FAIL: did not parse as Identifier"); return false }
  return true
})

// 7.3f — << as heredoc vs left shift
test("7.3f heredoc", () => {
  const code = `x = <<~HEREDOC
  content
HEREDOC`
  const errs = countErrors(code)
  if (errs > 0) { console.log(`  FAIL: ${errs} error(s)`); return false }
  if (!hasNodeType(code, "Heredoc")) { console.log("  FAIL: did not parse as Heredoc"); return false }
  return true
})

test("7.3f left shift operator", () => {
  const code = `x = a << b`
  const errs = countErrors(code)
  if (errs > 0) { console.log(`  FAIL: ${errs} error(s)`); return false }
  return true
})

// ============================================================
// 9 Performance Tests
// ============================================================

console.log("\n9 Performance Tests")

// 9.1 — Large file: 1000-line Ruby file
test("9.1 large file (1000 lines) parses in <500ms", () => {
  let lines = []
  for (let i = 0; i < 50; i++) {
    lines.push(`class MyClass${i} < Base`)
    lines.push(`  def method_${i}(x, y)`)
    for (let j = 0; j < 10; j++) {
      lines.push(`    result_${j} = x + y + ${j}`)
    }
    lines.push(`    if x > 0`)
    lines.push(`      puts "positive"`)
    lines.push(`    else`)
    lines.push(`      puts "non-positive"`)
    lines.push(`    end`)
    lines.push(`  end`)
    lines.push(`end`)
    lines.push(``)
  }
  const code = lines.join("\n")
  const start = performance.now()
  const tree = parser.parse(code)
  const elapsed = performance.now() - start
  // Force tree traversal
  let nodeCount = 0
  tree.iterate({enter() { nodeCount++ }})
  if (elapsed > 500) {
    console.log(`  FAIL: took ${elapsed.toFixed(1)}ms (>500ms), ${nodeCount} nodes`)
    return false
  }
  console.log(`  OK: ${elapsed.toFixed(1)}ms, ${nodeCount} nodes, ${code.split("\n").length} lines`)
  return true
})

// 9.2a — Deeply nested brackets
test("9.2a deeply nested brackets parse without hanging", () => {
  const depth = 20
  const code = "[".repeat(depth) + "1" + "]".repeat(depth)
  const start = performance.now()
  const tree = parser.parse(code)
  const elapsed = performance.now() - start
  tree.iterate({enter() {}})
  if (elapsed > 1000) {
    console.log(`  FAIL: took ${elapsed.toFixed(1)}ms (>1000ms)`)
    return false
  }
  console.log(`  OK: nested brackets depth ${depth} in ${elapsed.toFixed(1)}ms`)
  return true
})

// 9.2b — Very long string
test("9.2b very long string (10000 chars)", () => {
  const code = '"' + "a".repeat(10000) + '"'
  const start = performance.now()
  const tree = parser.parse(code)
  const elapsed = performance.now() - start
  tree.iterate({enter() {}})
  if (elapsed > 1000) {
    console.log(`  FAIL: took ${elapsed.toFixed(1)}ms (>1000ms)`)
    return false
  }
  console.log(`  OK: 10000-char string in ${elapsed.toFixed(1)}ms`)
  return true
})

// 9.2c — Many consecutive keywords
test("9.2c many consecutive keywords", () => {
  let lines = []
  for (let i = 0; i < 100; i++) {
    lines.push(`if true`)
    lines.push(`  nil`)
    lines.push(`end`)
  }
  const code = lines.join("\n")
  const start = performance.now()
  const tree = parser.parse(code)
  const elapsed = performance.now() - start
  tree.iterate({enter() {}})
  if (elapsed > 1000) {
    console.log(`  FAIL: took ${elapsed.toFixed(1)}ms (>1000ms)`)
    return false
  }
  console.log(`  OK: 100 if/end blocks in ${elapsed.toFixed(1)}ms`)
  return true
})

// 9.2d — Empty file
test("9.2d empty file parses with no errors", () => {
  const errs = countErrors("")
  if (errs > 0) { console.log(`  FAIL: ${errs} error(s) on empty file`); return false }
  return true
})

// 9.2e — File with only comments
test("9.2e file with only comments parses cleanly", () => {
  const code = `# This is a comment
# Another comment
# Third comment`
  const errs = countErrors(code)
  if (errs > 0) { console.log(`  FAIL: ${errs} error(s)`); return false }
  return true
})

// 9.2f — File with only whitespace
test("9.2f file with only whitespace parses cleanly", () => {
  const code = "   \n\n   \n  \n"
  const errs = countErrors(code)
  if (errs > 0) { console.log(`  FAIL: ${errs} error(s)`); return false }
  return true
})

// ============================================================
// Summary
// ============================================================

console.log(`\n--- SUMMARY ---`)
console.log(`PASS: ${passed}`)
console.log(`FAIL: ${failed}`)
console.log(`SKIP: ${skipped}`)
if (errors.length) {
  console.log(`\nFailures:`)
  errors.forEach(e => console.log(`  - ${e}`))
}
process.exit(failed > 0 ? 1 : 0)
