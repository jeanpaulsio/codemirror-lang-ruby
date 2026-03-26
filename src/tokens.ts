import {ExternalTokenizer} from "@lezer/lr"
import {Regex, divideOp} from "./syntax.grammar.terms"

// ============================================================
// Regex / Division external tokenizer (#7)
//
// `/` is ambiguous: regex literal or division operator.
// This tokenizer handles both:
//
// 1. Try to match /pattern/flags (regex)
// 2. If the parser state allows Regex AND the pattern is valid, emit Regex
// 3. Otherwise emit divideOp (aliased to ArithOp) for division
//
// The parser state determines which is valid:
// - At expression-start (after =, (, [, ,, operator): Regex is valid
// - After a value (identifier, number, ), ]): only divideOp is valid
// ============================================================

export const regexTokenizer = new ExternalTokenizer((input, stack) => {
  if (input.next !== 47 /* '/' */) return

  // Try to match a regex pattern
  let pos = 1
  let isRegex = true
  while (true) {
    const ch = input.peek(pos)
    if (ch === -1 || ch === 10 /* \n */ || ch === 13 /* \r */) { isRegex = false; break }
    if (ch === 92 /* \\ */) {
      pos++
      // Check the escaped char isn't newline/EOF
      const next = input.peek(pos)
      if (next === -1 || next === 10 || next === 13) { isRegex = false; break }
      pos++
      continue
    }
    if (ch === 47 /* '/' */) { pos++; break }
    pos++
  }

  if (isRegex) {
    // Consume optional flags: i, m, x, o, u, s, n
    while (true) {
      const ch = input.peek(pos)
      if (ch === 105 || ch === 109 || ch === 120 || ch === 111 ||
          ch === 117 || ch === 115 || ch === 110) {
        pos++
      } else {
        break
      }
    }

    if (stack.canShift(Regex)) {
      input.acceptToken(Regex, pos)
      return
    }
  }

  // Fall back to division
  if (stack.canShift(divideOp)) {
    input.acceptToken(divideOp, 1)
  }
})
