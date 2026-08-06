import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { requestQuote, payAndBook } from '../services/checkout';
import '../styles/FlightBookingFlow.css';

export default function FlightPaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Bookings must belong to an authenticated user
  useEffect(() => {
    if (!localStorage.getItem('token') || !localStorage.getItem('userId')) {
      navigate('/login?returnTo=/flights', { replace: true });
    }
  }, [navigate]);

  const { flight, searchParams, passengers, contact } = location.state || {};

  const [selectedMethod, _setSelectedMethod] = useState('UPI / Google Pay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // The fare is whatever the server says it is. This page previously rendered a
  // total passed through router state (falling back to a hardcoded ₹4699) and
  // then created a booking without taking any payment at all.
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');

  const passengerCount = passengers?.length || searchParams?.passengers || 1;

  useEffect(() => {
    if (!flight?.id) return;

    let active = true;
    requestQuote({ type: 'flight', itemId: flight.id, quantity: passengerCount })
      .then((q) => { if (active) { setQuote(q); setQuoteError(''); } })
      .catch((err) => { if (active) setQuoteError(err.message); });

    return () => { active = false; };
  }, [flight?.id, passengerCount]);

  const totalAmount = quote?.totalAmount ?? null;
  const quoteReady = Boolean(quote);
  const baseFare = quote?.baseFare ?? 0;

  const handleProcessPayment = async (methodName) => {
    if (isProcessing) {
      console.warn('⚠️ Payment already processing, ignoring duplicate request');
      return;
    }

    const finalMethod = methodName || selectedMethod;

    if (!quote) {
      setError(quoteError || 'The fare is still loading. Please wait a moment.');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      if (!localStorage.getItem('userId')) {
        navigate('/login?returnTo=/flights', { replace: true });
        return;
      }

      // Money moves first. The booking is created by the server from the amount
      // the gateway captured, and only then is the trip confirmed.
      const confirmed = await payAndBook({
        quote,
        description: `${flight.airline} ${flight.flightNumber} — ${searchParams?.from} to ${searchParams?.to}`,
        prefill: {
          name: passengers?.[0]?.firstName || '',
          email: contact?.email || localStorage.getItem('userEmail') || '',
          contact: contact?.mobile || ''
        },
        bookingData: {
          type: 'flight',
          flightId: flight.id,
          userEmail: contact?.email || localStorage.getItem('userEmail') || '',
          userName: passengers?.[0]?.firstName || 'Traveller',
          fareClass: searchParams?.cabinClass,
          departureDate: searchParams?.date,
          passengers: passengers?.map(p => `${p.firstName} ${p.lastName}`) ?? [],
          travellers: { passengers, contact, searchParams, paymentMethod: finalMethod }
        }
      });

      navigate('/flights/success', {
        state: { booking: { ...confirmed, flight, passengers, contact }, flight }
      });
    } catch (err) {
      setError(err.message || 'Failed to process the payment. Please try again.');
      setIsProcessing(false);
    }
  };

  // Reached without a selected flight (direct link, refresh, or an expired
  // session). Previously this page substituted hardcoded demo passengers and a
  // ₹4699 fare, which made a fake booking look like a real one.
  if (!flight?.id || !passengers?.length) {
    return (
      <div className="flight-flow-wrapper">
        <div className="flight-flow-container">
          <div className="flight-form-card" style={{ padding: '48px 32px', textAlign: 'center' }}>
            <h3 className="flight-form-title" style={{ fontSize: '20px', marginBottom: '12px' }}>
              This booking session has expired
            </h3>
            <p style={{ fontSize: '14px', color: 'hsl(var(--bc) / 0.6)', marginBottom: '24px' }}>
              Please search again and re-select your flight so we can show you the current fare.
            </p>
            <button
              type="button"
              onClick={() => navigate('/flights')}
              className="flight-primary-btn"
              style={{ padding: '12px 28px' }}
            >
              Search flights
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flight-flow-wrapper">
      <div className="flight-flow-container">

        {/* Step Progress Bar */}
        <div className="flight-steps-bar">
          <div className="flight-step completed">
            <div className="flight-step-num">✓</div>
            <span>1. Flight Search</span>
          </div>
          <div className="flight-step-sep">――――</div>
          <div className="flight-step completed">
            <div className="flight-step-num">✓</div>
            <span>2. Select Flight</span>
          </div>
          <div className="flight-step-sep">――――</div>
          <div className="flight-step completed">
            <div className="flight-step-num">✓</div>
            <span>3. Passenger Details</span>
          </div>
          <div className="flight-step-sep">――――</div>
          <div className="flight-step active">
            <div className="flight-step-num">4</div>
            <span>4. Review & Payment</span>
          </div>
        </div>

        <div className="flight-pass-grid">

          {/* Left Column: Review Summary & Payment Options */}
          <div className="flight-left-col">

            {/* Booking Summary Box */}
            <div className="flight-form-card" style={{ padding: '24px 32px' }}>
              <h3 className="flight-form-title" style={{ fontSize: '18px', marginBottom: '16px' }}>Booking Review</h3>

              <div style={{ background: 'hsl(var(--b2))', padding: '20px', borderRadius: '8px', border: '1px solid hsl(var(--b3))', marginBottom: '20px' }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'hsl(var(--bc))', marginBottom: '4px' }}>
                  {flight.airline} {flight.flightNumber}
                </div>
                <div style={{ fontSize: '13px', color: 'hsl(var(--bc) / 0.55)' }}>
                  {flight.departure.city} ({flight.departure.time}) → {flight.arrival.city} ({flight.arrival.time}) · Class: {searchParams.cabinClass}
                </div>
              </div>

              <div style={{ fontSize: '14px', fontWeight: 800, color: 'hsl(var(--bc))', marginBottom: '12px' }}>
                Passengers ({passengers.length})
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {passengers.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'hsl(var(--bc) / 0.65)', background: 'hsl(var(--b2))', padding: '10px 16px', borderRadius: '6px' }}>
                    <span>👤 {p.firstName} {p.lastName}</span>
                    <strong>{p.nationality}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Options */}
            <div className="flight-form-card" style={{ padding: '24px 32px' }}>
              <h3 className="flight-form-title" style={{ fontSize: '18px', marginBottom: '16px' }}>Select Payment Method</h3>

              {error && (
                <div style={{ background: 'hsl(var(--er) / 0.08)', color: 'hsl(var(--er))', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
                  ⚠️ {error}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div
                  onClick={() => !isProcessing && quote && handleProcessPayment('UPI / Google Pay')}
                  style={{ padding: '20px', border: '1px solid hsl(var(--bc) / 0.1)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: (isProcessing || !quote) ? 'not-allowed' : 'pointer', background: 'hsl(var(--b2))', transition: 'border-color 0.2s', opacity: (isProcessing || !quote) ? 0.5 : 1 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '24px' }}>📱</span>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'hsl(var(--bc))' }}>UPI / Google Pay / PhonePe</div>
                      <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>Instant booking confirmation & e-ticket</div>
                    </div>
                  </div>
                  <span style={{ fontWeight: 800, color: 'hsl(var(--p))' }}>{quoteReady ? `Pay ₹${Number(totalAmount).toLocaleString('en-IN')}` : 'Loading…'} ›</span>
                </div>

                <div
                  onClick={() => !isProcessing && quote && handleProcessPayment('Credit / Debit Card')}
                  style={{ padding: '20px', border: '1px solid hsl(var(--bc) / 0.1)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: (isProcessing || !quote) ? 'not-allowed' : 'pointer', background: 'hsl(var(--b2))', transition: 'border-color 0.2s', opacity: (isProcessing || !quote) ? 0.5 : 1 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '24px' }}>💳</span>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'hsl(var(--bc))' }}>Credit & Debit Cards</div>
                      <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>Visa, Mastercard, Amex, RuPay</div>
                    </div>
                  </div>
                  <span style={{ fontWeight: 800, color: 'hsl(var(--p))' }}>{quoteReady ? `Pay ₹${Number(totalAmount).toLocaleString('en-IN')}` : 'Loading…'} ›</span>
                </div>

                <div
                  onClick={() => !isProcessing && quote && handleProcessPayment('Net Banking')}
                  style={{ padding: '20px', border: '1px solid hsl(var(--bc) / 0.1)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: (isProcessing || !quote) ? 'not-allowed' : 'pointer', background: 'hsl(var(--b2))', transition: 'border-color 0.2s', opacity: (isProcessing || !quote) ? 0.5 : 1 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '24px' }}>🏦</span>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'hsl(var(--bc))' }}>Net Banking</div>
                      <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>SBI, HDFC, ICICI, Axis & all major banks</div>
                    </div>
                  </div>
                  <span style={{ fontWeight: 800, color: 'hsl(var(--p))' }}>{quoteReady ? `Pay ₹${Number(totalAmount).toLocaleString('en-IN')}` : 'Loading…'} ›</span>
                </div>
              </div>

            </div>

          </div>

          {/* Right Column: Total Due Sidebar */}
          <div className="flight-right-col">
            <div className="flight-fare-side">
              <h3 className="flight-form-title" style={{ fontSize: '18px' }}>Total Due</h3>

              {quoteError && (
                <div style={{ background: 'hsl(var(--er) / 0.08)', color: 'hsl(var(--er))', padding: '12px', borderRadius: '6px', fontSize: '13px' }}>
                  ⚠️ {quoteError}
                </div>
              )}

              {!quote && !quoteError && (
                <div style={{ fontSize: '13px', color: 'hsl(var(--bc) / 0.6)', padding: '12px 0' }}>
                  Fetching the current fare…
                </div>
              )}

              {quote && (
                <>
                  <div className="flight-fare-row">
                    <span>Base Fare ({passengerCount} × ₹{quote.unitPrice.toLocaleString("en-IN")})</span>
                    <span>₹{baseFare.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="flight-fare-row">
                    <span>Taxes &amp; GST</span>
                    <span>₹{quote.gst.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="flight-fare-row">
                    <span>Convenience Fee</span>
                    <span>₹{quote.convenience.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="flight-fare-total">
                    <span>Total Payable</span>
                    <span style={{ color: 'hsl(var(--er))' }}>₹{totalAmount.toLocaleString("en-IN")}</span>
                  </div>

                  <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.5)', marginTop: '8px' }}>
                    {quote.policy}
                  </div>
                </>
              )}

              <button
                className="btn btn-primary btn-lg btn-block"
                onClick={() => handleProcessPayment()}
                disabled={isProcessing || !quote}
                style={{ marginTop: '20px' }}
              >
                {isProcessing
                  ? 'Processing…'
                  : quote
                    ? `Pay ₹${totalAmount.toLocaleString("en-IN")} Now`
                    : 'Loading fare…'}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
