import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/TrainBookingFlow.css';

export default function TrainResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = location.state || {
    fromCity: "New Delhi (NDLS)",
    toCity: "Mumbai Central (BCT)",
    travelDate: "2026-05-18",
    quota: "General",
    classPref: "All Classes"
  };

  const TRAINS = [
    {
      id: "tr_12952",
      name: "Rajdhani Express",
      number: "12952 · Western Railway",
      depTime: "16:55",
      depStation: "NDLS",
      duration: "15h 35m",
      arrTime: "08:30",
      arrStation: "BCT",
      classes: [
        { code: "1A", name: "AC First Class", price: 4255, status: "AVL 6", statusType: "green" },
        { code: "2A", name: "AC 2 Tier", price: 2845, status: "AVL 18", statusType: "green" },
        { code: "3A", name: "AC 3 Tier", price: 2125, status: "RAC 14", statusType: "yellow" }
      ]
    },
    {
      id: "tr_22120",
      name: "Mumbai Tejas Express",
      number: "22120 · Central Railway",
      depTime: "15:40",
      depStation: "NDLS",
      duration: "16h 50m",
      arrTime: "08:30",
      arrStation: "CSMT",
      classes: [
        { code: "EC", name: "Exec Chair Car", price: 2890, status: "WL 12", statusType: "red" },
        { code: "CC", name: "AC Chair Car", price: 1420, status: "AVL 86", statusType: "green" }
      ]
    },
    {
      id: "tr_12260",
      name: "Mumbai Duronto Express",
      number: "12260 · Western Railway",
      depTime: "23:00",
      depStation: "NZM",
      duration: "15h 50m",
      arrTime: "14:50",
      arrStation: "BCT",
      classes: [
        { code: "1A", name: "AC First Class", price: 4110, status: "AVL 4", statusType: "green" },
        { code: "2A", name: "AC 2 Tier", price: 2780, status: "WL 5", statusType: "red" },
        { code: "3A", name: "AC 3 Tier", price: 2050, status: "AVL 44", statusType: "green" },
        { code: "SL", name: "Sleeper Class", price: 685, status: "RAC 28", statusType: "yellow" }
      ]
    },
    {
      id: "tr_12954",
      name: "August Kranti Rajdhani",
      number: "12954 · Western Railway",
      depTime: "17:20",
      depStation: "NZM",
      duration: "16h 40m",
      arrTime: "10:00",
      arrStation: "BCT",
      classes: [
        { code: "2A", name: "AC 2 Tier", price: 2845, status: "AVL 12", statusType: "green" },
        { code: "3A", name: "AC 3 Tier", price: 2125, status: "AVL 38", statusType: "green" }
      ]
    }
  ];

  const [selectedTrainId, setSelectedTrainId] = useState(TRAINS[0].id);
  const [selectedClassCode, setSelectedClassCode] = useState(TRAINS[0].classes[0].code);

  const handleSelectClass = (trainId, cls) => {
    setSelectedTrainId(trainId);
    setSelectedClassCode(cls.code);
  };

  const handleProceedBook = (train) => {
    const chosenCls = train.classes.find(c => c.code === selectedClassCode) || train.classes[0];
    navigate('/trains/passengers', {
      state: {
        train,
        selectedClass: chosenCls,
        searchParams
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
          <div className="train-step active">
            <div className="train-step-num">2</div>
            <span>2. Select Train &amp; Class</span>
          </div>
          <div className="train-step-sep">――――</div>
          <div className="train-step">
            <div className="train-step-num">3</div>
            <span>3. Passenger Details</span>
          </div>
          <div className="train-step-sep">――――</div>
          <div className="train-step">
            <div className="train-step-num">4</div>
            <span>4. Review &amp; Payment</span>
          </div>
        </div>

        {/* Top Route Banner */}
        <div className="train-route-banner">
          <div className="train-rb-left">
            <h2>🚂 {searchParams.fromCity} → {searchParams.toCity}</h2>
            <p>Journey Date: {searchParams.travelDate} · Quota: {searchParams.quota}</p>
          </div>
          <div>
            <span className="train-rb-badge">IRCTC AUTHORISED</span>
          </div>
        </div>

        {/* Results List */}
        <div className="train-results-list">
          {TRAINS.map((train) => {
            const isSelectedTrain = selectedTrainId === train.id;
            const chosenCls = train.classes.find(c => c.code === selectedClassCode) || train.classes[0];

            return (
              <div key={train.id} className="train-res-card">
                <div className="train-res-top">
                  <div className="train-name-col">
                    <h3>{train.name}</h3>
                    <p>{train.number}</p>
                  </div>

                  <div className="train-time-col">
                    <div className="train-time-node">
                      <div className="train-time-val">{train.depTime}</div>
                      <div className="train-time-lbl">{train.depStation}</div>
                    </div>

                    <div className="train-time-sep">
                      <div className="train-time-dur">{train.duration}</div>
                      <div className="train-time-line"/>
                      <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.55)' }}>Non-stop</div>
                    </div>

                    <div className="train-time-node">
                      <div className="train-time-val">{train.arrTime}</div>
                      <div className="train-time-lbl">{train.arrStation}</div>
                    </div>
                  </div>
                </div>

                {/* Class Availabilities Row */}
                <div className="train-res-classes">
                  {train.classes.map((cls) => {
                    const isSelectedCls = isSelectedTrain && selectedClassCode === cls.code;
                    return (
                      <div 
                        key={cls.code} 
                        className={`train-cls-box ${isSelectedCls ? 'selected' : ''}`}
                        onClick={() => handleSelectClass(train.id, cls)}
                      >
                        <div className="train-cls-hdr">
                          <span>{cls.code}</span>
                          <span className="train-cls-price">₹{cls.price}</span>
                        </div>
                        <span className={`train-cls-status status-${cls.statusType}`}>
                          {cls.status}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Booking Action Bar */}
                {isSelectedTrain && (
                  <div className="train-res-action">
                    <div>
                      <span style={{ fontSize: '13px', color: 'hsl(var(--bc) / 0.55)' }}>Selected Class: </span>
                      <strong style={{ fontSize: '16px', color: 'hsl(var(--bc))' }}>{chosenCls.name} ({chosenCls.code})</strong>
                    </div>
                    <button className="train-select-btn btn-primary" onClick={() => handleProceedBook(train)}>
                      Book Now
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
