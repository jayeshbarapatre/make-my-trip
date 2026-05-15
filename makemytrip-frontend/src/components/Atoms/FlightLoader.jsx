import React from 'react'
import '../../styles/Sections.css'

export default function FlightLoader() {
  return (
    <div className="flight-loader-container">
      {/* Visual top progress bar */}
      <div className="flight-loader-progress-bar">
        <div className="flight-loader-progress-fill" />
      </div>

      {/* Airplane graphic with float micro-animation */}
      <div className="flight-loader-plane-wrapper">
        <svg 
          width="180" 
          height="80" 
          viewBox="0 0 180 80" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="flight-loader-plane-svg"
        >
          {/* Back vertical fin */}
          <path 
            d="M32,18 L48,18 L58,42 L26,42 Z" 
            fill="#e2e8f0" 
            stroke="#475569" 
            strokeWidth="2.5" 
            strokeLinejoin="round" 
          />
          {/* Horizontal tail wing */}
          <path 
            d="M20,41 L44,41 L36,49 L18,49 Z" 
            fill="#cbd5e1" 
            stroke="#475569" 
            strokeWidth="2.5" 
            strokeLinejoin="round" 
          />
          {/* Main Fuselage */}
          <path 
            d="M40,43 C40,26 135,26 162,43 C135,60 40,60 40,43 Z" 
            fill="#ffffff" 
            stroke="#475569" 
            strokeWidth="2.5" 
            strokeLinejoin="round" 
          />
          {/* Cockpit windshield curve */}
          <path 
            d="M144,38 C148,38 152,40 154,42 C149,43 144,43 144,38 Z" 
            fill="#475569" 
          />
          {/* Row of passenger cabin windows */}
          <circle cx="64" cy="43" r="3" fill="#475569" />
          <circle cx="76" cy="43" r="3" fill="#475569" />
          <circle cx="88" cy="43" r="3" fill="#475569" />
          <circle cx="100" cy="43" r="3" fill="#475569" />
          <circle cx="112" cy="43" r="3" fill="#475569" />
          <circle cx="124" cy="43" r="3" fill="#475569" />
          <circle cx="136" cy="43" r="3" fill="#475569" />
          {/* Bottom swept-back wing */}
          <path 
            d="M90,49 L74,68 L94,68 L118,49 Z" 
            fill="#ffffff" 
            stroke="#475569" 
            strokeWidth="2.5" 
            strokeLinejoin="round" 
          />
          {/* Underwing Jet Engine */}
          <rect 
            x="82" 
            y="61" 
            width="22" 
            height="10" 
            rx="5" 
            fill="#cbd5e1" 
            stroke="#475569" 
            strokeWidth="2" 
          />
        </svg>
      </div>

      {/* Bold user-facing message */}
      <h3 className="flight-loader-text">
        Hold on, we're fetching flights for you
      </h3>

      {/* Replicating the bottom drag dashboard pill */}
      <div className="flight-loader-bottom-dash" />
    </div>
  )
}
