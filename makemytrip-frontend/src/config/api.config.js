export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'
// A ceiling on a hung request, not a latency budget — a healthy response lands
// in about a second. It was 10s, which was *shorter* than the backend's own
// worst-case failure path: when Firestore is degraded its client retries with
// backoff and the API's real error message arrives at 10–14s. The browser
// aborted a fraction of a second early, discarded the explanation the server
// had already written, and showed the user a raw axios timeout string instead.
export const API_TIMEOUT = 20000

