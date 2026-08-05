import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { requestQuote, payAndBook } from '../services/checkout';
import '../styles/TrainBookingFlow.css';
import CheckoutStateLost from '../components/CheckoutStateLost'

export default function TrainPaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { train, selectedClass, searchParams, passengers, contact } = location.state || {};

  const [selectedMethod, setSelectedMethod] = useState('UPI / Google Pay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // The fare comes from the server, which prices from stored inventory. This
  // page previously computed its own taxes (15%) and sent the total to the
  // payment endpoint, which accepted whatever figure it was given.
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');

  // Bookings must belong to an authenticated user
  useEffect(() => {
    if (!localStorage.getItem('token') || !localStorage.getItem('userId')) {
      navigate('/login?returnTo=/trains', { replace: true });
    }
  }, [navigate]);


  // A refresh or deep link discards router state. The render below dereferences
  // `train`, `searchParams` and `selectedClass` directly, so without this it
  // threw before the user could see anything.
  useEffect(() => {
    if (!train?.id) {
      navigate('/trains', { replace: true });
    }
  }, [train, navigate]);
  useEffect(() => {
    if (!train?.id) return;

    let active = true;
    requestQuote({ type: 'train', itemId: train.id, quantity: passengers?.length || 1 })
      .then((q) => { if (active) { setQuote(q); setQuoteError(''); } })
      .catch((err) => { if (active) setQuoteError(err.message); });

    return () => { active = false; };
  }, [train?.id, passengers?.length]);

  const totalAmount = quote?.totalAmount ?? null;
  const quoteReady = Boolean(quote);

  const handleProcessPayment = async (methodName) => {
    if (isProcessing) return;

    if (!quote) {
      setError(quoteError || 'The fare is still loading. Please wait a moment.');
      return;
    }

    setSelectedMethod(methodName || selectedMethod);
    setIsProcessing(true);
    setError('');

    try {
      const booking = await payAndBook({
        quote,
        description: `Train Booking - ${train.name} ${train.number}`,
        prefill: {
          name: passengers?.[0]?.name || '',
          email: contact?.email || '',
          contact: contact?.mobile || ''
        },
        bookingData: {
          type: 'train',
          trainId: train.id,
          fromCity: searchParams?.fromCity,
          toCity: searchParams?.toCity,
          departureDate: searchParams?.travelDate,
          passengers: passengers?.map(p => ({ ...p })) ?? [],
          selectedClass,
          userEmail: contact?.email,
          userName: passengers?.[0]?.name
        }
      });

      navigate('/trains/success', {
        state: { booking, train, selectedClass, passengers, searchParams, totalAmount: booking.totalAmount }
      });
    } catch (err) {
      setError(err.message || 'The payment could not be completed. Please try again.');
      setIsProcessing(false);
    }
  };

  if (!train?.id || !selectedClass || !searchParams) return <CheckoutStateLost searchPath="/trains" label="train search" />;

  return (
    <div className="train-flow-wrapper">
      <div className="train-flow-container">

        {/* Step Progress Bar */}
        <div className="train-steps-bar">
          <div className="train-step completed">
            <div className="train-step-num">✓</div>
            <span>1. Train Search</span>
          </div>
          <div className="train-step-sep">――――</div>
          <div className="train-step completed">
            <div className="train-step-num">✓</div>
            <span>2. Select Train &amp; Class</span>
          </div>
          <div className="train-step-sep">――――</div>
          <div className="train-step completed">
            <div className="train-step-num">✓</div>
            <span>3. Passenger Details</span>
          </div>
          <div className="train-step-sep">――――</div>
          <div className="train-step active">
            <div className="train-step-num">4</div>
            <span>4. Review &amp; Payment</span>
          </div>
        </div>

        <div className="train-pass-grid">
          
          {/* Left Column: Review Summary & Payment Options */}
          <div className="train-left-col">
            
            {/* Booking Summary Box */}
            <div className="train-form-card" style={{ padding: '24px 32px' }}>
              <h3 className="train-form-title" style={{ fontSize: '18px', marginBottom: '16px' }}>Booking Review</h3>
              
              <div style={{ background: 'hsl(var(--b2))', padding: '20px', borderRadius: '8px', border: '1px solid hsl(var(--b3))', marginBottom: '20px' }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'hsl(var(--bc))', marginBottom: '4px' }}>
                  {train.name} ({train.number})
                </div>
                <div style={{ fontSize: '13px', color: 'hsl(var(--bc) / 0.55)' }}>
                  {searchParams.fromCity} ({train.depTime}) → {searchParams.toCity} ({train.arrTime}) · Class: {selectedClass.name}
                </div>
              </div>

              <div style={{ fontSize: '14px', fontWeight: 800, color: 'hsl(var(--bc))', marginBottom: '12px' }}>
                Travellers ({passengers.length})
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {passengers.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'hsl(var(--bc) / 0.65)', background: 'hsl(var(--b2))', padding: '10px 16px', borderRadius: '6px' }}>
                    <span>👤 {p.name} ({p.age} yrs, {p.gender})</span>
                    <strong>Berth: {p.berth}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Options Accordion List */}
            <div className="train-form-card" style={{ padding: '24px 32px' }}>
              <h3 className="train-form-title" style={{ fontSize: '18px', marginBottom: '16px' }}>Select Payment Method</h3>

              {error && (
                <div style={{ background: 'hsl(var(--er) / 0.08)', color: 'hsl(var(--er))', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
                  ⚠️ {error}
                </div>
              )}

              {!quote && (
                <div style={{ background: 'hsl(var(--wa) / 0.08)', color: 'hsl(var(--wa))', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
                  {quoteError ? `⚠️ ${quoteError}` : '⏳ Fetching the current fare…'}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div
                  onClick={() => !isProcessing && quote && handleProcessPayment('UPI / Google Pay')}
                  style={{ padding: '20px', border: '1px solid hsl(var(--bc) / 0.1)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: isProcessing || !quote ? 'not-allowed' : 'pointer', background: 'hsl(var(--b2))', transition: 'border-color 0.2s', opacity: isProcessing || !quote ? 0.5 : 1 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '24px' }}>📱</span>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'hsl(var(--bc))' }}>UPI / Google Pay / PhonePe</div>
                      <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>Instant IRCTC Tatkal &amp; General ticket generation</div>
                    </div>
                  </div>
                  <span style={{ fontWeight: 800, color: 'hsl(var(--p))' }}>{quoteReady ? `Pay ₹${Number(totalAmount).toLocaleString('en-IN')}` : 'Loading…'} ›</span>
                </div>

                <div
                  onClick={() => !isProcessing && quote && handleProcessPayment('Credit / Debit Card')}
                  style={{ padding: '20px', border: '1px solid hsl(var(--bc) / 0.1)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: isProcessing || !quote ? 'not-allowed' : 'pointer', background: 'hsl(var(--b2))', transition: 'border-color 0.2s', opacity: isProcessing || !quote ? 0.5 : 1 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '24px' }}>💳</span>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'hsl(var(--bc))' }}>Credit &amp; Debit Cards</div>
                      <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>Visa, Mastercard, Amex, RuPay</div>
                    </div>
                  </div>
                  <span style={{ fontWeight: 800, color: 'hsl(var(--p))' }}>{quoteReady ? `Pay ₹${Number(totalAmount).toLocaleString('en-IN')}` : 'Loading…'} ›</span>
                </div>

                <div
                  onClick={() => !isProcessing && quote && handleProcessPayment('Net Banking')}
                  style={{ padding: '20px', border: '1px solid hsl(var(--bc) / 0.1)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: isProcessing || !quote ? 'not-allowed' : 'pointer', background: 'hsl(var(--b2))', transition: 'border-color 0.2s', opacity: isProcessing || !quote ? 0.5 : 1 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '24px' }}>🏦</span>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'hsl(var(--bc))' }}>Net Banking</div>
                      <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>SBI, HDFC, ICICI, Axis &amp; all major banks</div>
                    </div>
                  </div>
                  <span style={{ fontWeight: 800, color: 'hsl(var(--p))' }}>{quoteReady ? `Pay ₹${Number(totalAmount).toLocaleString('en-IN')}` : 'Loading…'} ›</span>
                </div>
              </div>

            </div>

          </div>

          {/* Right Column: Total Due Sidebar */}
          <div className="train-right-col">
            <div className="train-fare-side">
              <h3 className="train-form-title" style={{ fontSize: '18px' }}>Total Due</h3>

              <div className="train-fare-row">
                <span>Base Fare</span>
                <span>₹{(selectedClass.price * passengers.length).toLocaleString("en-IN")}</span>
              </div>

              <div className="train-fare-row">
                <span>IRCTC Convenience Fee</span>
                <span>₹35</span>
              </div>

              <div className="train-fare-total">
                <span>Total Payable</span>
                <span style={{ color: 'hsl(var(--er))' }}>{quoteReady ? `₹${Number(totalAmount).toLocaleString("en-IN")}` : '—'}</span>
              </div>

              <button
                className="btn-primary"
                onClick={() => handleProcessPayment(selectedMethod)}
                disabled={isProcessing || !quote}
                style={{ width: '100%', padding: '16px', marginTop: '20px', opacity: isProcessing || !quote ? 0.6 : 1, cursor: isProcessing || !quote ? 'not-allowed' : 'pointer' }}
              >
                {!quote ? 'Loading...' : isProcessing ? 'Processing...' : `Pay ₹${totalAmount.toLocaleString("en-IN")} Now`}
              </button>

              <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.5)', marginTop: '12px', textAlign: 'center' }}>
                💳 Secure payment powered by Razorpay
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
