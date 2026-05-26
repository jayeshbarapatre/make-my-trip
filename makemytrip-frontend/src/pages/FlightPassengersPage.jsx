import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/FlightBookingFlow.css';

export default function FlightPassengersPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { flight, searchParams } = location.state || {
    flight: { airline: "IndiGo", flightNumber: "6E-205", departure: { city: "Delhi", time: "06:00" }, arrival: { city: "Mumbai", time: "08:15" }, price: 4500, seatsAvailable: 120 },
    searchParams: { from: "Delhi", to: "Mumbai", date: new Date().toISOString().split('T')[0], passengers: 1, cabinClass: "Economy" }
  };

  const [passengers, setPassengers] = useState([
    { id: 1, firstName: '', lastName: '', dob: '', gender: 'Male', nationality: 'Indian' }
  ]);

  const [contactMobile, setContactMobile] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddPassenger = () => {
    if (passengers.length >= 9) {
      alert("Maximum 9 passengers allowed per booking.");
      return;
    }
    setPassengers([...passengers, { id: Date.now(), firstName: '', lastName: '', dob: '', gender: 'Male', nationality: 'Indian' }]);
  };

  const handleRemovePassenger = (id) => {
    if (passengers.length === 1) {
      alert("At least one passenger is required.");
      return;
    }
    setPassengers(passengers.filter(p => p.id !== id));
  };

  const handlePassengerChange = (id, field, value) => {
    setPassengers(passengers.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleProceedPayment = (e) => {
    e.preventDefault();

    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.firstName || p.firstName.trim().length < 2) {
        setErrorMsg(`Passenger ${i+1}: Please enter a valid first name.`);
        return;
      }
      if (!p.lastName || p.lastName.trim().length < 2) {
        setErrorMsg(`Passenger ${i+1}: Please enter a valid last name.`);
        return;
      }
      if (!p.dob) {
        setErrorMsg(`Passenger ${i+1}: Please enter date of birth.`);
        return;
      }
    }

    if (!contactMobile || contactMobile.trim().length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!contactEmail || !contactEmail.includes('@')) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setErrorMsg('');

    const baseFare = flight.price * passengers.length;
    const convenienceFee = 199;
    const totalAmount = baseFare + convenienceFee;

    navigate('/flights/payment', {
      state: {
        flight,
        searchParams,
        passengers,
        contact: { mobile: contactMobile, email: contactEmail },
        totalAmount,
        baseFare,
        convenienceFee
      }
    });
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
          <div className="flight-step active">
            <div className="flight-step-num">3</div>
            <span>3. Passenger Details</span>
          </div>
          <div className="flight-step-sep">――――</div>
          <div className="flight-step">
            <div className="flight-step-num">4</div>
            <span>4. Review & Payment</span>
          </div>
        </div>

        {/* Flight Summary Banner */}
        <div className="flight-route-banner">
          <div className="flight-rb-left">
            <h2>{flight.airline} {flight.flightNumber}</h2>
            <p>{flight.departure.city} ({flight.departure.time}) → {flight.arrival.city} ({flight.arrival.time}) · Date: {searchParams.date}</p>
          </div>
          <div>
            <span className="flight-rb-badge">Class: {searchParams.cabinClass}</span>
          </div>
        </div>

        {errorMsg && (
          <div style={{ background: 'hsl(var(--er) / 0.08)', color: 'hsl(var(--er))', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontWeight: 700 }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleProceedPayment} className="flight-pass-grid">

          {/* Left Column: Form Fields */}
          <div className="flight-left-col">

            <div className="flight-form-card">
              <h3 className="flight-form-title">Passenger Details</h3>

              {passengers.map((p, idx) => (
                <div key={p.id} className="flight-pass-item">
                  <div className="flight-pass-item-hdr">
                    <span>Passenger {idx + 1}</span>
                    {passengers.length > 1 && (
                      <button type="button" className="flight-rem-btn" onClick={() => handleRemovePassenger(p.id)}>✕ Remove</button>
                    )}
                  </div>

                  <div className="flight-input-row">
                    <div className="flight-input-grp">
                      <label>FIRST NAME</label>
                      <input
                        type="text"
                        placeholder="e.g. Jayesh"
                        value={p.firstName}
                        onChange={(e) => handlePassengerChange(p.id, 'firstName', e.target.value)}
                        className="flight-input"
                        required
                      />
                    </div>

                    <div className="flight-input-grp">
                      <label>LAST NAME</label>
                      <input
                        type="text"
                        placeholder="e.g. Sharma"
                        value={p.lastName}
                        onChange={(e) => handlePassengerChange(p.id, 'lastName', e.target.value)}
                        className="flight-input"
                        required
                      />
                    </div>

                    <div className="flight-input-grp">
                      <label>DATE OF BIRTH</label>
                      <input
                        type="date"
                        value={p.dob}
                        onChange={(e) => handlePassengerChange(p.id, 'dob', e.target.value)}
                        className="flight-input"
                        required
                      />
                    </div>

                    <div className="flight-input-grp">
                      <label>GENDER</label>
                      <select
                        value={p.gender}
                        onChange={(e) => handlePassengerChange(p.id, 'gender', e.target.value)}
                        className="flight-input"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="flight-input-grp">
                      <label>NATIONALITY</label>
                      <input
                        type="text"
                        placeholder="e.g. Indian"
                        value={p.nationality}
                        onChange={(e) => handlePassengerChange(p.id, 'nationality', e.target.value)}
                        className="flight-input"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button type="button" className="flight-add-pass-btn" onClick={handleAddPassenger}>
                + Add Another Passenger
              </button>
            </div>

            {/* Contact Details Card */}
            <div className="flight-form-card">
              <h3 className="flight-form-title">Contact & Email</h3>
              <p style={{ fontSize: '13px', color: 'hsl(var(--bc) / 0.55)', marginBottom: '16px' }}>Your ticket and booking confirmation will be sent to this contact.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="flight-input-grp">
                  <label>MOBILE NUMBER</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={contactMobile}
                    maxLength={10}
                    onChange={(e) => setContactMobile(e.target.value)}
                    className="flight-input"
                    required
                  />
                </div>

                <div className="flight-input-grp">
                  <label>EMAIL ADDRESS</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="flight-input"
                    required
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Fare Summary Sidebar */}
          <div className="flight-right-col">
            <div className="flight-fare-side">
              <h3 className="flight-form-title" style={{ fontSize: '18px' }}>Fare Breakdown</h3>

              <div className="flight-fare-row">
                <span>Base Fare ({passengers.length} × ₹{flight.price})</span>
                <span>₹{(flight.price * passengers.length).toLocaleString("en-IN")}</span>
              </div>

              <div className="flight-fare-row">
                <span>Convenience Fee</span>
                <span>₹199</span>
              </div>

              <div className="flight-fare-row" style={{ color: 'hsl(var(--su))', fontWeight: 700 }}>
                <span>Free Cancellation</span>
                <span>FREE</span>
              </div>

              <div className="flight-fare-total">
                <span>Total Amount</span>
                <span>₹{((flight.price * passengers.length) + 199).toLocaleString("en-IN")}</span>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '16px', marginTop: '20px' }}>
                Continue to Review & Payment
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
