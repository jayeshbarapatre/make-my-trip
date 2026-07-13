import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/FlightBookingFlow.css';

export default function FlightResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [queryParams] = useSearchParams();

  const [flights, setFlights] = useState(location.state?.flights || []);
  const [loading, setLoading] = useState(!location.state?.flights);
  const [error, setError] = useState('');

  const searchParams = location.state?.searchParams || {
    from: queryParams.get('from') || 'Delhi',
    to: queryParams.get('to') || 'Mumbai',
    date: queryParams.get('date') || new Date().toISOString().split('T')[0],
    passengers: queryParams.get('passengers') || 1,
    cabinClass: queryParams.get('class') || 'Economy'
  };

  const [sortBy, setSortBy] = useState('price');
  const [filterAirline, setFilterAirline] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState(10000);
  const [filterNonstop, setFilterNonstop] = useState(false);
  const [selectedAdults, setSelectedAdults] = useState(parseInt(searchParams.passengers) || 1);
  const [selectedChildren, setSelectedChildren] = useState(0);
  const [selectedInfants, setSelectedInfants] = useState(0);

  // Fetch flights from API if not passed via location.state
  useEffect(() => {
    if (location.state?.flights) {
      setLoading(false);
      return;
    }

    const fetchFlights = async () => {
      try {
        setError('');
        const response = await axios.get('http://localhost:5000/api/v1/flights', {
          params: {
            from: searchParams.from,
            to: searchParams.to,
            date: searchParams.date,
            passengers: searchParams.passengers
          }
        });

        if (response.data.data && response.data.data.length > 0) {
          setFlights(response.data.data);
        } else {
          setFlights([]);
        }
      } catch (err) {
        console.error('Failed to fetch flights:', err);
        setError('Unable to load flights. Please try again.');
        setFlights([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, [location.state?.flights, searchParams.from, searchParams.to, searchParams.date, searchParams.passengers]);

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

  // Calculate total price based on selected travelers
  const calculateTotalPrice = (basPrice) => {
    const adults = selectedAdults || 1;
    const children = selectedChildren || 0;
    const infants = selectedInfants || 0;
    // Price for adults and children (full price), infants at 40% of base price
    const baseTotal = (basPrice * (adults + children)) + (basPrice * 0.4 * infants);
    const taxes = Math.round(baseTotal * 0.18); // 18% GST
    const fees = 350; // Convenience fee
    return baseTotal + taxes + fees;
  };

  const handleSelectFlight = (flight) => {
    navigate('/flights/passengers', {
      state: {
        flight,
        searchParams,
        totalAmount: calculateTotalPrice(flight.price),
        baseFare: flight.price * (selectedAdults + selectedChildren) + (flight.price * 0.4 * selectedInfants),
        selectedAdults,
        selectedChildren,
        selectedInfants
      }
    });
  };

  if (loading) {
    return (
      <div className="flight-flow-wrapper">
        <div className="flight-flow-container">
          <div style={{ background: 'hsl(var(--b2))', padding: '60px 40px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>Loading flights...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flight-flow-wrapper">
        <div className="flight-flow-container">
          <div style={{ background: 'hsl(var(--b2))', padding: '60px 40px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Error Loading Flights</h2>
            <p style={{ fontSize: '16px', color: 'hsl(var(--bc) / 0.6)', marginBottom: '24px' }}>
              {error}
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
              Try New Search
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (flights.length === 0) {
    return (
      <div className="flight-flow-wrapper">
        <div className="flight-flow-container">
          <div style={{ background: 'hsl(var(--b2))', padding: '60px 40px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✈️</div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>No Flights Found</h2>
            <p style={{ fontSize: '16px', color: 'hsl(var(--bc) / 0.6)', marginBottom: '24px' }}>
              No flights available for {searchParams.from} → {searchParams.to} on {searchParams.date}. Try different dates or cities.
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
              <h3 className="flight-form-title" style={{ fontSize: '16px' }}>Travellers & Class</h3>

              {/* Adults */}
              <div className="flight-input-grp" style={{ marginBottom: '16px', background: 'hsl(var(--b2))', padding: '12px', borderRadius: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px', display: 'block' }}>👤 Adults</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
                  <button onClick={() => setSelectedAdults(Math.max(1, selectedAdults - 1))} style={{ padding: '6px 12px', cursor: 'pointer', fontWeight: 700, background: 'hsl(var(--p))', color: 'white', border: 'none', borderRadius: '4px', fontSize: '14px', transition: 'all 0.2s', opacity: selectedAdults === 1 ? 0.5 : 1 }} onMouseEnter={(e) => e.target.style.background = 'hsl(var(--p) / 0.8)'} onMouseLeave={(e) => e.target.style.background = 'hsl(var(--p))'}>−</button>
                  <span style={{ minWidth: '40px', textAlign: 'center', fontWeight: 900, fontSize: '18px', color: 'hsl(var(--p))' }}>{selectedAdults}</span>
                  <button onClick={() => setSelectedAdults(selectedAdults + 1)} style={{ padding: '6px 12px', cursor: 'pointer', fontWeight: 700, background: 'hsl(var(--p))', color: 'white', border: 'none', borderRadius: '4px', fontSize: '14px', transition: 'all 0.2s' }} onMouseEnter={(e) => e.target.style.background = 'hsl(var(--p) / 0.8)'} onMouseLeave={(e) => e.target.style.background = 'hsl(var(--p))'}>+</button>
                </div>
              </div>

              {/* Children */}
              <div className="flight-input-grp" style={{ marginBottom: '16px', background: 'hsl(var(--b2))', padding: '12px', borderRadius: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px', display: 'block' }}>👧 Children (2-11 yrs)</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
                  <button onClick={() => setSelectedChildren(Math.max(0, selectedChildren - 1))} style={{ padding: '6px 12px', cursor: 'pointer', fontWeight: 700, background: 'hsl(var(--s))', color: 'white', border: 'none', borderRadius: '4px', fontSize: '14px', transition: 'all 0.2s', opacity: selectedChildren === 0 ? 0.5 : 1 }} onMouseEnter={(e) => e.target.style.background = 'hsl(var(--s) / 0.8)'} onMouseLeave={(e) => e.target.style.background = 'hsl(var(--s))'}>−</button>
                  <span style={{ minWidth: '40px', textAlign: 'center', fontWeight: 900, fontSize: '18px', color: 'hsl(var(--s))' }}>{selectedChildren}</span>
                  <button onClick={() => setSelectedChildren(selectedChildren + 1)} style={{ padding: '6px 12px', cursor: 'pointer', fontWeight: 700, background: 'hsl(var(--s))', color: 'white', border: 'none', borderRadius: '4px', fontSize: '14px', transition: 'all 0.2s' }} onMouseEnter={(e) => e.target.style.background = 'hsl(var(--s) / 0.8)'} onMouseLeave={(e) => e.target.style.background = 'hsl(var(--s))'}>+</button>
                </div>
              </div>

              {/* Infants */}
              <div className="flight-input-grp" style={{ marginBottom: '16px', background: 'hsl(var(--b2))', padding: '12px', borderRadius: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px', display: 'block' }}>👶 Infants (0-2 yrs)</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
                  <button onClick={() => setSelectedInfants(Math.max(0, selectedInfants - 1))} style={{ padding: '6px 12px', cursor: 'pointer', fontWeight: 700, background: 'hsl(var(--a))', color: 'white', border: 'none', borderRadius: '4px', fontSize: '14px', transition: 'all 0.2s', opacity: selectedInfants === 0 ? 0.5 : 1 }} onMouseEnter={(e) => e.target.style.background = 'hsl(var(--a) / 0.8)'} onMouseLeave={(e) => e.target.style.background = 'hsl(var(--a))'}>−</button>
                  <span style={{ minWidth: '40px', textAlign: 'center', fontWeight: 900, fontSize: '18px', color: 'hsl(var(--a))' }}>{selectedInfants}</span>
                  <button onClick={() => setSelectedInfants(selectedInfants + 1)} style={{ padding: '6px 12px', cursor: 'pointer', fontWeight: 700, background: 'hsl(var(--a))', color: 'white', border: 'none', borderRadius: '4px', fontSize: '14px', transition: 'all 0.2s' }} onMouseEnter={(e) => e.target.style.background = 'hsl(var(--a) / 0.8)'} onMouseLeave={(e) => e.target.style.background = 'hsl(var(--a))'}>+</button>
                </div>
              </div>
            </div>

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
                      <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.6)', marginBottom: '4px' }}>Total for {selectedAdults + selectedChildren + selectedInfants} Traveller(s)</div>
                      <div style={{ fontSize: '14px', color: 'hsl(var(--bc) / 0.6)', marginBottom: '8px' }}>₹{flight.price.toLocaleString()} per person</div>
                      <div style={{ fontSize: '28px', fontWeight: 900, color: 'hsl(var(--er))', marginBottom: '12px' }}>
                        ₹{calculateTotalPrice(flight.price).toLocaleString()}
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
