import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/FlightBookingFlow.css';

export default function FlightResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const flights = location.state?.flights || [];
  const searchParams = location.state?.searchParams || { from: 'Delhi', to: 'Mumbai', date: new Date().toISOString().split('T')[0] };

  const [sortBy, setSortBy] = useState('price');
  const [filterAirline, setFilterAirline] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState(10000);
  const [filterNonstop, setFilterNonstop] = useState(false);

  const airlines = useMemo(() => {
    return [...new Set(flights.map(f => f.airline))];
  }, [flights]);

  const maxPrice = useMemo(() => {
    return flights.length > 0 ? Math.max(...flights.map(f => f.price)) : 10000;
  }, [flights]);

  const filteredFlights = useMemo(() => {
    return flights
      .filter(f => !filterAirline || f.airline === filterAirline)
      .filter(f => f.price <= filterMaxPrice)
      .filter(f => !filterNonstop || (f.stops === 0))
      .sort((a, b) => {
        if (sortBy === 'price') return a.price - b.price;
        if (sortBy === 'duration') {
          const durationA = parseInt(a.duration || '0');
          const durationB = parseInt(b.duration || '0');
          return durationA - durationB;
        }
        if (sortBy === 'departure') {
          const timeA = a.departure?.time || '00:00';
          const timeB = b.departure?.time || '00:00';
          return timeA.localeCompare(timeB);
        }
        return 0;
      });
  }, [flights, filterAirline, filterMaxPrice, filterNonstop, sortBy]);

  const handleSelectFlight = (flight) => {
    navigate('/flights/passengers', {
      state: {
        flight,
        searchParams
      }
    });
  };

  if (flights.length === 0) {
    return (
      <div className="flight-flow-wrapper">
        <div className="flight-flow-container">
          <div style={{ background: 'hsl(var(--b2))', padding: '60px 40px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✈️</div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>No Flights Found</h2>
            <p style={{ fontSize: '16px', color: 'hsl(var(--bc) / 0.6)', marginBottom: '24px' }}>
              No flights available for your search. Please try different dates or cities.
            </p>
            <button
              onClick={() => navigate('/flights')}
              style={{
                background: 'var(--color-primary)',
                color: '#ffffff',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              New Search
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flight-flow-wrapper">
      <div className="flight-flow-container">

        {/* Search Summary */}
        <div className="flight-route-banner">
          <div className="flight-rb-left">
            <h2>{searchParams.from} → {searchParams.to}</h2>
            <p>Date: {searchParams.date} · {searchParams.passengers} Passenger(s) · {searchParams.cabinClass}</p>
          </div>
          <button
            onClick={() => navigate('/flights')}
            style={{
              background: 'hsl(var(--b2))',
              border: '1px solid hsl(var(--b3))',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '13px'
            }}
          >
            ✏️ Edit Search
          </button>
        </div>

        {/* Layout: Filters on left, results on right */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>

          {/* Left: Filters Sidebar */}
          <div>
            <div className="flight-form-card" style={{ marginBottom: '16px' }}>
              <h3 className="flight-form-title" style={{ fontSize: '16px' }}>Filters</h3>

              {/* Sort By */}
              <div className="flight-input-grp" style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flight-input"
                >
                  <option value="price">Cheapest</option>
                  <option value="duration">Shortest Duration</option>
                  <option value="departure">Earliest Departure</option>
                </select>
              </div>

              {/* Airlines */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px', display: 'block' }}>Airlines</label>
                <select
                  value={filterAirline}
                  onChange={(e) => setFilterAirline(e.target.value)}
                  className="flight-input"
                >
                  <option value="">All Airlines</option>
                  {airlines.map(airline => (
                    <option key={airline} value={airline}>{airline}</option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px', display: 'block' }}>Max Price: ₹{filterMaxPrice.toLocaleString()}</label>
                <input
                  type="range"
                  min="0"
                  max={maxPrice}
                  value={filterMaxPrice}
                  onChange={(e) => setFilterMaxPrice(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Non-stop only */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filterNonstop}
                  onChange={(e) => setFilterNonstop(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Non-stop only</span>
              </label>
            </div>

            {/* Results Count */}
            <div className="flight-form-card">
              <div style={{ fontSize: '13px', color: 'hsl(var(--bc) / 0.6)' }}>
                <strong>{filteredFlights.length}</strong> of <strong>{flights.length}</strong> flights
              </div>
            </div>
          </div>

          {/* Right: Results List */}
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredFlights.map((flight, idx) => (
                <div
                  key={idx}
                  className="flight-form-card"
                  style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                  onClick={() => handleSelectFlight(flight)}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '24px', alignItems: 'center' }}>

                    {/* Flight Details */}
                    <div>
                      <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: 'hsl(var(--bc))' }}>
                            {flight.airline} {flight.flightNumber}
                          </div>
                          <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.6)' }}>
                            Aircraft: {flight.aircraft}
                          </div>
                        </div>

                        {/* Times */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: 800 }}>{flight.departure?.time}</div>
                            <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.6)' }}>{flight.departure?.city}</div>
                          </div>

                          <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.6)', marginBottom: '4px' }}>
                              {flight.stops === 0 ? 'Non-stop' : `${flight.stops} Stop${flight.stops > 1 ? 's' : ''}`}
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: 700 }}>{flight.duration}</div>
                          </div>

                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: 800 }}>{flight.arrival?.time}</div>
                            <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.6)' }}>{flight.arrival?.city}</div>
                          </div>
                        </div>
                      </div>

                      {/* Amenities */}
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: 'hsl(var(--bc) / 0.6)' }}>
                        <span>✓ {flight.baggage}kg Baggage</span>
                        {flight.stops === 0 && <span>✓ Non-stop</span>}
                        <span>✓ {flight.seatsAvailable} seats available</span>
                      </div>
                    </div>

                    {/* Price and CTA */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.6)', marginBottom: '8px' }}>From</div>
                      <div style={{ fontSize: '28px', fontWeight: 900, color: 'hsl(var(--er))', marginBottom: '12px' }}>
                        ₹{flight.price.toLocaleString()}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectFlight(flight);
                        }}
                        style={{
                          background: 'var(--color-primary)',
                          color: '#ffffff',
                          border: 'none',
                          padding: '12px 24px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontSize: '14px',
                          minWidth: '140px'
                        }}
                      >
                        Select
                      </button>
                    </div>

                  </div>
                </div>
              ))}

              {filteredFlights.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'hsl(var(--bc) / 0.6)' }}>
                  <p>No flights match your filters. Try adjusting your criteria.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
