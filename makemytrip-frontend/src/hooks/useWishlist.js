import { useCallback, useEffect, useState } from 'react'
import { wishlistService } from '../services/engagementService'
import { useAuth } from '../context/AuthContext'
import { useToastContext } from '../context/ToastContext'

/**
 * The customer's saved items, backed by the server.
 *
 * Replaces two separate fictions: a `useState(new Set())` on the hotel listing
 * that was lost on refresh, and a button on the hotel detail page that showed a
 * success toast without saving anything.
 *
 * Optimistic: the heart fills immediately and rolls back if the request fails,
 * because a save that appears to work and silently didn't is the exact problem
 * this replaces.
 */
export function useWishlist() {
  const { user } = useAuth()
  const toast = useToastContext()

  const [ids, setIds] = useState(() => new Set())
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!user) {
      setIds(new Set())
      setItems([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await wishlistService.list()
      const rows = res?.data ?? []
      setItems(rows)
      setIds(new Set(rows.map((w) => w.itemId)))
    } catch (err) {
      setError(err.message || 'Could not load your wishlist')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { load() }, [load])

  const has = useCallback((itemId) => ids.has(itemId), [ids])

  /**
   * @param {'hotel'|'flight'|'train'|'bus'|'cab'} type
   * @param {object} snapshot  denormalised copy so the wishlist can render
   *                           without a read per item
   */
  const toggle = useCallback(async (type, itemId, snapshot = {}) => {
    if (!user) {
      toast.info('Sign in to save this for later.', 'Not signed in')
      return false
    }

    const wasSaved = ids.has(itemId)

    // Optimistic flip.
    setIds((prev) => {
      const next = new Set(prev)
      if (wasSaved) next.delete(itemId)
      else next.add(itemId)
      return next
    })

    try {
      if (wasSaved) {
        await wishlistService.remove(type, itemId)
        setItems((prev) => prev.filter((w) => w.itemId !== itemId))
      } else {
        await wishlistService.add(type, itemId, snapshot)
        setItems((prev) => [{ itemId, type, snapshot }, ...prev])
      }
      return !wasSaved
    } catch (err) {
      // Roll back, and say so — the old code claimed success unconditionally.
      setIds((prev) => {
        const next = new Set(prev)
        if (wasSaved) next.add(itemId)
        else next.delete(itemId)
        return next
      })
      toast.error(err.message || 'Could not update your wishlist', 'Save failed')
      return wasSaved
    }
  }, [ids, user, toast])

  return { ids, items, has, toggle, reload: load, loading, error, isSignedIn: Boolean(user) }
}

export default useWishlist
