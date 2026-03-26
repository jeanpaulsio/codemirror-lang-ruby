import {ExternalTokenizer} from "@lezer/lr"
import {
  Regex, divideOp,
  Heredoc, lessThanOp, lessThanEqOp,
} from "./syntax.grammar.terms"

// ============================================================
// Regex / Division external tokenizer (#7)
//
// `/` is ambiguous: regex literal or division operator.
// Tries to match /pattern/flags; falls back to divideOp.
// Parser state (stack.canShift) determines which is valid.
// ============================================================

export const regexTokenizer = new ExternalTokenizer((input, stack) => {
  if (input.next !== 47 /* '/' */) return

  let pos = 1
  let isRegex = true
  while (true) {
    const ch = input.peek(pos)
    if (ch === -1 || ch === 10 || ch === 13) { isRegex = false; break }
    if (ch === 92 /* \\ */) {
      pos++
      const next = input.peek(pos)
      if (next === -1 || next === 10 || next === 13) { isRegex = false; break }
      pos++
      continue
    }
    if (ch === 47 /* '/' */) { pos++; break }
    pos++
  }

  if (isRegex) {
    // Consume optional flags
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

  if (stack.canShift(divideOp)) {
    input.acceptToken(divideOp, 1)
  }
})

// ============================================================
// Less-than / Heredoc external tokenizer (#10)
//
// `<` is ambiguous: comparison, `<=`, `<<` left shift, or heredoc start.
// When `<<` is followed by [-~]?IDENTIFIER (or quoted string), and the
// parser allows Heredoc, we scan to the matching closing delimiter
// and emit the entire heredoc as one token.
// Otherwise emit lessThanOp or lessThanEqOp for comparison.
// ============================================================

export const lessThanTokenizer = new ExternalTokenizer((input, stack) => {
  if (input.next !== 60 /* '<' */) return

  const second = input.peek(1)

  // Try heredoc: <<
  if (second === 60 /* '<' */ && stack.canShift(Heredoc)) {
    const heredocLen = tryMatchHeredoc(input)
    if (heredocLen > 0) {
      input.acceptToken(Heredoc, heredocLen)
      return
    }
  }

  // <=
  if (second === 61 /* '=' */ && stack.canShift(lessThanEqOp)) {
    input.acceptToken(lessThanEqOp, 2)
    return
  }

  // Plain <
  if (stack.canShift(lessThanOp)) {
    input.acceptToken(lessThanOp, 1)
  }
})

// Try to match a complete heredoc starting at the current position.
// Returns the total length including the closing delimiter, or 0 if no match.
function tryMatchHeredoc(input: {peek(offset: number): number}): number {
  let pos = 2 // past <<

  // Optional - or ~
  const modifier = input.peek(pos)
  if (modifier === 45 /* - */ || modifier === 126 /* ~ */) pos++

  // Read the delimiter
  let delimiter = ""
  const quoteChar = input.peek(pos)

  if (quoteChar === 39 /* ' */ || quoteChar === 34 /* " */ || quoteChar === 96 /* ` */) {
    // Quoted delimiter: <<~"DELIM"
    pos++
    while (true) {
      const ch = input.peek(pos)
      if (ch === -1 || ch === 10) return 0 // unterminated quote
      if (ch === quoteChar) { pos++; break }
      delimiter += String.fromCharCode(ch)
      pos++
    }
  } else {
    // Bare identifier delimiter: <<~DELIM
    if (!isIdentStart(input.peek(pos))) return 0
    while (isIdentChar(input.peek(pos))) {
      delimiter += String.fromCharCode(input.peek(pos))
      pos++
    }
  }

  if (!delimiter) return 0

  // Must be followed by newline (or end of opening line)
  // Skip to end of opening line
  while (true) {
    const ch = input.peek(pos)
    if (ch === -1) return 0 // no newline after heredoc start
    if (ch === 10) { pos++; break }
    if (ch === 13) { pos++; if (input.peek(pos) === 10) pos++; break }
    pos++
  }

  // Scan lines looking for the closing delimiter
  const isIndented = modifier === 45 || modifier === 126 // <<- or <<~
  while (true) {
    let lineContent = ""

    // For indented heredocs (<<- or <<~), skip leading whitespace
    if (isIndented) {
      while (input.peek(pos) === 32 || input.peek(pos) === 9) pos++
    }

    // Read the rest of the line
    while (true) {
      const ch = input.peek(pos)
      if (ch === -1 || ch === 10 || ch === 13) break
      lineContent += String.fromCharCode(ch)
      pos++
    }

    // Check if this line matches the delimiter (trimmed)
    if (lineContent === delimiter) {
      // Include the delimiter line in the token
      // Advance past newline if present
      const ch = input.peek(pos)
      if (ch === 10) pos++
      else if (ch === 13) { pos++; if (input.peek(pos) === 10) pos++ }
      return pos
    }

    // Advance past newline
    const ch = input.peek(pos)
    if (ch === -1) return pos // unterminated heredoc — emit what we have
    if (ch === 10) pos++
    else if (ch === 13) { pos++; if (input.peek(pos) === 10) pos++ }
  }
}

function isIdentStart(ch: number): boolean {
  return (ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122) || ch === 95
}

function isIdentChar(ch: number): boolean {
  return isIdentStart(ch) || (ch >= 48 && ch <= 57)
}
