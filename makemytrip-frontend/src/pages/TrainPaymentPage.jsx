import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { bookingService } from '../services/authService';
import '../styles/TrainBookingFlow.css';

export default function TrainPaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { train, selectedClass, searchParams, passengers, contact, totalAmount } = location.state || {
    train: { name: "Rajdhani Express", number: "12952", depTime: "16:55", arrTime: "08:30" },
    selectedClass: { code: "3A", name: "AC 3 Tier", price: 2125 },
    searchParams: { fromCity: "New Delhi", toCity: "Mumbai", travelDate: "2026-05-18", quota: "General" },
    passengers: [{ name: "Jayesh Sharma", age: 29, gender: "Male", berth: "Lower Berth" }],
    contact: { mobile: "9876543210", email: "jayesh@gmail.com" },
    totalAmount: 2160
  };

  const [selectedMethod, setSelectedMethod] = useState('UPI / Google Pay');

  const handleProcessPayment = (methodName) => {
    const finalMethod = methodName || selectedMethod;

    // Generate confirmed train booking payload
    const newBooking = {
      id: "bkg_train_" + Date.now(),
      userId: 'usr_1111-2222-3333-4444',
      type: "train",
      fromCity: `${searchParams.fromCity}`,
      toCity: `${searchParams.toCity}`,
      departureDate: searchParams.travelDate,
      returnDate: null,
      travellers: { passengers, classCode: selectedClass.code, quota: searchParams.quota, method: finalMethod, contact },
      totalAmount: totalAmount,
      status: "confirmed",
      bookingId: "MMT-TR-" + Math.floor(100000 + Math.random() * 900000),
      pnr: "PNR-" + Math.floor(1000000000 + Math.random() * 9000000000), // IRCTC 10-digit PNR
      createdAt: new Date().toISOString(),
      trainDetails: train
    };

    // Call backend to create booking and trigger email
    bookingService.createBooking(newBooking).then(() => {
      // Also save to localStorage for offline fallback/sync
      const existing = JSON.parse(localStorage.getItem('user_bookings_train') || '[]');
      localStorage.setItem('user_bookings_train', JSON.stringify([newBooking, ...existing]));

      navigate('/trains/success', { state: { booking: newBooking, train, selectedClass } });
    }).catch(err => {
      console.error("Failed to create booking on backend:", err);
      alert("There was an issue finalizing your booking. Please try again.");
    });
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div 
                  onClick={() => handleProcessPayment('UPI / Google Pay')}
                  style={{ padding: '20px', border: '1px solid hsl(var(--b3))', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: '#fff' }}
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
                  onClick={() => handleProcessPayment('Credit / Debit Card')}
                  style={{ padding: '20px', border: '1px solid hsl(var(--b3))', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: '#fff' }}
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
                  onClick={() => handleProcessPayment('Net Banking')}
                  style={{ padding: '20px', border: '1px solid hsl(var(--b3))', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: '#fff' }}
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
                onClick={() => handleProcessPayment('Instant Online Payment')}
                style={{ width: '100%', padding: '16px', marginTop: '20px' }}
              >
                Pay ₹{totalAmount.toLocaleString("en-IN")} Now
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
