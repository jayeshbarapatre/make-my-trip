import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Photo from '../components/Common/Photo';
import { photo } from '../utils/images';
import { todayLocal } from '../utils/date';

const CABIN_GALLERY = [
  { name: 'flight-cabin', caption: 'Modern cabins', copy: 'Wide seats and generous legroom across every partner airline.' },
  { name: 'flight-boarding-gate', caption: 'Priority boarding', copy: 'Skip the queue at the gate with select fares.' },
  { name: 'flight-terminal', caption: 'Seamless terminals', copy: 'Web check-in and lounge access at 60+ airports.' },
  { name: 'flight-runway', caption: 'On-time departures', copy: 'Live status tracking from gate to runway.' },
  { name: 'flight-passenger', caption: 'Travel your way', copy: 'Meals, baggage and seats — picked before you fly.' },
];

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

  // Takes the search explicitly rather than reading state, so a popular-route
  // button can run one immediately instead of waiting a render for setState.
  const runSearch = async ({ from, to, date }) => {
    setError('');

    if (!from || !to || !date) {
      setError('Please fill in all required fields');
      return;
    }

    if (tripType === 'roundtrip' && !returnDate) {
      setError('Please select return date for round-trip');
      return;
    }

    setLoading(true);

    try {
      // The response interceptor in services/api.js already returns res.data,
      // so this is the body: { data: [...], pagination: {...} }. Reading
      // `.data.data` off it was always undefined, which made the check below
      // always false — every search on this page reported "No flights found",
      // however much inventory the route had.
      const body = await api.get(
        '/flights',
        { params: { from, to, date, passengers } }
      );

      const flights = Array.isArray(body?.data) ? body.data : [];

      if (flights.length > 0) {
        // The results page reads the search from the query string, exactly as
        // the home page and header search do. This used to hand it the flights
        // and the criteria in router state, which that page never reads — so a
        // search for Mumbai → Goa arrived showing the page's fallback route
        // instead, and the results fetched here were thrown away.
        // Built from the arguments, not from state — a popular-route search runs
        // in the same tick as its setState calls, so state is still the old
        // route here.
        const query = new URLSearchParams({
          from,
          to,
          date,
          passengers: String(passengers),
          class: cabinClass,
          type: tripType
        });
        if (tripType === 'roundtrip' && returnDate) query.set('returnDate', returnDate);

        navigate(`/flights/results?${query.toString()}`);
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

  const handleSearch = (e) => {
    e.preventDefault();
    runSearch({ from: fromCity, to: toCity, date: departDate });
  };

  // Clicking a popular route used to fill the two fields and stop there, which
  // reads as a dead button — the visitor has already told us where they want to
  // go. It now fills the form and searches, defaulting the date to today when
  // one has not been picked yet.
  const handlePopularRoute = (route) => {
    const date = departDate || todayLocal();
    setFromCity(route.from);
    setToCity(route.to);
    setDepartDate(date);
    runSearch({ from: route.from, to: route.to, date });
  };

  return (
    <div style={{ background: 'hsl(var(--b1))', minHeight: '100vh' }}>

      {/* Hero banner — real photograph of an aircraft on approach */}
      <div style={{
        position: 'relative',
        minHeight: '420px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '96px 20px 120px',
        backgroundImage: `linear-gradient(180deg, rgba(6, 14, 32, 0.58) 0%, rgba(6, 14, 32, 0.45) 55%, hsl(var(--b1)) 100%), url(${photo('phero-flights', 1920)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 22%',
        textAlign: 'center',
        boxSizing: 'border-box',
      }}>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, margin: '0 0 10px', color: '#fff', letterSpacing: '-0.02em' }}>
          Book Flights Online
        </h1>
        <p style={{ fontSize: 'clamp(14px, 2vw, 18px)', color: 'rgba(255,255,255,0.88)', margin: 0 }}>
          Search, compare, and book flights to your favourite destinations
        </p>
      </div>

      <div style={{ maxWidth: '900px', margin: '-64px auto 0', padding: '0 20px 40px', position: 'relative' }}>

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
              background: loading ? 'hsl(var(--b3))' : 'hsl(var(--p))',
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
              // Every route here must return flights, or the button advertises a
              // search that answers "no flights found". Mumbai → Chennai was
              // listed and has no inventory on any date; Delhi → Goa does.
              { from: 'Delhi', to: 'Mumbai' },
              { from: 'Mumbai', to: 'Bangalore' },
              { from: 'Delhi', to: 'Bangalore' },
              { from: 'Delhi', to: 'Goa' },
              { from: 'Delhi', to: 'Hyderabad' },
              { from: 'Bangalore', to: 'Hyderabad' }
            ].map((route, idx) => (
              <button
                key={idx}
                onClick={() => handlePopularRoute(route)}
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
                  e.target.style.borderColor = 'hsl(var(--p))';
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

        {/* Flying with us — real photography of cabins, gates, terminals and runways */}
        <div style={{ marginTop: '64px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px', textAlign: 'center' }}>
            Flying With Us
          </h2>
          <p style={{ fontSize: '15px', color: 'hsl(var(--bc) / 0.6)', textAlign: 'center', marginBottom: '28px' }}>
            From the boarding gate to the runway, every step of the journey covered
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {CABIN_GALLERY.map((item) => (
              <figure key={item.name} style={{
                margin: 0,
                borderRadius: '14px',
                overflow: 'hidden',
                background: 'hsl(var(--b2))',
                border: '1px solid hsl(var(--b3))',
                boxShadow: '0 6px 20px rgba(10, 17, 40, 0.06)',
              }}>
                <Photo
                  name={item.name}
                  sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 300px"
                  style={{ width: '100%', height: '170px', objectFit: 'cover', display: 'block' }}
                />
                <figcaption style={{ padding: '14px 16px 18px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, marginBottom: '4px' }}>{item.caption}</div>
                  <div style={{ fontSize: '13px', color: 'hsl(var(--bc) / 0.65)', lineHeight: 1.5 }}>{item.copy}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
