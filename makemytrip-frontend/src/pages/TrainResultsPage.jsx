import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { trainService } from '../services/trainService';
import CustomCalendarPicker from '../components/CustomCalendarPicker';
import { CITIES } from '../data/cities';
import '../styles/TrainResults.css';

const fmtDuration = (m) => {
  if (!m) return 'N/A';
  if (typeof m === 'string') return m;
  const hours = Math.floor(m / 60);
  const mins = m % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
};

const fmtDateDisplay = (dateStr) => {
  if (!dateStr) return { formatted: 'Select Date', weekday: 'Tap to pick' }
  const [year, month, day] = dateStr.split('-')
  if (!year || !month || !day) return { formatted: 'Invalid Date', weekday: '' }
  const d = new Date(Number(year), Number(month) - 1, Number(day))
  if (isNaN(d.getTime())) return { formatted: 'Invalid Date', weekday: '' }
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const formatted = `${d.getDate()} ${months[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`
  const weekday = d.toLocaleDateString('en-IN', { weekday: 'long' })
  return { formatted, weekday }
}

const fmtDate = (s) => {
  if (!s) return ''
  const [year, month, day] = s.split('-')
  const d = new Date(Number(year), Number(month) - 1, Number(day))
  return d.toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'2-digit'})
}

const getTrainClasses = (train) => {
  const basePrice = train.price;
  const type = train.type || 'AC';
  if (type === 'AC' || type === 'Luxury') {
    return [
      { code: "3A", name: "AC 3 Tier", price: Math.round(basePrice), status: `AVL ${train.seatsAvailable || 45}`, statusType: "green" },
      { code: "2A", name: "AC 2 Tier", price: Math.round(basePrice * 1.3), status: `AVL ${Math.round(train.seatsAvailable * 0.4) || 18}`, statusType: "green" },
      { code: "1A", name: "AC First Class", price: Math.round(basePrice * 1.9), status: `AVL ${Math.round(train.seatsAvailable * 0.1) || 5}`, statusType: "green" }
    ];
  } else if (type === 'Sleeper') {
    return [
      { code: "SL", name: "Sleeper Class", price: Math.round(basePrice), status: `AVL ${train.seatsAvailable || 120}`, statusType: "green" },
      { code: "3A", name: "AC 3 Tier", price: Math.round(basePrice * 2.5), status: `AVL ${Math.round(train.seatsAvailable * 0.2) || 24}`, statusType: "green" }
    ];
  } else {
    return [
      { code: "2S", name: "Second Seating", price: Math.round(basePrice), status: `AVL ${train.seatsAvailable || 150}`, statusType: "green" },
      { code: "CC", name: "AC Chair Car", price: Math.round(basePrice * 1.8), status: `AVL ${Math.round(train.seatsAvailable * 0.3) || 40}`, statusType: "green" }
    ];
  }
};

const getCityOnly = (fullString = '') => {
  const match = fullString.match(/^([^(]+)/);
  return match ? match[1].trim() : fullString;
};

export default function TrainResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [fromVal, setFromVal] = useState(location.state?.fromCity || "New Delhi (NDLS)");
  const [toVal, setToVal] = useState(location.state?.toCity || "Mumbai Central (BCT)");
  const [dateVal, setDateVal] = useState(() => {
    if (location.state?.travelDate) return location.state.travelDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().split('T')[0];
  });
  const [passengers, setPassengers] = useState(1);
  const [quota, setQuota] = useState(location.state?.quota || "General");

  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [showCal, setShowCal] = useState(false);
  const [showTravDrop, setShowTravDrop] = useState(false);
  
  const fromRef = useRef(null);
  const toRef = useRef(null);
  const calRef = useRef(null);
  const travRef = useRef(null);

  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Selections
  const [selectedTrainId, setSelectedTrainId] = useState(null);
  const [selectedClassCode, setSelectedClassCode] = useState(null);

  // Filters & Sorting
  const [sortBy, setSortBy] = useState('cheapest');
  const [filterClasses, setFilterClasses] = useState([]);
  const [filterTypes, setFilterTypes] = useState([]);

  useEffect(() => {
    function onOutside(e) {
      if (fromRef.current && !fromRef.current.contains(e.target)) setFromOpen(false);
      if (toRef.current && !toRef.current.contains(e.target)) setToOpen(false);
      if (calRef.current && !calRef.current.contains(e.target)) setShowCal(false);
      if (travRef.current && !travRef.current.contains(e.target)) setShowTravDrop(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const fromSugg = useMemo(() => {
    if (!fromVal.trim()) return CITIES.slice(0, 6);
    const q = fromVal.toLowerCase();
    return CITIES.filter(c => c.city.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)).slice(0, 6);
  }, [fromVal]);

  const toSugg = useMemo(() => {
    if (!toVal.trim()) return CITIES.slice(0, 6);
    const q = toVal.toLowerCase();
    return CITIES.filter(c => c.city.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)).slice(0, 6);
  }, [toVal]);

  function swapCities() {
    const tmp = fromVal; setFromVal(toVal); setToVal(tmp);
  }

  const fetchTrains = async (f, t, d) => {
    try {
      setLoading(true);
      setError('');
      const fromQuery = getCityOnly(f);
      const toQuery = getCityOnly(t);

      const response = await trainService.search({ from: fromQuery, to: toQuery, date: d });
      const apiTrains = response.data || [];

      const mapped = apiTrains.map(tr => {
        const depCity = tr.departure?.city || fromQuery;
        const depTime = tr.departureTime || tr.departure?.time || '09:00';
        const arrCity = tr.arrival?.city || toQuery;
        const arrTime = tr.arrivalTime || tr.arrival?.time || '18:00';
        return {
          id: tr.id,
          name: tr.trainName || tr.operatorName || tr.name || 'Express Train',
          type: tr.type || 'Express',
          number: `${tr.trainNumber || '12001'} · ${tr.type || 'Express'}`,
          depTime,
          depStation: depCity,
          arrTime,
          arrStation: arrCity,
          duration: fmtDuration(tr.durationMinutes || 400),
          durationMins: tr.durationMinutes || 400,
          classes: getTrainClasses(tr)
        };
      });

      setTrains(mapped);
      if (mapped.length > 0) {
        setSelectedTrainId(mapped[0].id);
        setSelectedClassCode(mapped[0].classes[0].code);
      }
    } catch (err) {
      console.error('Error fetching trains:', err);
      setError(err.message || 'Failed to search trains');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrains(fromVal, toVal, dateVal);
  }, []); // Initial load

  function handleNewSearch() {
    fetchTrains(fromVal, toVal, dateVal);
  }

  const toggleClass = (c) => setFilterClasses(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);
  const toggleType = (t) => setFilterTypes(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);
  const clearFilters = () => { setFilterClasses([]); setFilterTypes([]); };

  const allClasses = useMemo(() => [...new Set(trains.flatMap(t => t.classes.map(c => c.code)))], [trains]);
  const allTypes = useMemo(() => [...new Set(trains.map(t => t.type))], [trains]);

  const filteredSorted = useMemo(() => {
    let r = [...trains];
    if (filterClasses.length > 0) {
      r = r.filter(t => t.classes.some(c => filterClasses.includes(c.code)));
    }
    if (filterTypes.length > 0) {
      r = r.filter(t => filterTypes.includes(t.type));
    }
    switch (sortBy) {
      case 'cheapest': 
        r.sort((a,b) => Math.min(...a.classes.map(c=>c.price)) - Math.min(...b.classes.map(c=>c.price))); 
        break;
      case 'fastest':  
        r.sort((a,b) => a.durationMins - b.durationMins); 
        break;
      case 'earliest': 
        r.sort((a,b) => a.depTime.localeCompare(b.depTime)); 
        break;
      case 'latest':   
        r.sort((a,b) => b.depTime.localeCompare(a.depTime)); 
        break;
    }
    return r;
  }, [trains, filterClasses, filterTypes, sortBy]);

  const sortMeta = useMemo(() => {
    if (!trains.length) return {};
    const cheapest = Math.min(...trains.flatMap(t => t.classes.map(c => c.price)));
    const fastest = trains.reduce((a,b) => a.durationMins < b.durationMins ? a : b);
    const earliest = trains.reduce((a,b) => a.depTime < b.depTime ? a : b);
    const latest = trains.reduce((a,b) => a.depTime > b.depTime ? a : b);
    return {
      cheapest: `₹${cheapest.toLocaleString('en-IN')}`,
      fastest: fastest.duration,
      earliest: earliest.depTime,
      latest: latest.depTime
    }
  }, [trains]);

  const handleProceedBook = (train) => {
    const chosenCls = train.classes.find(c => c.code === selectedClassCode) || train.classes[0];
    navigate('/trains/passengers', {
      state: {
        train,
        selectedClass: chosenCls,
        searchParams: {
          fromCity: fromVal,
          toCity: toVal,
          travelDate: dateVal,
          quota,
          passengers
        }
      }
    });
  };

  const hasFilters = filterClasses.length > 0 || filterTypes.length > 0;

  return (
    <div className="tr-page">
      {/* ── Route Heading ── */}
      <div className="tr-route-section">
        <div className="tr-route-inner">
          <h1 className="tr-route-title">Trains from {getCityOnly(fromVal)} to {getCityOnly(toVal)}</h1>
          <p className="tr-route-meta">
            {passengers} Passenger(s) · {quota} Quota · {fmtDate(dateVal)}
          </p>
        </div>
      </div>

      {/* ── Compact Search Bar ── */}
      <div className="tr-search-bar-wrapper">
        <div className="tr-search-inner">
          <div className="tr-search-field" ref={fromRef}>
            <span className="tr-search-label">From Station</span>
            <input
              className="tr-field-input"
              value={fromVal}
              onChange={e => { setFromVal(e.target.value); setFromOpen(true); }}
              onFocus={() => setFromOpen(true)}
              placeholder="Leaving from"
            />
            <span className="tr-search-sub">{getCityOnly(fromVal)}</span>
            {fromOpen && fromSugg.length > 0 && (
              <div className="tr-city-dropdown">
                {fromSugg.map(c => (
                  <div key={c.code} className="tr-city-option" onMouseDown={() => { setFromVal(c.city); setFromOpen(false); }}>
                    <span className="tr-city-name">{c.city}</span>
                    <span className="tr-city-badge">{c.code}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="tr-swap-btn" onClick={swapCities}>⇄</button>

          <div className="tr-search-field" ref={toRef}>
            <span className="tr-search-label">To Station</span>
            <input
              className="tr-field-input"
              value={toVal}
              onChange={e => { setToVal(e.target.value); setToOpen(true); }}
              onFocus={() => setToOpen(true)}
              placeholder="Going to"
            />
            <span className="tr-search-sub">{getCityOnly(toVal)}</span>
            {toOpen && toSugg.length > 0 && (
              <div className="tr-city-dropdown">
                {toSugg.map(c => (
                  <div key={c.code} className="tr-city-option" onMouseDown={() => { setToVal(c.city); setToOpen(false); }}>
                    <span className="tr-city-name">{c.city}</span>
                    <span className="tr-city-badge">{c.code}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="tr-search-field" ref={calRef} onClick={() => setShowCal(p => !p)}>
            <span className="tr-search-label">Travel Date</span>
            <span className="tr-search-value">{fmtDateDisplay(dateVal).formatted}</span>
            <span className="tr-search-sub">{fmtDateDisplay(dateVal).weekday}</span>
            <CustomCalendarPicker
              isOpen={showCal}
              value={dateVal}
              onChange={v => { setDateVal(v); setShowCal(false); }}
              onClose={() => setShowCal(false)}
              labelText="Departure"
            />
          </div>

          <div className="tr-search-field" ref={travRef} onClick={() => setShowTravDrop(p => !p)}>
            <span className="tr-search-label">Class & Quota</span>
            <span className="tr-search-value">{quota}</span>
            <span className="tr-search-sub">{passengers} Passenger(s)</span>
            {showTravDrop && (
              <div className="tr-trip-dropdown" style={{ minWidth: 200 }} onMouseDown={e => e.stopPropagation()}>
                <div style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, color: '#666', textTransform: 'uppercase' }}>Passengers</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px 12px' }}>
                  <button className="tr-swap-btn" style={{border: '1px solid #ccc', borderRadius: '4px'}} onClick={e => { e.stopPropagation(); setPassengers(p => Math.max(1, p - 1)) }}>−</button>
                  <span style={{ fontWeight: 700 }}>{passengers}</span>
                  <button className="tr-swap-btn" style={{border: '1px solid #ccc', borderRadius: '4px'}} onClick={e => { e.stopPropagation(); setPassengers(p => Math.min(6, p + 1)) }}>+</button>
                </div>
                <div style={{ borderTop: '1px solid hsl(var(--b2))', padding: '8px 16px', fontSize: 12, fontWeight: 700, color: '#666', textTransform: 'uppercase' }}>Quota</div>
                {['General', 'Tatkal', 'Ladies'].map(q => (
                  <div key={q} className={`tr-trip-option ${quota === q ? 'tr-trip-option-active' : ''}`} onMouseDown={() => { setQuota(q); setShowTravDrop(false); }}>{q}</div>
                ))}
              </div>
            )}
          </div>

          <button className="tr-search-btn" onClick={handleNewSearch}>SEARCH</button>
        </div>
      </div>

      {error && (
        <div style={{ maxWidth: 1240, margin: '16px auto', background: 'hsl(var(--er) / 0.08)', color: 'hsl(var(--er))', padding: '16px', borderRadius: '12px', fontWeight: 700 }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : (
        <div className="tr-layout">
          {/* ── Sidebar Filters ── */}
          <aside className="tr-sidebar">
            {hasFilters && (
              <div className="tr-filter-section">
                <div className="tr-filter-title">
                  Applied Filters
                  <button className="tr-clear-all" onClick={clearFilters}>CLEAR ALL</button>
                </div>
                <div className="tr-applied-chips">
                  {filterClasses.map(c => (
                    <span key={c} className="tr-chip" onClick={() => toggleClass(c)}>{c} <span>×</span></span>
                  ))}
                  {filterTypes.map(t => (
                    <span key={t} className="tr-chip" onClick={() => toggleType(t)}>{t} <span>×</span></span>
                  ))}
                </div>
              </div>
            )}

            <div className="tr-filter-section">
              <div className="tr-filter-title">Class</div>
              <div className="tr-filter-body">
                {allClasses.map(c => (
                  <label key={c} className="tr-checkbox-item">
                    <input type="checkbox" checked={filterClasses.includes(c)} onChange={() => toggleClass(c)} />
                    <span className="tr-checkbox-label">{c}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="tr-filter-section">
              <div className="tr-filter-title">Train Type</div>
              <div className="tr-filter-body">
                {allTypes.map(t => (
                  <label key={t} className="tr-checkbox-item">
                    <input type="checkbox" checked={filterTypes.includes(t)} onChange={() => toggleType(t)} />
                    <span className="tr-checkbox-label">{t}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* ── Main Content ── */}
          <main className="tr-main">
            <div className="tr-results-header">
              <span className="tr-results-count">Showing <strong>{filteredSorted.length}</strong> of {trains.length} trains</span>
            </div>

            <div className="tr-sort-bar">
              {[{key:'cheapest',label:'Cheapest'}, {key:'fastest',label:'Fastest'}, {key:'earliest',label:'Earliest'}, {key:'latest',label:'Latest'}].map(({key,label}) => (
                <button key={key} className={`tr-sort-tab ${sortBy === key ? 'active' : ''}`} onClick={() => setSortBy(key)}>
                  <span>{label}</span>
                  {sortMeta[key] && <span className="tr-sort-value">{sortMeta[key]}</span>}
                </button>
              ))}
            </div>

            <div className="tr-trains-list">
              {filteredSorted.length === 0 ? (
                <div className="tr-no-trains">
                  No trains match your filters.
                  <br/>
                  <button onClick={clearFilters}>Clear Filters</button>
                </div>
              ) : (
                filteredSorted.map(train => {
                  const isSelectedTrain = selectedTrainId === train.id;
                  const chosenCls = train.classes.find(c => c.code === selectedClassCode) || train.classes[0];

                  return (
                    <div key={train.id} className="tc-card">
                      <div className="tc-main-row">
                        <div className="tc-train-col">
                          <div className="tc-icon-box">🚂</div>
                          <div>
                            <div className="tc-train-name">{train.name}</div>
                            <div className="tc-train-num">{train.number}</div>
                          </div>
                        </div>

                        <div className="tc-times-col">
                          <div className="tc-time-block">
                            <span className="tc-time">{train.depTime}</span>
                            <span className="tc-station-code">{train.depStation}</span>
                          </div>
                          <div className="tc-route-info">
                            <span className="tc-duration">{train.duration}</span>
                            <div className="tc-line-wrap">
                              <div className="tc-dot" />
                              <div className="tc-line" />
                              <div className="tc-dot" />
                            </div>
                            <span style={{fontSize: '11px', color: 'var(--text-secondary)'}}>Direct</span>
                          </div>
                          <div className="tc-time-block">
                            <span className="tc-time">{train.arrTime}</span>
                            <span className="tc-station-code">{train.arrStation}</span>
                          </div>
                        </div>
                      </div>

                      <div className="tc-classes-row">
                        {train.classes.map(cls => (
                          <div 
                            key={cls.code} 
                            className={`tc-class-box ${isSelectedTrain && selectedClassCode === cls.code ? 'selected' : ''}`}
                            onClick={() => { setSelectedTrainId(train.id); setSelectedClassCode(cls.code); }}
                          >
                            <div className="tc-class-hdr">
                              <span>{cls.code}</span>
                              <span className="tc-class-price">₹{cls.price}</span>
                            </div>
                            <div className={`tc-class-status ${cls.status.includes('AVL') ? 'tc-status-green' : 'tc-status-orange'}`}>
                              {cls.status}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="tc-action-row">
                        {isSelectedTrain ? (
                          <>
                            <div className="tc-action-info">
                              Selected: <strong>{chosenCls.name} ({chosenCls.code})</strong>
                            </div>
                            <button className="tc-book-btn" onClick={() => handleProceedBook(train)}>
                              BOOK NOW
                            </button>
                          </>
                        ) : (
                          <button className="tc-book-btn" onClick={() => { setSelectedTrainId(train.id); setSelectedClassCode(train.classes[0].code); }}>
                            SELECT & BOOK
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
