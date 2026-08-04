/**
 * useQuote — shared quote-loading hook for every payment page.
 *
 * Owns the quote/quoteError/quoteReady state machine so the five booking
 * categories (flight/hotel/train/bus/cab) cannot drift in how they fetch and
 * display a fare. Previously each page copy-pasted the effect and had already
 * diverged: flight/train left a stale `quote` on a re-fetch failure, while
 * hotel/cab/bus cleared it.
 *
 * Returns:
 *   { quote, quoteError, quoteReady, totalAmount, baseFare, taxes, convenience }
 *
 * totalAmount is `null` (never 0) when there is no quote, so a page can never
 * render a misleading "Payable ₹0" while a base fare is showing.
 */
import { useEffect, useState } from 'react'
import { requestQuote } from '../services/checkout'

export default function useQuote({ type, itemId, quantity = 1, nights = 1, distance = 0, enabled = true }) {
  const [quote, setQuote] = useState(null)
  const [quoteError, setQuoteError] = useState('')

  useEffect(() => {
    if (!enabled || !itemId) return

    let active = true
    requestQuote({ type, itemId, quantity, nights, distance })
      .then((q) => {
        if (!active) return
        setQuote(q)
        setQuoteError('')
      })
      .catch((err) => {
        if (!active) return
        // Clear the quote on every failure so a stale total is never shown.
        setQuote(null)
        setQuoteError(err.message || 'Could not load the fare.')
      })

    return () => {
      active = false
    }
  }, [type, itemId, quantity, nights, distance, enabled])

  const quoteReady = Boolean(quote)

  return {
    quote,
    quoteError,
    quoteReady,
    totalAmount: quote?.totalAmount ?? null,
    baseFare: quote?.baseFare ?? null,
    taxes: quote?.taxes ?? null,
    convenience: quote?.convenience ?? null
  }
}
