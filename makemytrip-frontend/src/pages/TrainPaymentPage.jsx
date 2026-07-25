import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/TrainBookingFlow.css';

export default function TrainPaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { train, selectedClass, searchParams, passengers, contact, totalAmount } = location.state || {
    train: { name: "Rajdhani Express", number: "12952", depTime: "16:55", arrTime: "08:30" },
    selectedClass: { code: "3A", name: "AC 3 Tier", price: 2125 },
    searchParams: { fromCity: "New Delhi", toCity: "Mumbai", travelDate: new Date().toISOString().split('T')[0], quota: "General" },
    passengers: [{ name: "Jayesh Sharma", age: 29, gender: "Male", berth: "Lower Berth" }],
    contact: { mobile: "9876543210", email: "jayesh@gmail.com" },
    totalAmount: 2160
  };

  const [selectedMethod, setSelectedMethod] = useState('UPI / Google Pay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleProcessPayment = async (methodName) => {
    const finalMethod = methodName || selectedMethod;
    setIsProcessing(true);
    setError('');

    try {
      const userId = localStorage.getItem('userId') || 'usr_guest_' + Date.now();

      // Call backend to create train booking (server generates PNR and bookingId)
      const response = await axios.post(
        'http://localhost:5000/api/v1/bookings/trains',
        {
          userId,
          trainId: train.id || 'train_' + Date.now(),
          passengers: passengers.map(p => p.name),
          class: selectedClass.code,
          quota: searchParams.quota,
          totalAmount,
          fromCity: searchParams.fromCity,
          toCity: searchParams.toCity,
          departureDate: searchParams.travelDate,
          returnDate: searchParams.travelDate,
          travellers: {
            passengers,
            contact,
            searchParams,
            paymentMethod: finalMethod
          },
          // ✅ ENRICHED TRAIN FIELDS
          baseFare: totalAmount * 0.8,
          taxes: totalAmount * 0.15,
          convenience: totalAmount * 0.05,
          discount: 0,
          gst: totalAmount * 0.05,
          paymentMethod: 'credit_card',
          paymentStatus: 'completed',
          transactionId: ''
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
          }
        }
      );

      if (response.data.success) {
        // Server returns PNR and bookingId
        const booking = {
          bookingId: response.data.data.bookingId,
          pnr: response.data.data.pnr,
          status: response.data.data.status,
          train,
          selectedClass,
          passengers,
          contact,
          totalAmount,
          departureDate: searchParams.travelDate,
          paymentMethod: finalMethod,
          createdAt: new Date().toISOString()
        };

        navigate('/trains/success', { state: { booking, train, selectedClass, passengers, searchParams, totalAmount } });
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.message || 'Failed to process booking. Please try again.');
      setIsProcessing(false);
    }
  };

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
              <h3 className="train-form-title" style={{ fontSize: '18px', marginBottom: '16px' }}>Select Payment Gateway</h3>

              {error && (
                <div style={{ background: 'hsl(var(--er) / 0.08)', color: 'hsl(var(--er))', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
                  ⚠️ {error}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div
                  onClick={() => !isProcessing && handleProcessPayment('UPI / Google Pay')}
                  style={{ padding: '20px', border: '1px solid hsl(var(--bc) / 0.1)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: isProcessing ? 'not-allowed' : 'pointer', background: 'hsl(var(--b2))', transition: 'border-color 0.2s', opacity: isProcessing ? 0.5 : 1 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '24px' }}>📱</span>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'hsl(var(--bc))' }}>UPI / Google Pay / PhonePe</div>
                      <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>Instant IRCTC Tatkal &amp; General ticket generation</div>
                    </div>
                  </div>
                  <span style={{ fontWeight: 800, color: 'hsl(var(--p))' }}>Pay ₹{totalAmount.toLocaleString()} ›</span>
                </div>

                <div
                  onClick={() => !isProcessing && handleProcessPayment('Credit / Debit Card')}
                  style={{ padding: '20px', border: '1px solid hsl(var(--bc) / 0.1)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: isProcessing ? 'not-allowed' : 'pointer', background: 'hsl(var(--b2))', transition: 'border-color 0.2s', opacity: isProcessing ? 0.5 : 1 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '24px' }}>💳</span>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'hsl(var(--bc))' }}>Credit &amp; Debit Cards</div>
                      <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>Visa, Mastercard, Amex, RuPay</div>
                    </div>
                  </div>
                  <span style={{ fontWeight: 800, color: 'hsl(var(--p))' }}>Pay ₹{totalAmount.toLocaleString()} ›</span>
                </div>

                <div
                  onClick={() => !isProcessing && handleProcessPayment('Net Banking')}
                  style={{ padding: '20px', border: '1px solid hsl(var(--bc) / 0.1)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: isProcessing ? 'not-allowed' : 'pointer', background: 'hsl(var(--b2))', transition: 'border-color 0.2s', opacity: isProcessing ? 0.5 : 1 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '24px' }}>🏦</span>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'hsl(var(--bc))' }}>Net Banking</div>
                      <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>SBI, HDFC, ICICI, Axis &amp; all major banks</div>
                    </div>
                  </div>
                  <span style={{ fontWeight: 800, color: 'hsl(var(--p))' }}>Pay ₹{totalAmount.toLocaleString()} ›</span>
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
                <span style={{ color: 'hsl(var(--er))' }}>₹{totalAmount.toLocaleString("en-IN")}</span>
              </div>

              <button
                className="btn-primary"
                onClick={() => handleProcessPayment()}
                disabled={isProcessing}
                style={{ width: '100%', padding: '16px', marginTop: '20px', opacity: isProcessing ? 0.6 : 1, cursor: isProcessing ? 'not-allowed' : 'pointer' }}
              >
                {isProcessing ? 'Processing...' : `Pay ₹${totalAmount.toLocaleString("en-IN")} Now`}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
