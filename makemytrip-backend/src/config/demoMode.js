/**
 * Demonstration-mode disclosure.
 *
 * The platform is production-quality in every respect that matters — real
 * accounts, real sessions, a real database, real SMTP, real PDFs, real booking
 * records — but its travel inventory is dummy and its payments run in gateway
 * test mode. Nobody actually flies.
 *
 * That gap has to be visible on anything a visitor could mistake for a real
 * reservation. The website is the least of it: a PDF ticket and a confirmation
 * email leave the site entirely, get forwarded, printed and saved, and arrive
 * with none of the surrounding context that makes a demo obviously a demo. They
 * are the artifacts that need the disclosure most.
 *
 * Defaults to ON, and that direction is deliberate. Forgetting the flag while
 * running a demo leaves a truthful notice on a real booking — harmless. The
 * reverse would strip the notice from a demo booking, which is the failure worth
 * designing against.
 */
export const DEMO_MODE = process.env.DEMO_MODE !== 'false'

/** One line, for an email footer or a document footer. */
export const DEMO_NOTICE =
  'Portfolio demonstration. Accounts, payments processing, emails, PDFs and ' +
  'booking records are fully functional, but travel inventory and payments run ' +
  'in demonstration mode. No real reservation has been made and no seat, room ' +
  'or vehicle is held with any operator.'

/** Shouted, for the top of a document that otherwise looks like a real ticket. */
export const DEMO_BANNER = 'DEMONSTRATION BOOKING — NOT A REAL RESERVATION'

export default { DEMO_MODE, DEMO_NOTICE, DEMO_BANNER }
