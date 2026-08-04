/**
 * ConfirmationTicket — the single shared booking confirmation layout.
 *
 * Encodes the Flight confirmation page's design language (dark success hero,
 * PNR/Booking-ID ribbon, 2-column grid, passenger roster, dashed total
 * divider, action buttons). Every booking category (flight/hotel/train/bus/cab)
 * renders this component so they all look like one enterprise product.
 *
 * Usage:
 *   <ConfirmationTicket
 *     title="Flight Ticket Confirmed!"
 *     subtitle="Your flight from Delhi to Mumbai is confirmed."
 *     referenceLabel="PNR"
 *     referenceValue={booking.pnr}
 *     bookingId={booking.bookingId}
 *     journeyCard={<…/>}        // category-specific journey/property card
 *     passengers={[]}            // [{ name, meta }]
 *     totalAmount={booking.totalAmount}
 *     footnote="* Valid ID required…"
 *     printableId="flight-ticket-content"
 *     onDownloadPDF={handleDownloadPDF}
 *     onMyTrips={() => navigate('/my-trips')}
 *     onHome={() => navigate('/')}
 *     downloadLabel="📥 DOWNLOAD PDF TICKET"
 *   />
 */

export default function ConfirmationTicket({
  title = 'Booking Confirmed!',
  subtitle = '',
  referenceLabel = 'CONFIRMATION ID',
  referenceValue,
  bookingId,
  journeyCard,
  passengers = [],
  totalAmount,
  footnote = '',
  printableId,
  onDownloadPDF,
  onMyTrips,
  onHome,
  downloadLabel = '📥 DOWNLOAD PDF TICKET',
  missing = false,
}) {
  const fmtAmount = (amt) =>
    amt === null || amt === undefined || amt === ''
      ? '—'
      : '₹' + Number(amt).toLocaleString('en-IN')

  if (missing) {
    return (
      <div className="ct-wrapper">
        <div className="ct-container">
          <div className="ct-card ct-missing">
            <h1>Booking reference unavailable</h1>
            <p>We could not confirm this booking. If you were charged, it will appear in My Trips shortly.</p>
            {onMyTrips && (
              <button className="ct-btn ct-btn-primary" style={{ flex: 'none', width: 'auto', padding: '10px 24px' }} onClick={onMyTrips}>
                Go to My Trips
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ct-wrapper">
      <div className="ct-container">

        <div id={printableId} className="ct-card">

          {/* ── Dark success hero ── */}
          <div className="ct-hero">
            <div className="ct-icon-glow">✓</div>
            <h1 className="ct-title">{title}</h1>
            {subtitle && <p className="ct-subtitle">{subtitle}</p>}

            <div className="ct-ribbon">
              <div className="ct-ribbon-col">
                <span className="ct-ribbon-lbl">{referenceLabel}</span>
                <span className="ct-ribbon-val">{referenceValue || '—'}</span>
              </div>
              <div className="ct-ribbon-sep" />
              <div className="ct-ribbon-col">
                <span className="ct-ribbon-lbl">BOOKING ID</span>
                <span className="ct-ribbon-val">{bookingId || '—'}</span>
              </div>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="ct-body">
            <div className="ct-grid">
              <div>
                <h3 className="ct-section-title">Journey Information</h3>
                {journeyCard}
              </div>

              <div>
                <h3 className="ct-section-title">Passenger Roster</h3>
                <div className="ct-passengers">
                  {passengers.length === 0 && (
                    <div className="ct-passenger-meta">No passenger details available.</div>
                  )}
                  {passengers.map((p, idx) => (
                    <div key={idx} className="ct-passenger">
                      <div className="ct-passenger-num">{idx + 1}</div>
                      <div>
                        <div className="ct-passenger-name">{p.name}</div>
                        {p.meta && <div className="ct-passenger-meta">{p.meta}</div>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="ct-total">
                  <span className="ct-total-lbl">Total Paid</span>
                  <span className="ct-total-val">{fmtAmount(totalAmount)}</span>
                </div>
              </div>
            </div>

            {footnote && (
              <div className="ct-footnote">
                {footnote.split('\n').map((line, i) => <p key={i}>{line}</p>)}
              </div>
            )}
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div className="ct-actions">
          {onDownloadPDF && (
            <button className="ct-btn ct-btn-primary" onClick={onDownloadPDF}>
              {downloadLabel}
            </button>
          )}
          {onMyTrips && (
            <button className="ct-btn ct-btn-outline" onClick={onMyTrips}>
              🧳 MY BOOKINGS
            </button>
          )}
          {onHome && (
            <button className="ct-btn ct-btn-neutral" onClick={onHome}>
              🏠 GO HOME
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
