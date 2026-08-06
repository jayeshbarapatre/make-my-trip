import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { requestQuote, payAndBook } from '../services/checkout';
import '../styles/HotelPaymentPage.css';
import CheckoutStateLost from '../components/CheckoutStateLost'

export default function CabPaymentPage() {
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

  // Checkout state lives in router state, which a refresh or a deep link
  // discards. This used to fall back to a fabricated cab (`id: "cab-fallback"`,
  // a made-up driver and a ₹450 price) on a route the customer never chose:
  // pricing correctly refused the unknown id, so the page showed a real-looking
  // cab with a broken quote and no way forward. Send them back to pick again.
  const cab = location.state?.cab ?? null;
  const pickupLocation = location.state?.pickupLocation ?? '';
  const dropLocation = location.state?.dropLocation ?? '';
  const distance = location.state?.distance ?? '';
  const estimatedTime = location.state?.estimatedTime ?? '';
  const travelDate = location.state?.travelDate ?? '';

  useEffect(() => {
    if (user && !cab?.id) {
      navigate('/cabs', { replace: true });
    }
  }, [user, cab, navigate]);
  const [_selectedMethod, _setSelectedMethod] = useState('UPI');

  // The ride is priced by the server from stored cab rates, replacing the
  // router-state total (which defaulted to a hardcoded ₹567).
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');

  useEffect(() => {
    if (!cab?.id) return;

    let active = true;
    // Distance drives the per-km portion of the fare; the server re-parses it
    // and carries it in the signed quote so it cannot be lowered before payment.
    requestQuote({ type: 'cab', itemId: cab.id, quantity: 1, distance })
      .then((q) => { if (active) { setQuote(q); setQuoteError(''); } })
      .catch((err) => { if (active) { setQuote(null); setQuoteError(err.message); } });

    return () => { active = false; };
  }, [cab?.id, distance]);

  const totalAmount = quote?.totalAmount ?? null;
  const quoteReady = Boolean(quote);
  const baseFare = quote?.baseFare ?? null;

  const handleProcessPayment = async (_methodName) => {
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
    console.log('🚖 Starting cab booking payment process...');

    try {
      if (!quote) {
        setToastMessage(quoteError || 'The fare is still loading. Please wait a moment.');
        setTimeout(() => setToastMessage(''), 3500);
        setIsProcessing(false);
        return;
      }

      // One shared checkout: the server prices the ride and creates the booking
      // from the amount the gateway actually captured.
      const booking = await payAndBook({
        quote,
        description: cab.type + ' - ' + pickupLocation + ' to ' + dropLocation,
        prefill: {
          name: user?.name || 'Guest User',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        bookingData: {
          type: 'cab',
          cabId: cab.id,
          cabType: cab.type,
          cabModel: cab.model,
          driver: cab.driver,
          licensePlate: cab.licensePlate,
          pickupLocation,
          dropLocation,
          // The vehicle is held for this date. The server rejects a cab
          // booking without one (DATE_REQUIRED) rather than silently
          // reserving nothing.
          travelDate,
          fromCity: pickupLocation,
          toCity: dropLocation,
          distance,
          estimatedTime,
          userEmail: user?.email,
          userName: user?.name
        }
      });

      navigate('/cab/success', {
        state: {
          booking,
          cab,
          pickupLocation,
          dropLocation,
          distance,
          estimatedTime,
          totalAmount: booking.totalAmount
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

  // The redirect above fires in an effect, so the first render still happens
  // with no cab. Render nothing rather than dereferencing it.
  // The travel date is as load-bearing as the cab itself: the server reserves
  // the vehicle against it and refuses the booking without one. Catching it
  // here sends the customer back to re-pick; catching it after payment would
  // mean money captured against a booking the server then rejects.
  if (!cab?.id || !travelDate) return <CheckoutStateLost searchPath="/cabs" label="cab search" />;

  return (
    <div style={{ background: 'hsl(var(--b2))', minHeight: '100vh', padding: '40px 0 80px', fontFamily: "'Space Grotesk', sans-serif", color: 'hsl(var(--bc))' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>

        {/* Step Progress Bar */}
        <div style={{ width: '100%', boxSizing: 'border-box', background: 'hsl(var(--b1))', border: '1px solid hsl(var(--b2))', borderRadius: '12px', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', overflow: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700, color: 'hsl(var(--bc))', fontSize: '14px', whiteSpace: 'nowrap' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'hsl(var(--su))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: 'white' }}>✓</div>
            <span>1. Search Cab</span>
          </div>
          <div style={{ color: 'hsl(var(--bc) / 0.2)', fontWeight: 900 }}>――――</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700, color: 'hsl(var(--bc))', fontSize: '14px', whiteSpace: 'nowrap' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'hsl(var(--su))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: 'white' }}>✓</div>
            <span>2. Select Cab</span>
          </div>
          <div style={{ color: 'hsl(var(--bc) / 0.2)', fontWeight: 900 }}>――――</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700, color: 'hsl(var(--p))', fontSize: '14px', whiteSpace: 'nowrap' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'hsl(var(--p))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: 'white' }}>3</div>
            <span>3. Payment</span>
          </div>
        </div>

        {/* Main Payment Layout - 3 Column */}
        <form onSubmit={(e) => { e.preventDefault(); handleProcessPayment(); }} style={{ display: 'grid', gridTemplateColumns: '320px 1fr 340px', gap: '2rem', marginBottom: '2rem' }}>

          {/* Left Column: Payment Options */}
          <div>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '0.95rem', fontWeight: 700, color: 'hsl(var(--bc))' }}>SELECT PAYMENT MODE</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '2px solid hsl(var(--p))',
                background: 'hsl(var(--b1))',
                cursor: 'pointer',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center'
              }}>
                <input type="radio" name="payment" value="upi" defaultChecked style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>📱 UPI (GPay, PhonePe, BHIM)</span>
              </label>

              <label style={{
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid hsl(var(--b2))',
                background: 'hsl(var(--b1))',
                cursor: 'pointer',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center'
              }}>
                <input type="radio" name="payment" value="card" style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>💳 Credit / Debit Card</span>
              </label>

              <label style={{
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid hsl(var(--b2))',
                background: 'hsl(var(--b1))',
                cursor: 'pointer',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center'
              }}>
                <input type="radio" name="payment" value="wallet" style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>👜 Wallets</span>
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '2rem' }}>
                <button type="button" onClick={() => navigate(-1)} style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid hsl(var(--b2))',
                  background: 'hsl(var(--b1))',
                  color: 'hsl(var(--bc))',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}>
                  ← Back
                </button>
              </div>
            </div>
          </div>

          {/* Center Column: Cab Details */}
          <div style={{ background: 'hsl(var(--b1))', padding: '2rem', borderRadius: '0.75rem', border: '1px solid hsl(var(--b2))' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '0.95rem', fontWeight: 700, color: 'hsl(var(--bc))' }}>CAB BOOKING DETAILS</h3>

            <div style={{ background: 'hsl(var(--b2))', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 700, color: 'hsl(var(--bc))', marginBottom: '0.5rem', fontSize: '1rem' }}>
                {cab.type} • {cab.model}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'hsl(var(--nc))', marginBottom: '1rem' }}>
                License: {cab.licensePlate}
              </div>

              <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'hsl(var(--nc))' }}>📍 Pickup</span>
                  <span style={{ fontWeight: 600, color: 'hsl(var(--bc))' }}>{pickupLocation}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'hsl(var(--nc))' }}>📍 Drop-off</span>
                  <span style={{ fontWeight: 600, color: 'hsl(var(--bc))' }}>{dropLocation}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'hsl(var(--nc))' }}>📏 Distance</span>
                  <span style={{ fontWeight: 600, color: 'hsl(var(--bc))' }}>{distance}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'hsl(var(--nc))' }}>⏱️ Duration</span>
                  <span style={{ fontWeight: 600, color: 'hsl(var(--bc))' }}>{estimatedTime}</span>
                </div>
              </div>
            </div>

            <div style={{ background: 'hsl(var(--b2))', padding: '1.5rem', borderRadius: '0.5rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem', color: 'hsl(var(--bc))' }}>DRIVER INFORMATION</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'hsl(var(--bc))' }}>👤 {cab.driver}</div>
                  <div style={{ fontSize: '0.85rem', color: 'hsl(var(--nc))' }}>{cab.type} Driver</div>
                </div>
                <div style={{ fontWeight: 700, color: 'hsl(var(--su))', fontSize: '1.1rem' }}>⭐ {cab.rating}</div>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Booking Summary */}
          <div style={{ background: 'hsl(var(--b1))', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid hsl(var(--b2))', height: 'fit-content', position: 'sticky', top: '20px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '0.95rem', fontWeight: 700, color: 'hsl(var(--bc))' }}>BOOKING SUMMARY</h3>

            {/* The fare arrives from the server a moment after this renders, so
                every figure below is null on the first paint. Reading it
                unconditionally crashed the whole page into the ErrorBoundary
                before the customer ever saw a cab — and a failed quote left it
                crashed for good. Same shape as FlightPaymentPage. */}
            {!quote && !quoteError && (
              <div style={{ fontSize: '13px', color: 'hsl(var(--bc) / 0.6)', padding: '12px 0' }}>
                Fetching the current fare…
              </div>
            )}

            {quoteError && (
              <div style={{ fontSize: '13px', color: 'hsl(var(--er))', padding: '12px 0', lineHeight: 1.5 }}>
                {quoteError}
              </div>
            )}

            {quote && (
              <>
                {/* Rendered verbatim from the quote — the frontend never
                    computes a total (see pricingService). */}
                <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid hsl(var(--b2))' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'hsl(var(--nc))' }}>
                    <span>Base Fare</span>
                    <span>₹{baseFare.toLocaleString("en-IN")}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'hsl(var(--nc))' }}>
                    <span>Taxes &amp; GST</span>
                    <span>₹{(quote.gst ?? 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'hsl(var(--nc))' }}>
                    <span>Convenience Fee</span>
                    <span>₹{(quote.convenience ?? 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 700, color: 'hsl(var(--p))' }}>
                  <span>Payable Amt:</span>
                  <span>₹{totalAmount.toLocaleString("en-IN")}</span>
                </div>

                {quote.policy && (
                  <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.5)', marginTop: '-8px', marginBottom: '12px' }}>
                    {quote.policy}
                  </div>
                )}
              </>
            )}

            <button type="submit" disabled={isProcessing || !quoteReady} style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: 'hsl(var(--p))',
              color: 'white',
              fontWeight: 700,
              cursor: (isProcessing || !quoteReady) ? 'not-allowed' : 'pointer',
              fontSize: '0.95rem',
              opacity: (isProcessing || !quoteReady) ? 0.6 : 1
            }}>
              {isProcessing ? 'Processing...' : `PAY NOW ${quoteReady ? '₹' + Number(totalAmount).toLocaleString("en-IN") : '—'}`}
            </button>
          </div>

        </form>
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
