import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function FlightsPage() {
  const navigate = useNavigate();
  const [tripType, setTripType] = useState('oneway');
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [cabinClass, setCabinClass] = useState('Economy');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const indianCities = [
    'Delhi',
    'Mumbai',
    'Bangalore',
    'Hyderabad',
    'Chennai',
    'Kolkata',
    'Pune',
    'Ahmedabad',
    'Jaipur',
    'Lucknow'
  ];

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');

    if (!fromCity || !toCity || !departDate) {
      setError('Please fill in all required fields');
      return;
    }

    if (tripType === 'roundtrip' && !returnDate) {
      setError('Please select return date for round-trip');
      return;
    }

    setLoading(true);

    try {
      const searchParams = {
        from: fromCity,
        to: toCity,
        date: departDate,
        returnDate: tripType === 'roundtrip' ? returnDate : null,
        passengers,
        cabinClass,
        tripType
      };

      const response = await axios.get(
        'http://localhost:5000/api/v1/flights',
        { params: { from: fromCity, to: toCity, date: departDate, passengers } }
      );

      if (response.data.data && response.data.data.length > 0) {
        navigate('/flights/results', { state: { flights: response.data.data, searchParams } });
      } else {
        setError('No flights found for your search. Please try different dates or cities.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err.response?.data?.message || 'Failed to search flights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'hsl(var(--b1))', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '8px', textAlign: 'center' }}>
          Book Flights Online
        </h1>
        <p style={{ fontSize: '16px', color: 'hsl(var(--bc) / 0.6)', textAlign: 'center', marginBottom: '40px' }}>
          Search, compare, and book flights to your favourite destinations
        </p>

        <form onSubmit={handleSearch} style={{ background: 'hsl(var(--b2))', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>

          {error && (
            <div style={{ background: 'hsl(var(--er) / 0.08)', color: 'hsl(var(--er))', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Trip Type Toggle */}
          <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                value="oneway"
                checked={tripType === 'oneway'}
                onChange={(e) => setTripType(e.target.value)}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 700 }}>One-way</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                value="roundtrip"
                checked={tripType === 'roundtrip'}
                onChange={(e) => setTripType(e.target.value)}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 700 }}>Round-trip</span>
            </label>
          </div>

          {/* Location and Date Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>

            {/* From City */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
                FROM
              </label>
              <input
                type="text"
                list="city-list"
                placeholder="Departure city"
                value={fromCity}
                onChange={(e) => setFromCity(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid hsl(var(--b3))', fontSize: '14px', boxSizing: 'border-box' }}
                required
              />
              <datalist id="city-list">
                {indianCities.map(city => (
                  <option key={city} value={city} />
                ))}
              </datalist>
            </div>

            {/* To City */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
                TO
              </label>
              <input
                type="text"
                placeholder="Destination city"
                value={toCity}
                onChange={(e) => setToCity(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid hsl(var(--b3))', fontSize: '14px', boxSizing: 'border-box' }}
                required
              />
            </div>

            {/* Departure Date */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
                DEPARTURE DATE
              </label>
              <input
                type="date"
                value={departDate}
                onChange={(e) => setDepartDate(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid hsl(var(--b3))', fontSize: '14px', boxSizing: 'border-box' }}
                required
              />
            </div>

            {/* Return Date (if Round-trip) */}
            {tripType === 'roundtrip' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
                  RETURN DATE
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid hsl(var(--b3))', fontSize: '14px', boxSizing: 'border-box' }}
                  required={tripType === 'roundtrip'}
                />
              </div>
            )}

            {/* Passengers */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
                PASSENGERS
              </label>
              <select
                value={passengers}
                onChange={(e) => setPassengers(parseInt(e.target.value))}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid hsl(var(--b3))', fontSize: '14px', boxSizing: 'border-box' }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <option key={num} value={num}>{num} Passenger{num > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            {/* Cabin Class */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
                CLASS
              </label>
              <select
                value={cabinClass}
                onChange={(e) => setCabinClass(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid hsl(var(--b3))', fontSize: '14px', boxSizing: 'border-box' }}
              >
                <option value="Economy">Economy</option>
                <option value="Premium Economy">Premium Economy</option>
                <option value="Business">Business</option>
                <option value="First">First Class</option>
              </select>
            </div>

          </div>

          {/* Search Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: loading ? 'hsl(var(--b3))' : 'var(--color-primary)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s ease'
            }}
            onMouseEnter={(e) => !loading && (e.target.style.opacity = '0.88')}
            onMouseLeave={(e) => !loading && (e.target.style.opacity = '1')}
          >
            {loading ? 'Searching...' : 'Search Flights'}
          </button>

        </form>

        {/* Popular Routes Section */}
        <div style={{ marginTop: '60px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px', textAlign: 'center' }}>
            Popular Routes
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {[
              { from: 'Delhi', to: 'Mumbai' },
              { from: 'Mumbai', to: 'Bangalore' },
              { from: 'Delhi', to: 'Bangalore' },
              { from: 'Mumbai', to: 'Chennai' },
              { from: 'Delhi', to: 'Hyderabad' },
              { from: 'Bangalore', to: 'Hyderabad' }
            ].map((route, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setFromCity(route.from);
                  setToCity(route.to);
                }}
                style={{
                  padding: '16px',
                  background: 'hsl(var(--b2))',
                  border: '1px solid hsl(var(--b3))',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'hsl(var(--b3))';
                  e.target.style.borderColor = 'var(--color-primary)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'hsl(var(--b2))';
                  e.target.style.borderColor = 'hsl(var(--b3))';
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 700 }}>
                  {route.from} → {route.to}
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
