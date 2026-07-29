// Boundary sanitisation for user-authored text that other people will read.
//
// React escapes on render, but storing raw markup invites an XSS the moment
// anything renders the value as HTML — an email template, a PDF export, an
// admin console. Strip it once, here, so every consumer gets plain text.

const HTML_TAGS = /<[^>]*>/g
const COLLAPSE_WS = /\s+/g

// Control characters are filtered by codepoint rather than a regex range: the
// escape sequences for them are easy to corrupt when this file is edited by
// tooling, and a silently broken character class would strip nothing.
const isControlChar = (codePoint) => codePoint < 0x20 || codePoint === 0x7f

const stripControlChars = (input) => {
  let out = ''
  for (const char of input) {
    out += isControlChar(char.codePointAt(0)) ? ' ' : char
  }
  return out
}

/**
 * @param {unknown} text
 * @param {number} maxLength
 * @returns {string} plain text, control characters and tags removed
 */
export const sanitizeText = (text, maxLength = 2000) =>
  stripControlChars(String(text ?? ''))
    .replace(HTML_TAGS, '')
    .replace(COLLAPSE_WS, ' ')
    .trim()
    .slice(0, maxLength)

export default { sanitizeText }
