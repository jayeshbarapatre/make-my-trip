import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { requestQuote, payAndBook } from '../services/checkout';
import '../styles/HotelPaymentPage.css';
import { photo } from '../utils/images'
import CheckoutStateLost from '../components/CheckoutStateLost'

export default function HotelPaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login?returnTo=' + encodeURIComponent(location.pathname), { replace: true });
    }
  }, [user, navigate, location.pathname]);

  const defaultImage = photo('hotel-luxury-exterior', 400);
  // Checkout state lives in router state, which a refresh or a deep link
  // discards. This used to fall back to a fabricated hotel ("Axiom Resort
  // Luxury Cottages" at ₹5,000 with id `hotel-fallback`): pricing correctly
  // refused the unknown id, so the customer saw a real-looking hotel they never
  // selected, with a quote that could not succeed. Send them back to choose.
  const hotel = location.state?.hotel ?? null;

  useEffect(() => {
    if (user && !hotel?.id) {
      navigate('/hotels', { replace: true });
    }
  }, [user, hotel, navigate]);

  const getImageUrl = (h) => {
    if (h.image) return h.image;
    if (h.images && h.images.length > 0) return h.images[0];
    if (h.seed && h.seed.length > 0) return h.seed[0];
    if (h.img) return h.img;
    return defaultImage;
  };

  const roomName = location.state?.roomName ?? 'Selected room';
  const checkIn = location.state?.checkIn ?? '';
  const checkOut = location.state?.checkOut ?? '';
  const guests = location.state?.guests || "2 Adults | 1 Room";
  const guestsObj = location.state?.guestsObj || { adults: 2, rooms: 1 };
  const nights = location.state?.nights || 1;
  const rooms = location.state?.rooms || guestsObj.rooms || 1;
  const bookEntireHotel = location.state?.bookEntireHotel || false;

  const [secureAdded, setSecureAdded] = useState(false);
  const [_selectedMethod, _setSelectedMethod] = useState('UPI');

  // The stay is priced by the server from stored room rates. This page used to
  // derive its own breakdown from a router-state total (defaulting to ₹4760)
  // using three different rates that did not reconcile with each other.
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');

  useEffect(() => {
    if (!hotel?.id) return;

    let active = true;
    requestQuote({ type: 'hotel', itemId: hotel.id, quantity: rooms, nights })
      .then((q) => { if (active) { setQuote(q); setQuoteError(''); } })
      .catch((err) => { if (active) { setQuote(null); setQuoteError(err.message); } });

    return () => { active = false; };
  }, [hotel?.id, rooms, nights]);

  const totalAmount = quote?.totalAmount ?? null;
  const quoteReady = Boolean(quote);
  const finalDue = totalAmount;
  const taxesBreakdown = quote?.taxes ?? 0;
  const serviceFees = quote?.convenience ?? 0;
  const hotelFare = quote?.baseFare ?? 0;

  const handleProcessPayment = async () => {
    if (!user) {
      setToastMessage('Please login to continue booking');
      setTimeout(() => setToastMessage(''), 3500);
      return;
    }

    if (isProcessing) {
      console.warn('⚠️ Payment already processing, ignoring duplicate request');
      return;
    }

    setIsProcessing(true);
    console.log('🏨 Starting hotel booking payment process...');

    try {
      if (!quote) {
        setToastMessage(quoteError || 'The room rate is still loading. Please wait a moment.');
        setTimeout(() => setToastMessage(''), 3500);
        setIsProcessing(false);
        return;
      }

      // One shared checkout: order -> gateway -> verify -> booking. The server
      // prices the stay and creates the booking from what the gateway captured,
      // so the amount charged and the amount recorded cannot diverge.
      const booking = await payAndBook({
        quote,
        description: `${hotel.name} — ${roomName}`,
        prefill: {
          name: user?.name || 'Guest User',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        bookingData: {
          type: 'hotel',
          hotelId: hotel.id,
          hotelName: hotel.name,
          hotelLocality: hotel.locality || hotel.location || '',
          fromCity: hotel.name,
          toCity: hotel.locality || hotel.location || '',
          checkIn,
          checkOut,
          departureDate: checkIn,
          returnDate: checkOut,
          roomName,
          nights,
          rooms,
          bookEntireHotel,
          travellers: { guests, rooms, adults: guestsObj.adults, roomName, bookEntireHotel, nights },
          userEmail: user?.email,
          userName: user?.name
        }
      });

      navigate('/hotels/success', {
        state: {
          booking,
          hotel,
          roomName,
          checkIn,
          checkOut,
          guests,
          guestsObj,
          nights,
          rooms,
          totalAmount: booking.totalAmount,
          bookEntireHotel
        }
      });

      setToastMessage('✓ Booking confirmed! Check your email for details.');
      setTimeout(() => setToastMessage(''), 3500);
    } catch (err) {
      setToastMessage(err.message || 'Payment failed. Please try again.');
      setTimeout(() => setToastMessage(''), 4000);
      setIsProcessing(false);
    }
  };

  // The redirect fires in an effect, so the first render still runs with no
  // hotel. Render nothing rather than dereferencing it.
  if (!hotel?.id) return <CheckoutStateLost searchPath="/hotels" label="hotel search" />;

  return (
    <div className="pmt-wrapper">
      <div className="pmt-container">
        <div className="pmt-grid">
          
          {/* ── Left Column ── */}
          <div className="pmt-left-col">
            
            {/* Booking Summary Box */}
            <div className="pmt-card">
              <div className="pmt-summary-box">
                <div className="pmt-summary-top">
                  <div className="pmt-prop-info">
                    <img src={getImageUrl(hotel)} alt={hotel.name} className="pmt-prop-thumb" />
                    <div className="pmt-prop-text">
                      <h3>{hotel.name}</h3>
                      <p className="pmt-meta">{checkIn} - {checkOut} · {nights} Night{nights !== 1 ? 's' : ''} · {rooms} Room{rooms !== 1 ? 's' : ''} · {guests}</p>
                    </div>
                  </div>
                  <span className="pmt-toggle">VIEW DETAILS ∨</span>
                </div>
              </div>

              <div className="pmt-traveller-row">
                <span className="pmt-traveller-lbl">👤 Primary Guest:</span>
                {/* This used to fall back to a hardcoded name, email and phone
                    number, so every signed-out visitor was shown a stranger's
                    details as their own booking contact. */}
                <span>
                  {user?.name || 'Guest'}
                  {user?.email ? ` (${user.email}${user.phone ? `, ${user.phone}` : ''})` : ''}
                </span>
              </div>
            </div>

            {/* Login / Saved Payments Promo */}
            {!user && (
              <div className="pmt-card">
                <div className="pmt-login-promo">
                  <div className="pmt-login-text">
                    <h4>Additional discounts and saved payment options</h4>
                    <p>Login to access saved payments and discounts!</p>
                  </div>
                  <button
                    className="pmt-login-btn"
                    onClick={() => navigate('/login?returnTo=' + encodeURIComponent(location.pathname))}
                  >
                    LOGIN
                  </button>
                </div>
              </div>
            )}

            {/* Trip Secure Banner */}
            <div className="pmt-card">
              <div className="pmt-secure-banner">
                <div>
                  <span className="pmt-sec-badge">Trip Secure | One Plan, Many Benefits</span>
                  <h4 className="pmt-sec-hdr">Enjoy Worry Free Hotel Stay!</h4>
                  <p className="pmt-sec-desc">Covers medical expenses, loss of valuables, hotel cancellations, emergency assistance &amp; more. <span style={{ textDecoration: 'underline' }}>View benefits</span></p>
                </div>
                <div>
                  <button 
                    className="pmt-sec-add" 
                    style={{ background: secureAdded ? 'hsl(var(--su))' : 'hsl(var(--p))' }}
                    onClick={() => setSecureAdded(!secureAdded)}
                  >
                    {secureAdded ? "✓ Added @ ₹59" : "Add @ ₹59"}
                  </button>
                </div>
              </div>
            </div>

            {/* Gift Cards Accordion */}
            <div className="pmt-card">
              <div className="pmt-summary-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 800 }}>
                  <span>💳</span> Gift Cards
                </div>
                <span className="pmt-toggle">VIEW ALL ∨</span>
              </div>
            </div>

            {/* Payment Options Accordion List */}
            <div className="pmt-card">
              <h3 className="pmt-options-title">Payment Options</h3>

              <div className="pmt-option-item" onClick={() => handleProcessPayment('UPI / Google Pay')}>
                <div className="pmt-opt-left">
                  <div className="pmt-opt-icon">📱</div>
                  <div>
                    <h4 className="pmt-opt-name">UPI Options</h4>
                    <p className="pmt-opt-sub">Pay Directly From Your Bank Account</p>
                  </div>
                </div>
                <span>›</span>
              </div>

              <div className="pmt-option-item" onClick={() => handleProcessPayment('Credit / Debit Card')}>
                <div className="pmt-opt-left">
                  <div className="pmt-opt-icon">💳</div>
                  <div>
                    <h4 className="pmt-opt-name">Credit &amp; Debit Cards</h4>
                    <p className="pmt-opt-sub">Visa, Mastercard, Amex, Rupay and more</p>
                  </div>
                </div>
                <span>›</span>
              </div>

              <div className="pmt-option-item" onClick={() => handleProcessPayment('EMI Checkout')}>
                <div className="pmt-opt-left">
                  <div className="pmt-opt-icon">🏷️</div>
                  <div>
                    <h4 className="pmt-opt-name">EMI <span className="pmt-emi-badge">NO COST EMI</span></h4>
                    <p className="pmt-opt-sub">Credit/Debit Card &amp; Cardless EMI available</p>
                  </div>
                </div>
                <span>›</span>
              </div>

              <div className="pmt-option-item" onClick={() => handleProcessPayment('Net Banking')}>
                <div className="pmt-opt-left">
                  <div className="pmt-opt-icon">🏦</div>
                  <div>
                    <h4 className="pmt-opt-name">Net Banking</h4>
                    <p className="pmt-opt-sub">All major banks supported</p>
                  </div>
                </div>
                <span>›</span>
              </div>
            </div>

          </div>

          {/* ── Right Column (Sidebar) ── */}
          <div className="pmt-right-col">
            
            {/* Total Due Card */}
            <div className="pmt-total-card">
              <div className="pmt-due-top">
                <span className="pmt-due-lbl">Total Due</span>
                <span className="pmt-due-val">{quoteReady ? `₹ ${Number(finalDue).toLocaleString("en-IN")}` : '—'}</span>
              </div>

              <div className="pmt-due-row">
                <span>Hotel Fare ({rooms} Room{rooms !== 1 ? 's' : ''} × {nights} Night{nights !== 1 ? 's' : ''})</span>
                <span>₹ {hotelFare.toLocaleString("en-IN")}</span>
              </div>

              <div className="pmt-due-row">
                <span>Service Fees</span>
                <span>₹ {serviceFees.toLocaleString("en-IN")}</span>
              </div>

              <div className="pmt-due-row" style={{ marginBottom: 0 }}>
                <span>Taxes</span>
                <span>₹ {taxesBreakdown.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Scan to Pay Card */}
            <div className="pmt-qr-card">
              <h4 className="pmt-qr-hdr">Scan to Pay</h4>
              <p className="pmt-qr-sub">Instant Refund &amp; High Success Rate</p>

              <div className="pmt-qr-box">
                {/* SVG Mock QR Code Graphic */}
                <svg viewBox="0 0 100 100" className="pmt-qr-img">
                  <rect width="100" height="100" fill="#fff"/>
                  <path d="M10 10h25v25H10zM15 15h15v15H15zM65 10h25v25H65zM70 15h15v15H70zM10 65h25v25H10zM15 70h15v15H15z" fill="hsl(var(--bc))"/>
                  <rect x="40" y="20" width="10" height="10" fill="hsl(var(--bc))"/>
                  <rect x="50" y="40" width="10" height="10" fill="hsl(var(--bc))"/>
                  <rect x="40" y="60" width="15" height="10" fill="hsl(var(--bc))"/>
                  <rect x="70" y="50" width="10" height="15" fill="hsl(var(--bc))"/>
                  <rect x="80" y="70" width="10" height="20" fill="hsl(var(--bc))"/>
                  <rect x="60" y="80" width="15" height="10" fill="hsl(var(--bc))"/>
                </svg>
                
                <button className="pmt-qr-overlay-btn" onClick={() => handleProcessPayment('Scan to Pay QR')}>
                  VIEW QR &amp; PAY
                </button>
              </div>

              <div className="pmt-qr-logos">
                <span>🌐 GPay</span>
                <span>⚡ PhonePe</span>
                <span>💳 Paytm</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          background: 'hsl(var(--n))', color: 'hsl(var(--nc))',
          padding: '12px 20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          fontSize: '14px', fontWeight: 600, maxWidth: '340px'
        }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
