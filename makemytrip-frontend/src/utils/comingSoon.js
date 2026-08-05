/**
 * The message every not-yet-live CTA shows, so the seven ungated verticals
 * cannot drift apart in what they promise.
 *
 * Lives outside ComingSoon.jsx because that file may only export components
 * (react-refresh/only-export-components).
 */
export const comingSoonToast = (toast, vertical) =>
  toast.info(
    `${vertical} bookings are not live yet — nothing has been charged or reserved.`,
    'Coming soon'
  )
