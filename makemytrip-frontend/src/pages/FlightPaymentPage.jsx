import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/FlightBookingFlow.css';

export default function FlightPaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { flight, searchParams, passengers, contact, totalAmount, baseFare } = location.state || {
    flight: { id: '1', airline: "IndiGo", flightNumber: "6E-205", departure: { city: "Delhi", time: "06:00" }, arrival: { city: "Mumbai", time: "08:15" }, price: 4500, seatsAvailable: 120 },
    searchParams: { from: "Delhi", to: "Mumbai", date: new Date().toISOString().split('T')[0], passengers: 1, cabinClass: "Economy" },
    passengers: [{ firstName: "Jayesh", lastName: "Sharma", dob: "1995-05-15", gender: "Male", nationality: "Indian" }],
    contact: { mobile: "9876543210", email: "jayesh@gmail.com" },
    totalAmount: 4699,
    baseFare: 4500
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
      const bookingId = 'FLIGHT-' + Date.now();
      const pnr = 'PNR' + Math.random().toString(36).substring(2, 8).toUpperCase();

      // Create booking object
      const booking = {
        id: bookingId,
        bookingId,
        pnr,
        status: 'confirmed',
        type: 'flight',
        flight,
        passengers,
        contact,
        totalAmount,
        baseFare,
        departureDate: searchParams.date,
        paymentMethod: finalMethod,
        createdAt: new Date().toISOString(),
        userId
      };

      // Try backend first, but fall back to localStorage
      try {
        const response = await axios.post(
          'http://localhost:5000/api/v1/bookings/flight',
          {
            userId,
            flightId: flight.id,
            passengers: passengers.map(p => `${p.firstName} ${p.lastName}`),
            fareClass: searchParams.cabinClass,
            totalAmount,
            travellers: {
              passengers,
              contact,
              searchParams,
              paymentMethod: finalMethod
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
            },
            timeout: 5000
          }
        );

        if (response.data.success) {
          booking.bookingId = response.data.data.bookingId;
          booking.pnr = response.data.data.pnr;
          booking.status = response.data.data.status;
        }
      } catch (backendErr) {
        console.warn('Backend unavailable, using local storage:', backendErr.message);
      }

      // Always save to localStorage
      console.log('📌 Saving booking to localStorage:', booking);
      const existingBookings = JSON.parse(localStorage.getItem('mmt_bookings') || '[]');
      existingBookings.push(booking);
      localStorage.setItem('mmt_bookings', JSON.stringify(existingBookings));
      console.log('✅ Booking saved! Total bookings in localStorage:', existingBookings.length);

      navigate('/flights/success', { state: { booking, flight } });
    } catch (err) {
      console.error('Payment error:', err);
      setError('Failed to process booking. Please try again.');
      setIsProcessing(false);
    }
  };

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
                  onClick={() => !isProcessing && handleProcessPayment('UPI / Google Pay')}
                  style={{ padding: '20px', border: '1px solid hsl(var(--bc) / 0.1)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: isProcessing ? 'not-allowed' : 'pointer', background: 'hsl(var(--b2))', transition: 'border-color 0.2s', opacity: isProcessing ? 0.5 : 1 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '24px' }}>📱</span>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'hsl(var(--bc))' }}>UPI / Google Pay / PhonePe</div>
                      <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>Instant booking confirmation & e-ticket</div>
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
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'hsl(var(--bc))' }}>Credit & Debit Cards</div>
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
                      <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>SBI, HDFC, ICICI, Axis & all major banks</div>
                    </div>
                  </div>
                  <span style={{ fontWeight: 800, color: 'hsl(var(--p))' }}>Pay ₹{totalAmount.toLocaleString()} ›</span>
                </div>
              </div>

            </div>

          </div>

          {/* Right Column: Total Due Sidebar */}
          <div className="flight-right-col">
            <div className="flight-fare-side">
              <h3 className="flight-form-title" style={{ fontSize: '18px' }}>Total Due</h3>

              <div className="flight-fare-row">
                <span>Base Fare</span>
                <span>₹{baseFare.toLocaleString("en-IN")}</span>
              </div>

              <div className="flight-fare-row">
                <span>Convenience Fee</span>
                <span>₹199</span>
              </div>

              <div className="flight-fare-total">
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
