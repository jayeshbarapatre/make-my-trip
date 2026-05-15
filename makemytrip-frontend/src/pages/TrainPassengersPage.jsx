import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/TrainBookingFlow.css';

export default function TrainPassengersPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { train, selectedClass, searchParams } = location.state || {
    train: { name: "Rajdhani Express", number: "12952", depTime: "16:55", arrTime: "08:30" },
    selectedClass: { code: "3A", name: "AC 3 Tier", price: 2125 },
    searchParams: { fromCity: "New Delhi", toCity: "Mumbai", travelDate: "2026-05-18", quota: "General" }
  };

  const [passengers, setPassengers] = useState([
    { id: 1, name: '', age: '', gender: 'Male', berth: 'Lower Berth' }
  ]);

  const [contactMobile, setContactMobile] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddPassenger = () => {
    if (passengers.length >= 6) {
      alert("Maximum 6 passengers allowed per booking.");
      return;
    }
    setPassengers([...passengers, { id: Date.now(), name: '', age: '', gender: 'Male', berth: 'No Preference' }]);
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

    // Validate passengers
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.name || p.name.trim().length < 3) {
        setErrorMsg(`Passenger ${i+1}: Please enter a valid full name.`);
        return;
      }
      if (!p.age || isNaN(p.age) || Number(p.age) < 1 || Number(p.age) > 120) {
        setErrorMsg(`Passenger ${i+1}: Please enter a valid age.`);
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

    // Total Fare calculation
    const baseTotal = selectedClass.price * passengers.length;
    const irctcFee = 35;
    const totalAmount = baseTotal + irctcFee;

    navigate('/trains/payment', {
      state: {
        train,
        selectedClass,
        searchParams,
        passengers,
        contact: { mobile: contactMobile, email: contactEmail },
        totalAmount,
        baseTotal,
        irctcFee
      }
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
          <div className="train-step active">
            <div className="train-step-num">3</div>
            <span>3. Passenger Details</span>
          </div>
          <div className="train-step-sep">――――</div>
          <div className="train-step">
            <div className="train-step-num">4</div>
            <span>4. Review &amp; Payment</span>
          </div>
        </div>

        {/* Top Summary Banner */}
        <div className="train-route-banner" style={{ background: '#1e293b' }}>
          <div className="train-rb-left">
            <h2>{train.name} ({train.number})</h2>
            <p>{searchParams.fromCity} ({train.depTime}) → {searchParams.toCity} ({train.arrTime}) · Date: {searchParams.travelDate}</p>
          </div>
          <div>
            <span className="train-rb-badge" style={{ background: '#10b981' }}>Class: {selectedClass.name}</span>
          </div>
        </div>

        {errorMsg && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontWeight: 700 }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleProceedPayment} className="train-pass-grid">
          
          {/* Left Column: Form Fields */}
          <div className="train-left-col">
            
            <div className="train-form-card">
              <h3 className="train-form-title">Traveller Details</h3>

              {passengers.map((p, idx) => (
                <div key={p.id} className="train-pass-item">
                  <div className="train-pass-item-hdr">
                    <span>Passenger {idx + 1}</span>
                    {passengers.length > 1 && (
                      <button type="button" className="train-rem-btn" onClick={() => handleRemovePassenger(p.id)}>✕ Remove</button>
                    )}
                  </div>

                  <div className="train-input-row">
                    <div className="train-input-grp">
                      <label>FULL NAME (As on Govt ID)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Jayesh Sharma" 
                        value={p.name}
                        onChange={(e) => handlePassengerChange(p.id, 'name', e.target.value)}
                        className="train-input" 
                        required
                      />
                    </div>

                    <div className="train-input-grp">
                      <label>AGE</label>
                      <input 
                        type="number" 
                        placeholder="Years" 
                        value={p.age}
                        onChange={(e) => handlePassengerChange(p.id, 'age', e.target.value)}
                        className="train-input" 
                        required
                      />
                    </div>

                    <div className="train-input-grp">
                      <label>GENDER</label>
                      <select 
                        value={p.gender}
                        onChange={(e) => handlePassengerChange(p.id, 'gender', e.target.value)}
                        className="train-input"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Transgender">Transgender</option>
                      </select>
                    </div>

                    <div className="train-input-grp">
                      <label>BERTH PREF</label>
                      <select 
                        value={p.berth}
                        onChange={(e) => handlePassengerChange(p.id, 'berth', e.target.value)}
                        className="train-input"
                      >
                        <option value="No Preference">No Preference</option>
                        <option value="Lower Berth">Lower Berth</option>
                        <option value="Middle Berth">Middle Berth</option>
                        <option value="Upper Berth">Upper Berth</option>
                        <option value="Side Lower">Side Lower</option>
                        <option value="Side Upper">Side Upper</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              <button type="button" className="train-add-pass-btn" onClick={handleAddPassenger}>
                + Add Another Passenger
              </button>
            </div>

            {/* Contact Details Card */}
            <div className="train-form-card">
              <h3 className="train-form-title">Contact &amp; Ticket Delivery</h3>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>Your ticket, PNR status updates, and charting info will be sent here.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="train-input-grp">
                  <label>MOBILE NUMBER</label>
                  <input 
                    type="tel" 
                    placeholder="10-digit mobile number" 
                    value={contactMobile}
                    onChange={(e) => setContactMobile(e.target.value)}
                    className="train-input" 
                    required 
                  />
                </div>

                <div className="train-input-grp">
                  <label>EMAIL ADDRESS</label>
                  <input 
                    type="email" 
                    placeholder="name@example.com" 
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="train-input" 
                    required 
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Fare Summary Sidebar */}
          <div className="train-right-col">
            <div className="train-fare-side">
              <h3 className="train-form-title" style={{ fontSize: '18px' }}>Fare Breakdown</h3>

              <div className="train-fare-row">
                <span>Ticket Fare ({passengers.length} x ₹{selectedClass.price})</span>
                <span>₹{(selectedClass.price * passengers.length).toLocaleString("en-IN")}</span>
              </div>

              <div className="train-fare-row">
                <span>IRCTC Convenience Fee</span>
                <span>₹35</span>
              </div>

              <div className="train-fare-row" style={{ color: '#10b981', fontWeight: 700 }}>
                <span>Free Cancellation Insurance</span>
                <span>FREE</span>
              </div>

              <div className="train-fare-total">
                <span>Total Amount</span>
                <span>₹{((selectedClass.price * passengers.length) + 35).toLocaleString("en-IN")}</span>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '16px', marginTop: '20px' }}>
                Continue to Review &amp; Payment
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
