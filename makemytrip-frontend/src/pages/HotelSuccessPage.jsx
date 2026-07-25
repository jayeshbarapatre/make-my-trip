import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../styles/HotelSuccessPage.css';

export default function HotelSuccessPage() {
  const location = useLocation();
  const navigate  = useNavigate();

  // Save booking to localStorage on success page load
  useEffect(() => {
    const booking = location.state?.booking || {};
    const hotel = location.state?.hotel || {};

    if (booking?.bookingId || booking?.id) {
      const totalAmount = location.state?.totalAmount || booking.totalAmount || 0;

      const hotelBooking = {
        id: booking.bookingId || booking.id || 'HTL-' + Date.now(),
        bookingId: booking.bookingId || 'MMT-HT-' + Math.floor(100000 + Math.random() * 900000),
        pnr: booking.pnr || 'HTL-' + Math.floor(100000 + Math.random() * 900000),
        status: 'confirmed',
        type: 'hotel',
        // Hotel Info
        hotelName: hotel.name || location.state?.hotelName || 'Hotel',
        hotelLocality: hotel.locality || hotel.location || location.state?.hotelLocality || '',
        roomName: location.state?.roomName || booking.travellers?.roomName || '',
        checkIn: location.state?.checkIn || booking.departureDate || '',
        checkOut: location.state?.checkOut || booking.returnDate || '',
        guests: location.state?.guests || booking.travellers?.guests || '',
        nights: location.state?.nights || booking.nights || 1,
        rooms: location.state?.rooms || booking.travellers?.rooms || 1,
        totalAmount: totalAmount,
        paymentId: booking.paymentId || '',
        createdAt: new Date().toISOString(),
        // ✅ ENRICHED HOTEL FIELDS
        fromCity: hotel.name || location.state?.hotelName || 'Hotel',
        toCity: hotel.locality || hotel.location || location.state?.hotelLocality || '',
        departureDate: location.state?.checkIn || booking.departureDate || '',
        returnDate: location.state?.checkOut || booking.returnDate || '',
        travellers: {
          rooms: location.state?.rooms || booking.travellers?.rooms || 1,
          adults: booking.travellers?.adults || 1,
          guests: location.state?.guests || booking.travellers?.guests || '',
          nights: location.state?.nights || booking.nights || 1
        },
        // Fare breakdown
        baseFare: totalAmount * 0.8,
        taxes: totalAmount * 0.15,
        convenience: totalAmount * 0.05,
        discount: 0,
        gst: totalAmount * 0.05,
        // Payment
        paymentMethod: 'credit_card',
        paymentStatus: 'completed',
        transactionId: booking.paymentId || ''
      };

      // Save to localStorage
      const existingBookings = JSON.parse(localStorage.getItem('mmt_bookings') || '[]');
      const bookingExists = existingBookings.some(b => b.bookingId === hotelBooking.bookingId);

      if (!bookingExists) {
        existingBookings.push(hotelBooking);
        localStorage.setItem('mmt_bookings', JSON.stringify(existingBookings));
        console.log('💾 Hotel booking saved to localStorage:', existingBookings.length);
      }
    }
  }, [location.state]);

  // ── Primary: API booking response ────────────────────────────────────────
  const booking = location.state?.booking || {};

  // ── Secondary: rich local state passed from HotelPaymentPage ─────────────
  const hotel         = location.state?.hotel        || null;
  const roomName      = location.state?.roomName     || booking.travellers?.roomName || 'Deluxe Room';
  const checkIn       = location.state?.checkIn      || booking.departureDate        || '—';
  const checkOut      = location.state?.checkOut     || booking.returnDate           || '—';
  const guests        = location.state?.guests       || booking.travellers?.guests   || '—';
  const nights        = location.state?.nights       || booking.nights               || '—';
  const rooms         = location.state?.rooms        || booking.travellers?.rooms    || 1;
  const totalAmount   = location.state?.totalAmount  || booking.totalAmount          || 0;

  // Hotel display info
  const hotelName     = hotel?.name      || booking.fromCity  || '—';
  const hotelLocality = hotel?.locality  || hotel?.location   || booking.toCity || '';

  // PNR / booking IDs — always generate a real value, never show dashes
  const _ts = Date.now();   // unique per page load
  const confirmationId = booking.pnr       || `HTL-${Math.floor(100000 + (_ts % 900000))}`;
  const bookingId      = booking.bookingId  || `MMT-HT-${Math.floor(100000 + ((_ts + 137) % 900000))}`;
  const paymentMethod  = booking.travellers?.method || 'UPI';

  const bookEntireHotel  = location.state?.bookEntireHotel || false;
  // Price breakdown (18% GST on base, 15% property discount)
  const basePrice        = bookEntireHotel 
    ? Math.round(hotel.price * 4.5 * (typeof nights === 'number' ? nights : 1))
    : (hotel?.price ? hotel.price * (typeof nights === 'number' ? nights : 1) * (typeof rooms === 'number' ? rooms : 1) : totalAmount);
  const propertyDiscount = Math.round(basePrice * 0.15);
  const priceAfterDisc   = basePrice - propertyDiscount;
  const taxAmount        = Math.round(basePrice * 0.18);
  // Verify total matches (use passed totalAmount as the ground truth)
  const platformFee      = Math.round(totalAmount * 0.005);

  const handleDownloadPDF = async () => {
    const element = document.getElementById('hotel-ticket-content');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: 'hsl(var(--b1))'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth  = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`HotelTicket_${confirmationId}.pdf`);
    } catch (error) {
      console.error('PDF Error:', error);
      alert('Failed to generate PDF');
    }
  };

  return (
    <div className="succ-wrapper">
      <div className="succ-container">

        <div id="hotel-ticket-content" className="succ-ticket-outer">

          {/* ── Dark Header ─────────────────────────────────────── */}
          <div className="succ-premium-header">
            <div className="succ-icon-glow">✓</div>
            <h1 className="succ-title">Booking Confirmed!</h1>
            <p className="succ-subtitle">Your stay at <strong>{hotelName}</strong> is confirmed.</p>

            <div className="succ-pnr-ribbon">
              <div className="succ-ribbon-item">
                <span className="succ-ribbon-lbl">CONFIRMATION ID</span>
                <span className="succ-ribbon-val">{confirmationId}</span>
              </div>
              <div className="succ-ribbon-sep" />
              <div className="succ-ribbon-item">
                <span className="succ-ribbon-lbl">BOOKING ID</span>
                <span className="succ-ribbon-val">{bookingId}</span>
              </div>
            </div>
          </div>

          {/* ── Ticket Body ─────────────────────────────────────── */}
          <div className="succ-ticket-body">

            {/* Property Details */}
            <div className="succ-sec">
              <h3 className="succ-sec-title">Property Details</h3>
              <div className="succ-prop-card">
                <div className="succ-prop-name">{hotelName}</div>
                {hotelLocality && (
                  <div className="succ-prop-loc">📍 {hotelLocality}</div>
                )}
                <div className="succ-prop-dates">
                  📅 {checkIn} — {checkOut}
                </div>
              </div>
            </div>

            {/* Room Details */}
            <div className="succ-sec">
              <h3 className="succ-sec-title">Room Details</h3>
              <div className="succ-prop-card">
                <div className="succ-prop-name" style={{ fontSize: '16px' }}>{roomName}</div>
                <div style={{ display: 'flex', gap: '24px', marginTop: '10px', flexWrap: 'wrap' }}>
                  <div className="succ-meta-chip">🌙 {nights} Night{nights !== 1 ? 's' : ''}</div>
                  <div className="succ-meta-chip">🛏️ {rooms} Room{rooms !== 1 ? 's' : ''}</div>
                  <div className="succ-meta-chip">👥 {guests}</div>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="succ-sec">
              <h3 className="succ-sec-title">Price Breakdown</h3>
              <div className="succ-price-table">
                <div className="succ-price-row">
                  {bookEntireHotel ? (
                    <>
                      <span>Base Price (Resort Takeover)</span>
                      <span className="succ-price-sub">(All Rooms × {nights} Night{nights !== 1 ? 's' : ''})</span>
                    </>
                  ) : (
                    <>
                      <span>Base Price</span>
                      <span className="succ-price-sub">({rooms} Room{rooms !== 1 ? 's' : ''} × {nights} Night{nights !== 1 ? 's' : ''})</span>
                    </>
                  )}
                  <span>₹ {basePrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="succ-price-row discount">
                  <span>Discount by Property (15%)</span>
                  <span></span>
                  <span>− ₹ {propertyDiscount.toLocaleString('en-IN')}</span>
                </div>
                <div className="succ-price-row">
                  <span>Price after Discount</span>
                  <span></span>
                  <span>₹ {priceAfterDisc.toLocaleString('en-IN')}</span>
                </div>
                <div className="succ-price-row">
                  <span>Taxes & Service Fees (18% GST)</span>
                  <span></span>
                  <span>₹ {taxAmount.toLocaleString('en-IN')}</span>
                </div>
                {platformFee > 0 && (
                  <div className="succ-price-row">
                    <span>Platform Fee</span>
                    <span></span>
                    <span>₹ {platformFee.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="succ-price-row total">
                  <span>Total Amount Paid</span>
                  <span></span>
                  <span>₹ {totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Summary Grid */}
            <div className="succ-info-grid">
              <div className="succ-info-item">
                <span className="succ-info-lbl">Guests & Rooms</span>
                <span className="succ-info-val">{guests}</span>
              </div>
              <div className="succ-info-item">
                <span className="succ-info-lbl">Payment Method</span>
                <span className="succ-info-val">{paymentMethod}</span>
              </div>
              <div className="succ-info-item">
                <span className="succ-info-lbl">Payment Status</span>
                <span className="succ-info-val" style={{ color: 'hsl(var(--su))' }}>SUCCESS</span>
              </div>
            </div>

            <div className="succ-ticket-footer">
              <p>* Please present this voucher at the time of check-in.</p>
              <p>Support: 1800 102 8747 | support@makemytrip.com</p>
            </div>
          </div>
        </div>

        {/* ── Action Buttons ──────────────────────────────────── */}
        <div className="succ-actions-row">
          <button className="btn-primary succ-action-main" onClick={handleDownloadPDF}>
            📥 DOWNLOAD PDF TICKET
          </button>
          <button className="succ-action-sec" onClick={() => navigate('/my-trips')}>
            🧳 MY BOOKINGS
          </button>
          <button className="succ-action-home" onClick={() => navigate('/')}>
            🏠 GO HOME
          </button>
        </div>

      </div>
    </div>
  );
}
