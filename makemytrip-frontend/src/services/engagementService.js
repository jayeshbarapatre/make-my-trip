import api from './api'

/**
 * Wishlist and reviews.
 *
 * Both had a complete backend API and no frontend consumer at all. The effect
 * was worse than a missing feature: the hotel detail page showed a "❤️ Wishlist"
 * button that popped "Hotel added to your wishlist successfully!" and saved
 * nothing, and the listing page's heart was local component state that vanished
 * on refresh. The product told the customer their action had worked when it had
 * not.
 */

export const wishlistService = {
  /** Everything the signed-in customer has saved. */
  list: () => api.get('/wishlists'),

  /**
   * `snapshot` is a small denormalised copy of the listing. The server keeps it
   * so the wishlist renders without a read per item, and still shows something
   * if the listing is later withdrawn.
   */
  add: (type, itemId, snapshot) => api.post('/wishlists', { type, itemId, snapshot }),

  remove: (type, itemId) => api.delete(`/wishlists/${type}/${itemId}`)
}

export const reviewService = {
  /** Published reviews for one hotel/flight/etc. Public — no auth required. */
  forSubject: (subjectId) => api.get(`/reviews/subject/${subjectId}`),

  /** The signed-in customer's own reviews, in any status. */
  mine: () => api.get('/reviews/mine'),

  /**
   * The server rejects a review that is not backed by a completed booking the
   * author owns, so `bookingId` is required rather than optional.
   */
  create: ({ subjectId, subjectType, bookingId, rating, title, comment }) =>
    api.post('/reviews', { subjectId, subjectType, bookingId, rating, title, comment }),

  remove: (id) => api.delete(`/reviews/${id}`)
}

export default { wishlistService, reviewService }
