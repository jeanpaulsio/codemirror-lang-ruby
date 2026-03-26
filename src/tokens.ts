import {ExternalTokenizer} from "@lezer/lr"
import {
  Regex, divideOp,
  Heredoc, lessThanOp, lessThanEqOp, inheritsOp, shiftLeftOp,
  greaterThanOp, greaterThanEqOp, shiftRightOp,
  PercentStringLiteral, moduloOp,
  Symbol as SymbolToken, colonOp,
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
  if (second === 60 /* '<' */) {
    if (stack.canShift(Heredoc)) {
      const heredocLen = tryMatchHeredoc(input)
      if (heredocLen > 0) {
        input.acceptToken(Heredoc, heredocLen)
        return
      }
    }
    // << as left shift operator
    if (stack.canShift(shiftLeftOp)) {
      input.acceptToken(shiftLeftOp, 2)
      return
    }
  }

  // <=
  if (second === 61 /* '=' */ && stack.canShift(lessThanEqOp)) {
    input.acceptToken(lessThanEqOp, 2)
    return
  }

  // Inheritance < (class Foo < Bar)
  if (stack.canShift(inheritsOp)) {
    input.acceptToken(inheritsOp, 1)
    return
  }

  // Plain < (comparison)
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

  // After the delimiter, only whitespace/comments allowed on the rest of the line.
  // If there's code (like .method or (args)), this is << left-shift, not a heredoc.
  while (true) {
    const ch = input.peek(pos)
    if (ch === -1) return 0
    if (ch === 10) { pos++; break }
    if (ch === 13) { pos++; if (input.peek(pos) === 10) pos++; break }
    if (ch === 32 || ch === 9) { pos++; continue } // whitespace OK
    if (ch === 35 /* # */) { // comment — skip rest of line
      while (true) {
        const c = input.peek(pos)
        if (c === -1 || c === 10 || c === 13) break
        pos++
      }
      continue
    }
    // For bare identifiers (not quoted), any non-whitespace after delimiter
    // means this is << operator, not heredoc. E.g. <<File.expand_path(...)
    if (quoteChar !== 39 && quoteChar !== 34 && quoteChar !== 96) return 0
    pos++ // quoted delimiters can have trailing content (e.g. <<~"SQL", other_arg)
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

// ============================================================
// Percent literal external tokenizer (#11)
//
// Matches %w[], %i[], %q(), %Q(), %r(), %x(), %s(), %(), and
// any single-character delimiter: %w|a b|, %q!hello!, etc.
//
// Bracket delimiters ([], (), {}, <>) are paired — the tokenizer
// tracks nesting depth. Non-bracket delimiters use the same
// character for open and close.
// ============================================================

const BRACKET_PAIRS: Record<number, number> = {
  91: 93,   // [ → ]
  40: 41,   // ( → )
  123: 125, // { → }
  60: 62,   // < → >
}

export const percentLiteralTokenizer = new ExternalTokenizer((input, stack) => {
  if (input.next !== 37 /* '%' */) return

  // Try to match a percent literal
  const literalLen = tryMatchPercentLiteral(input)
  if (literalLen > 0 && stack.canShift(PercentStringLiteral)) {
    input.acceptToken(PercentStringLiteral, literalLen)
    return
  }

  // Fall back to modulo operator
  if (stack.canShift(moduloOp)) {
    input.acceptToken(moduloOp, 1)
  }
})

function tryMatchPercentLiteral(input: {peek(offset: number): number}): number {
  let pos = 1
  const modifier = input.peek(pos)

  // Optional type modifier: w W i I q Q r x s
  if (modifier >= 65 && modifier <= 90 || modifier >= 97 && modifier <= 122) {
    const valid = [119, 87, 105, 73, 113, 81, 114, 120, 115] // w W i I q Q r x s
    if (valid.indexOf(modifier) === -1) return 0
    pos++
  }

  // Read the delimiter character
  const openDelim = input.peek(pos)
  // Reject whitespace, EOF, and alphanumeric characters as delimiters.
  // Digits would cause %3 or %300 to be misread as percent literals.
  if (openDelim === -1 || openDelim === 32 || openDelim === 9 ||
      openDelim === 10 || openDelim === 13 ||
      (openDelim >= 48 && openDelim <= 57) ||   // 0-9
      (openDelim >= 65 && openDelim <= 90) ||    // A-Z
      (openDelim >= 97 && openDelim <= 122)) return 0  // a-z

  // Don't match %letter that isn't followed by a delimiter (e.g. % in arithmetic)
  pos++
  const closeDelim = BRACKET_PAIRS[openDelim] || openDelim

  if (BRACKET_PAIRS[openDelim]) {
    let depth = 1
    while (depth > 0) {
      const ch = input.peek(pos)
      if (ch === -1) return pos // unterminated
      if (ch === 92 /* \\ */) { pos += 2; continue }
      if (ch === openDelim) depth++
      if (ch === closeDelim) depth--
      pos++
    }
  } else {
    while (true) {
      const ch = input.peek(pos)
      if (ch === -1) return pos // unterminated
      if (ch === 92 /* \\ */) { pos += 2; continue }
      if (ch === closeDelim) { pos++; break }
      pos++
    }
  }

  return pos
}

// ============================================================
// Symbol external tokenizer
//
// :identifier — moved from inline tokens to avoid overlap with
// ":" literal used in hash shorthand (key: value).
// Only matches when followed by a letter/underscore (not whitespace).
// ============================================================

export const symbolTokenizer = new ExternalTokenizer((input, stack) => {
  if (input.next !== 58 /* ':' */) return

  const next = input.peek(1)

  // :identifier, :identifier?, :identifier! → Symbol
  if (isIdentStart(next) || (next >= 65 && next <= 90) /* A-Z */) {
    let pos = 2
    while (isIdentChar(input.peek(pos))) pos++
    // Allow ? or ! suffix
    const suffix = input.peek(pos)
    if (suffix === 63 /* ? */ || suffix === 33 /* ! */) pos++
    if (stack.canShift(SymbolToken)) {
      input.acceptToken(SymbolToken, pos)
      return
    }
  }

  // :"..." or :'...' → quoted Symbol
  if (next === 34 /* " */ || next === 39 /* ' */) {
    let pos = 2
    const quote = next
    while (true) {
      const ch = input.peek(pos)
      if (ch === -1 || ch === 10 || ch === 13) break // unterminated
      if (ch === 92 /* \\ */) { pos += 2; continue } // escape
      if (ch === quote) { pos++; break }
      pos++
    }
    if (stack.canShift(SymbolToken)) {
      input.acceptToken(SymbolToken, pos)
      return
    }
  }

  // Operator symbols: :==, :!=, :<=>, :===, :=~, :!~, :+, :-, :*, :/, :%,
  // :**,  :<<, :>>, :[], :[]=, :<, :<=, :>, :>=, :&, :|, :^, :~, :+@, :-@
  if (next === 61 /* = */ || next === 33 /* ! */ || next === 60 /* < */ ||
      next === 62 /* > */ || next === 43 /* + */ || next === 45 /* - */ ||
      next === 42 /* * */ || next === 47 /* / */ || next === 37 /* % */ ||
      next === 38 /* & */ || next === 124 /* | */ || next === 94 /* ^ */ ||
      next === 126 /* ~ */ || next === 91 /* [ */) {
    const len = tryMatchOperatorSymbol(input)
    if (len > 0 && stack.canShift(SymbolToken)) {
      input.acceptToken(SymbolToken, len)
      return
    }
  }

  // Fall back to plain colon (ternary, hash shorthand)
  if (stack.canShift(colonOp)) {
    input.acceptToken(colonOp, 1)
  }
})

// Try to match an operator after ":" for operator symbols.
// Returns total length including the ":" prefix, or 0.
function tryMatchOperatorSymbol(input: {peek(offset: number): number}): number {
  const c1 = input.peek(1)
  const c2 = input.peek(2)
  const c3 = input.peek(3)

  // Three-char operators: ===, <=>, ==~, !~=
  if (c1 === 61 && c2 === 61 && c3 === 61) return 4 // :===
  if (c1 === 60 && c2 === 61 && c3 === 62) return 4 // :<=>

  // :[] and :[]=
  if (c1 === 91 && c2 === 93) {
    if (c3 === 61) return 4 // :[]=
    return 3 // :[]
  }

  // Two-char operators: ==, !=, =~, !~, <=, >=, <<, >>, **, +@, -@
  if (c1 === 61 && c2 === 61) return 3 // :==
  if (c1 === 33 && c2 === 126) return 3 // :!~
  if (c1 === 61 && c2 === 126) return 3 // :=~
  if (c1 === 33 && c2 === 61) return 3 // :!=
  if (c1 === 60 && c2 === 61) return 3 // :<=
  if (c1 === 62 && c2 === 61) return 3 // :>=
  if (c1 === 60 && c2 === 60) return 3 // :<<
  if (c1 === 62 && c2 === 62) return 3 // :>>
  if (c1 === 42 && c2 === 42) return 3 // :**
  if (c1 === 43 && c2 === 64) return 3 // :+@
  if (c1 === 45 && c2 === 64) return 3 // :-@

  // Single-char operators: +, -, *, /, %, <, >, &, |, ^, ~
  if (c1 === 43 || c1 === 45 || c1 === 42 || c1 === 47 || c1 === 37 ||
      c1 === 60 || c1 === 62 || c1 === 38 || c1 === 124 || c1 === 94 ||
      c1 === 126) return 2

  return 0
}

// ============================================================
// Greater-than external tokenizer
//
// `>` is ambiguous: `>`, `>=`, `>>` (right shift), `>>=` (assign).
// Longest match determines: >>= (3) > >> or >= (2) > > (1).
// ============================================================

export const greaterThanTokenizer = new ExternalTokenizer((input, stack) => {
  if (input.next !== 62 /* '>' */) return

  const second = input.peek(1)

  // >> (right shift) — >>= is handled by inline AssignOp token
  if (second === 62 /* '>' */) {
    if (stack.canShift(shiftRightOp)) {
      input.acceptToken(shiftRightOp, 2)
      return
    }
  }

  // >=
  if (second === 61 /* '=' */) {
    if (stack.canShift(greaterThanEqOp)) {
      input.acceptToken(greaterThanEqOp, 2)
      return
    }
  }

  // Plain >
  if (stack.canShift(greaterThanOp)) {
    input.acceptToken(greaterThanOp, 1)
  }
})

function isIdentStart(ch: number): boolean {
  return (ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122) || ch === 95
}

function isIdentChar(ch: number): boolean {
  return isIdentStart(ch) || (ch >= 48 && ch <= 57)
}
