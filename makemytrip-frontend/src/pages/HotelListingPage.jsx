import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { UDAIPUR_HOTELS, HOTEL_PINS } from '../data/udaipurHotelsData'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'
import CustomCalendarPicker from '../components/CustomCalendarPicker'
import { searchHotels } from '../services/hotelService'
import '../styles/UdaipurListing.css'

/* ─────────── SVGs & Icons ─────────── */
const I = {
  heart: (filled, c) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? (c || "#eb2226") : "none"} stroke={filled ? (c || "#eb2226") : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0db981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  chevronL: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  chevronR: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  chevronD: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  photo: <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.9 13.98l2.1 2.53 3.1-3.99L18.5 18H5.5l3.4-4.02z"/></svg>,
  play: <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  pin: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  star: <svg width="11" height="11" viewBox="0 0 24 24" fill="#fbb52c"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  starHostBadge: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#eb2226"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  ),
  bulb: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5c33b3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.9.7 1.5 1.7 1.5 2.8V18h5v-.5c0-1.1.6-2.1 1.5-2.8A7 7 0 0 0 12 2z"/></svg>,
  airport: <svg width="14" height="14" viewBox="0 0 24 24" fill="#0084ff"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>,
};

/* ─────────── SearchBar Component ─────────── */
function SearchBar({ onSearch, city, checkIn, checkOut, guests }) {
  const g = guests ? JSON.parse(guests) : { adults: 2, rooms: 1 };
  const [inDate, setInDate] = useState(checkIn || '');
  const [outDate, setOutDate] = useState(checkOut || '');

  useEffect(() => {
    setInDate(checkIn || '');
    setOutDate(checkOut || '');
  }, [checkIn, checkOut]);
  const [showInCal, setShowInCal] = useState(false);
  const [showOutCal, setShowOutCal] = useState(false);

  const getGuestDisplay = () => {
    let display = `${g.adults} Adults`;
    if (g.children && g.children > 0) {
      display += ` · ${g.children} ${g.children === 1 ? 'Child' : 'Children'}`;
    }
    display += ` · ${g.rooms} Room${g.rooms !== 1 ? 's' : ''}`;
    return display;
  };

  const fmtD = (s) => {
    if (!s) return 'Select Date';
    const d = new Date(s + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <div className="searchbar">
      <div className="sb-field flex2">
        <div className="sb-lbl">CITY, AREA OR PROPERTY</div>
        <div className="sb-val">{city || "Udaipur"}</div>
      </div>
      <div className="sb-field" style={{ position: 'relative', cursor: 'pointer' }}
        onClick={() => { setShowInCal(p => !p); setShowOutCal(false) }}>
        <div className="sb-lbl">CHECK-IN</div>
        <div className="sb-val">{fmtD(inDate)}</div>
        <CustomCalendarPicker
          isOpen={showInCal}
          value={inDate}
          onChange={v => { setInDate(v); setShowInCal(false) }}
          onClose={() => setShowInCal(false)}
          labelText="Check-in"
        />
      </div>
      <div className="sb-field" style={{ position: 'relative', cursor: 'pointer' }}
        onClick={() => { setShowOutCal(p => !p); setShowInCal(false) }}>
        <div className="sb-lbl">CHECK-OUT</div>
        <div className="sb-val">{fmtD(outDate)}</div>
        <CustomCalendarPicker
          isOpen={showOutCal}
          value={outDate}
          onChange={v => { setOutDate(v); setShowOutCal(false) }}
          onClose={() => setShowOutCal(false)}
          labelText="Check-out"
        />
      </div>
      <div className="sb-field">
        <div className="sb-lbl">GUESTS</div>
        <div className="sb-val">{getGuestDisplay()}</div>
      </div>
      <button className="sb-search" onClick={() => onSearch && onSearch(city, inDate, outDate)}>SEARCH</button>
    </div>
  );
}

/* ─────────── Sidebar Components ─────────── */
function Checkbox({ label, count, checked, onChange, icon }) {
  return (
    <label className={"fc-row" + (checked ? " on" : "")} onClick={(e) => { e.preventDefault(); onChange(); }}>
      <span className={"fc-box" + (checked ? " on" : "")}>
        {checked && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
      </span>
      <span className="fc-lbl">{icon}{label}</span>
      {count != null && <span className="fc-count">({count})</span>}
    </label>
  );
}

function Radio({ label, sub, checked, onChange, badge }) {
  return (
    <label className="fc-row" onClick={(e) => { e.preventDefault(); onChange(); }}>
      <span className={"fc-radio" + (checked ? " on" : "")}>
        {checked && <span className="fc-dot"/>}
      </span>
      <span className="fc-lbl">
        {label}
        {badge && <span className="fc-badge">{badge}</span>}
        {sub && <div className="fc-sub">{sub}</div>}
      </span>
    </label>
  );
}

function FilterSection({ title, children }) {
  return (
    <div className="filt-sect">
      <div className="filt-h">{title}</div>
      {children}
    </div>
  );
}

function MapPreview({ onOpen, pins }) {
  return (
    <div className="map-preview" onClick={onOpen}>
      <svg viewBox="0 0 200 130" className="map-svg" preserveAspectRatio="none">
        {/* Lake Pichola - irregular shape */}
        <path d="M 30 50 Q 25 70 45 85 Q 70 95 85 80 Q 95 65 80 50 Q 60 40 45 45 Z" fill="#cfe4f0" stroke="#a3c7da" strokeWidth="0.4"/>
        <path d="M 120 30 Q 110 45 125 60 Q 145 65 155 50 Q 150 35 135 28 Z" fill="#cfe4f0" stroke="#a3c7da" strokeWidth="0.4"/>
        {/* roads */}
        <g stroke="#e6e1d8" strokeWidth="1.2" fill="none">
          <path d="M 0 30 L 200 35"/>
          <path d="M 10 70 L 190 90"/>
          <path d="M 50 0 L 65 130"/>
          <path d="M 110 0 L 130 130"/>
          <path d="M 160 10 L 180 130"/>
        </g>
        <g stroke="#efece4" strokeWidth="0.6" fill="none">
          <path d="M 0 50 L 200 55"/>
          <path d="M 20 100 L 200 115"/>
          <path d="M 90 0 L 100 130"/>
          <path d="M 140 0 L 155 130"/>
        </g>
        {/* land blocks */}
        <rect x="100" y="70" width="35" height="25" fill="#eaf3df" opacity="0.55"/>
        <rect x="155" y="65" width="40" height="40" fill="#eaf3df" opacity="0.45"/>
        <rect x="5" y="5" width="40" height="25" fill="#f4efe2" opacity="0.6"/>
        {/* pins */}
        {pins.slice(0, 6).map((p, i) => (
          <g key={i} transform={`translate(${p.x*200} ${p.y*130})`}>
            <circle r="3" fill="#0084ff" stroke="#fff" strokeWidth="0.8"/>
          </g>
        ))}
      </svg>
      <button className="map-cta">{I.pin}<span>EXPLORE ON MAP</span></button>
    </div>
  );
}

function FilterSidebar({ filters, setFilter, pins, onOpenMap }) {
  const [locQuery, setLocQuery] = useState('');
  
  return (
    <aside className="sidebar">
      <MapPreview pins={pins} onOpen={onOpenMap}/>

      <div className="locality-search">
        <span className="ls-ic">{I.search}</span>
        <input 
          placeholder="Search for locality / hotel name" 
          value={locQuery}
          onChange={(e) => setLocQuery(e.target.value)}
        />
      </div>

      <FilterSection title="Suggested For You">
        <Checkbox label="Last Minute Deals" checked={filters.suggested.includes("Last Minute Deals")} onChange={() => setFilter.toggle("suggested","Last Minute Deals")}/>
        <Checkbox label="5 Star" count={132} checked={filters.suggested.includes("5 Star")} onChange={() => setFilter.toggle("suggested","5 Star")}/>
        <Checkbox label="4 Star" count={284} checked={filters.suggested.includes("4 Star")} onChange={() => setFilter.toggle("suggested","4 Star")}/>
        <Checkbox label="3 Star" count={398} checked={filters.suggested.includes("3 Star")} onChange={() => setFilter.toggle("suggested","3 Star")}/>
      </FilterSection>

      <FilterSection title="Preference">
        <Radio label="Price per Night" checked={filters.pricePref === "night"} onChange={() => setFilter.set("pricePref", "night")} />
        <Radio label="Total Price" sub="All nights & rooms excluding taxes" checked={filters.pricePref === "total"} onChange={() => setFilter.set("pricePref", "total")} badge="new"/>
      </FilterSection>

      <FilterSection title="Price Per Night">
        <Checkbox label="Under ₹ 2,000" checked={filters.price.includes("under2k")} onChange={() => setFilter.toggle("price","under2k")}/>
        <Checkbox label="₹ 2,000 - ₹ 4,000" checked={filters.price.includes("2to4")} onChange={() => setFilter.toggle("price","2to4")}/>
        <Checkbox label="₹ 4,000 - ₹ 6,000" checked={filters.price.includes("4to6")} onChange={() => setFilter.toggle("price","4to6")}/>
        <Checkbox label="₹ 6,000 & above" checked={filters.price.includes("over6k")} onChange={() => setFilter.toggle("price","over6k")}/>

        <div className="budget-row">
          <div className="budget-l">Your Budget</div>
          <div className="budget-inputs">
            <input placeholder="Min" value={filters.minBudget} onChange={e => setFilter.set("minBudget", e.target.value)}/>
            <span>to</span>
            <input placeholder="Max" value={filters.maxBudget} onChange={e => setFilter.set("maxBudget", e.target.value)}/>
            <button className="budget-go">→</button>
          </div>
        </div>
      </FilterSection>

      <FilterSection title="User Rating">
        <Checkbox label="Excellent: 4.2+" count={1488} checked={filters.rating.includes("4.2")} onChange={() => setFilter.toggle("rating","4.2")}/>
        <Checkbox label="Very Good: 3.5+" count={2401} checked={filters.rating.includes("3.5")} onChange={() => setFilter.toggle("rating","3.5")}/>
        <Checkbox label="Good: 3+" count={2802} checked={filters.rating.includes("3")} onChange={() => setFilter.toggle("rating","3")}/>
      </FilterSection>

      <FilterSection title="Bedrooms">
        <Checkbox label="2 Bedrooms & more" checked={filters.bedrooms.includes("2plus")} onChange={() => setFilter.toggle("bedrooms","2plus")}/>
      </FilterSection>

      <FilterSection title="Property Type">
        <Checkbox label="Apartment" count={2614} checked={filters.type.includes("Apartment")} onChange={() => setFilter.toggle("type","Apartment")}/>
        <Checkbox label="Villa" count={2284} checked={filters.type.includes("Villa")} onChange={() => setFilter.toggle("type","Villa")}/>
        <Checkbox label="Homestay" count={518} checked={filters.type.includes("Homestay")} onChange={() => setFilter.toggle("type","Homestay")}/>
        <Checkbox label="Cottage" count={188} checked={filters.type.includes("Cottage")} onChange={() => setFilter.toggle("type","Cottage")}/>
        <Checkbox label="Hostel" count={84} checked={filters.type.includes("Hostel")} onChange={() => setFilter.toggle("type","Hostel")}/>
        <div className="show-more">Show 3 more</div>
      </FilterSection>

      <FilterSection title="Top Locations">
        {["Lake Pichola","Fateh Sagar","Old City","Jagdish Chowk","Sajjangarh","Hanuman Ghat","Badi Lake","Ambrai Ghat","Doodh Talai","Sukhadia Circle"].map(l => (
          <Checkbox key={l} label={l} checked={filters.areas.includes(l)} onChange={() => setFilter.toggle("areas", l)}/>
        ))}
      </FilterSection>

      <FilterSection title="Room Views">
        <Checkbox label="Garden View" count={381} checked={filters.views.includes("garden")} onChange={() => setFilter.toggle("views","garden")}/>
        <Checkbox label="City View" count={72} checked={filters.views.includes("city")} onChange={() => setFilter.toggle("views","city")}/>
        <Checkbox label="Lake View" count={194} checked={filters.views.includes("lake")} onChange={() => setFilter.toggle("views","lake")}/>
        <Checkbox label="Pool View" count={186} checked={filters.views.includes("pool")} onChange={() => setFilter.toggle("views","pool")}/>
      </FilterSection>

      <FilterSection title="Chains">
        {[["Pichola Stays", 98], ["Alaya Stays", 18], ["Bluekite", 252], ["EKO STAY", 16], ["Arooba", 114]].map(([n,c]) => (
          <Checkbox key={n} label={n} count={c} checked={filters.chains.includes(n)} onChange={() => setFilter.toggle("chains",n)}/>
        ))}
        <div className="show-more">Show 9 more</div>
      </FilterSection>

      <FilterSection title="MMT Luxe Selections">
        <Checkbox label="MMT Luxe Selections" count={88} checked={filters.luxe} onChange={() => setFilter.set("luxe", !filters.luxe)}/>
      </FilterSection>

      <FilterSection title="Amenities">
        <div className="locality-search amen">
          <span className="ls-ic">{I.search}</span>
          <input placeholder="Search amenities"/>
        </div>
        <div className="amen-h">Guests Love</div>
        <Checkbox label="Swimming Pool" count={2870} icon={<span className="amen-ic">★ </span>} checked={filters.amenities.includes("Pool")} onChange={() => setFilter.toggle("amenities","Pool")}/>
        <Checkbox label="Balcony/Terrace" count={1208} icon={<span className="amen-ic">★ </span>} checked={filters.amenities.includes("Balcony")} onChange={() => setFilter.toggle("amenities","Balcony")}/>
        <Checkbox label="Caretaker" count={398} icon={<span className="amen-ic">★ </span>} checked={filters.amenities.includes("Caretaker")} onChange={() => setFilter.toggle("amenities","Caretaker")}/>
        <Checkbox label="Fireplace" count={68} icon={<span className="amen-ic">★ </span>} checked={filters.amenities.includes("Fireplace")} onChange={() => setFilter.toggle("amenities","Fireplace")}/>
        <div className="show-more">Show 13 more</div>
      </FilterSection>

      <div className="back-top" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>BACK TO TOP</div>
    </aside>
  );
}

/* ─────────── PhotoCarousel Component ─────────── */
function PhotoCarousel({ seeds, photos, hotelId }) {
  const [idx, setIdx] = useState(0);
  const total = seeds.length;
  const go = (d, e) => { 
    e.stopPropagation(); 
    setIdx(i => (i + d + total) % total); 
  };
  return (
    <div className="carousel">
      <div className="carousel-track" style={{transform: `translateX(${-idx * 100}%)`, display: 'flex', width: '100%', height: '100%'}}>
        {seeds.map((s) => (
          <div key={s} className="carousel-slide" style={{ minWidth: '100%', height: '100%' }}>
            {/* Beautiful hotel imagery placeholders styled with rich Unsplash images */}
            <img 
              src={s.includes('unsplash.com') ? s : `https://images.unsplash.com/photo-${s}?auto=format&fit=crop&w=600&h=420&q=80`} 
              alt="Udaipur Luxury Stay" 
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        ))}
      </div>
      <button className="car-arr car-l" onClick={(e) => go(-1, e)}>{I.chevronL}</button>
      <button className="car-arr car-r" onClick={(e) => go(1, e)}>{I.chevronR}</button>
      <div className="car-dots">
        {seeds.map((_, i) => <span key={i} className={i === idx ? "on" : ""}/>)}
      </div>
      <div className="car-photos">
        {I.photo}
        <span>{photos} Photos</span>
        {I.play}
      </div>
    </div>
  );
}

/* ─────────── HotelCard Component ─────────── */
function HotelCard({ h, density, wishlist, toggleWishlist, onSelectHotel }) {
  const on = wishlist.has(h.id);
  return (
    <article className={`hotel-card d-${density}`} onClick={() => onSelectHotel && onSelectHotel(h)} style={{ cursor: 'pointer' }}>
      <div className="hc-photo">
        <PhotoCarousel seeds={h.seed} photos={h.photos} hotelId={h.id}/>
      </div>
      <div className="hc-body">
        <div className="hc-top">
          <div className="hc-meta">
            {h.starHost && (
              <div className="star-host">{I.starHostBadge}<span>STAR HOST</span></div>
            )}
            <h3 className="hc-name">
              {h.coupleFriendly && <span className="cf-tick">{I.check}</span>}
              {h.name}
              {h.likeStars > 0 && <span className="like-stars"> ❪ Like a {h.likeStars}<span style={{color:"#fbb52c"}}>★</span> ❫</span>}
            </h3>
            <div className="hc-loc"><a href="#locality" onClick={(e) => e.stopPropagation()}>{h.locality}</a> <span className="dot">|</span> {h.distance}</div>
            <div className="hc-room">{h.roomType}</div>
            {h.coupleFriendly && <div className="couple-pill">Couple Friendly</div>}
            {h.amenities[0] && (
              <div className="hc-amen">{I.airport}<span>{h.amenities[0]}</span></div>
            )}
            {density !== "compact" && (
              <div className="hc-review">
                {I.bulb}
                <span>"{h.review}"</span>
              </div>
            )}
          </div>
          <div className="hc-right">
            <div className="rating-pill">
              <div className="rp-label">{h.ratingLabel}</div>
              <div className="rp-score">{h.rating.toFixed(1)}</div>
              <div className="rp-reviews">({h.reviews} Ratings)</div>
            </div>
            {h.promo && <div className="promo-pill">{h.promo}</div>}
            <div className="price-block">
              {h.strike > h.price && <div className="strike">₹ {h.strike.toLocaleString("en-IN")}</div>}
              <div className="price">₹ {h.price.toLocaleString("en-IN")}</div>
              <div className="taxes">+ ₹ {h.taxes} taxes &amp; fees</div>
              <div className="per-night">Per Night</div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: "end" }}>
                <button
                  className="hp-hc-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectHotel && onSelectHotel(h);
                  }}
                  style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '6px', background: '#eb2026', border: 'none', color: '#fff', fontWeight: 800 }}
                >
                  Book Stay
                </button>
              </div>
            </div>
          </div>
        </div>
        {h.longStay.length > 0 && density === "spacious" && (
          <div className="long-stay">
            <div className="ls-h">Long Stay Benefits</div>
            <ul>
              {h.longStay.map(b => <li key={b}>{b}</li>)}
            </ul>
          </div>
        )}
      </div>
      <button className={"wl-btn" + (on ? " on" : "")} onClick={(e) => { e.stopPropagation(); toggleWishlist(h.id); }} aria-label="Wishlist">
        {I.heart(on)}
      </button>
    </article>
  );
}

/* ─────────── Sort Tabs Component ─────────── */
const SORTS = [
  { id: "popular", label: "Popularity" },
  { id: "low", label: "Price (Low to High)" },
  { id: "high", label: "Price (High to Low)" },
  { id: "rating", label: "User Rating (Highest)" },
  { id: "best", label: "Lowest Price & Best Rated" },
];

function SortTabs({ sort, setSort }) {
  return (
    <div className="sort-tabs">
      <button className="sort-arr">{I.chevronL}</button>
      <div className="sort-list">
        {SORTS.map(s => (
          <button key={s.id} className={"sort-tab" + (sort === s.id ? " on" : "")} onClick={() => setSort(s.id)}>
            {s.label}
          </button>
        ))}
      </div>
      <button className="sort-arr">{I.chevronR}</button>
    </div>
  );
}

/* ─────────── Map Overlay ─────────── */
function MapOverlay({ open, onClose, pins, hotels, wishlist, toggleWishlist }) {
  const [hover, setHover] = useState(null);
  if (!open) return null;
  return (
    <div className="map-overlay" onClick={onClose}>
      <div className="map-dialog" onClick={e => e.stopPropagation()}>
        <button className="map-close" onClick={onClose}>✕</button>
        <div className="map-canvas">
          <svg viewBox="0 0 1000 700" className="map-bg" preserveAspectRatio="xMidYMid slice">
            <rect width="1000" height="700" fill="#f5f1e7"/>
            {/* Lake Pichola */}
            <path d="M 120 220 Q 90 320 220 400 Q 360 440 430 380 Q 480 310 400 230 Q 280 180 200 200 Z" fill="#cfe4f0" stroke="#a3c7da" strokeWidth="1.2"/>
            {/* Fateh Sagar */}
            <path d="M 620 110 Q 580 200 660 280 Q 780 310 820 220 Q 800 130 720 90 Z" fill="#cfe4f0" stroke="#a3c7da" strokeWidth="1.2"/>
            {/* Badi Lake / Small Lake */}
            <path d="M 760 480 Q 720 540 800 600 Q 880 610 900 540 Q 880 470 820 460 Z" fill="#cfe4f0" stroke="#a3c7da" strokeWidth="1.2"/>
            {/* Roads vector lines */}
            <g stroke="#e6e1d8" strokeWidth="6" fill="none">
              <path d="M 0 120 L 1000 140"/>
              <path d="M 50 340 L 980 410"/>
              <path d="M 30 560 L 980 620"/>
              <path d="M 250 0 L 320 700"/>
              <path d="M 560 0 L 640 700"/>
              <path d="M 870 0 L 920 700"/>
            </g>
            <g stroke="#efece4" strokeWidth="3" fill="none">
              <path d="M 0 200 L 1000 230"/>
              <path d="M 0 450 L 1000 480"/>
              <path d="M 150 0 L 200 700"/>
              <path d="M 440 0 L 480 700"/>
              <path d="M 720 0 L 770 700"/>
            </g>
            {/* land parks and blocks */}
            <rect x="500" y="450" width="180" height="100" fill="#dbeac8" opacity="0.7"/>
            <rect x="60" y="50" width="120" height="110" fill="#dbeac8" opacity="0.5"/>
            <rect x="850" y="280" width="120" height="140" fill="#dbeac8" opacity="0.5"/>
            {/* map city annotations */}
            <text x="200" y="300" fontSize="14" fill="#7a8c98" fontStyle="italic" fontWeight="600">Lake Pichola</text>
            <text x="680" y="200" fontSize="14" fill="#7a8c98" fontStyle="italic" fontWeight="600">Fateh Sagar</text>
            <text x="80" y="105" fontSize="11" fill="#9c8b67">Sukhadia Circle</text>
            <text x="500" y="80" fontSize="11" fill="#9c8b67">Old City Udaipur</text>
            <text x="900" y="350" fontSize="11" fill="#9c8b67">Sajjangarh Fort</text>
          </svg>
          {pins.map((p) => {
            const h = hotels.find(x => x.id === p.id);
            if (!h) return null;
            const isHover = hover === p.id;
            return (
              <button
                key={p.id}
                className={"map-pin" + (isHover ? " on" : "") + (wishlist.has(p.id) ? " wl" : "")}
                style={{left: `${p.x * 100}%`, top: `${p.y * 100}%`}}
                onMouseEnter={() => setHover(p.id)}
                onMouseLeave={() => setHover(null)}
              >
                <span className="pin-price">₹{(p.price/1000).toFixed(1)}k</span>
              </button>
            );
          })}
          {hover && (() => {
            const h = hotels.find(x => x.id === hover);
            const p = pins.find(x => x.id === hover);
            if (!h || !p) return null;
            return (
              <div className="map-card" style={{left: `${p.x * 100}%`, top: `${p.y * 100}%`}}>
                <img src={`https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=240&h=150&q=80&sig=${h.id}`} alt=""/>
                <div className="mc-body">
                  <div className="mc-rating">
                    <span className="mc-score">{h.rating.toFixed(1)}</span>
                    <span className="mc-label">{h.ratingLabel}</span>
                    <span className="mc-reviews">({h.reviews})</span>
                  </div>
                  <div className="mc-name">{h.name}</div>
                  <div className="mc-loc">{h.locality}</div>
                  <div className="mc-price-row">
                    {h.strike > h.price && <span className="mc-strike">₹{h.strike.toLocaleString("en-IN")}</span>}
                    <span className="mc-price">₹{h.price.toLocaleString("en-IN")}</span>
                    <span className="mc-pn">/night</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

/* ─────────── Mobile shell Simulator ─────────── */
function MobileApp({ hotels, wishlist, toggleWishlist, onOpenFilter, onSelectHotel, checkIn, checkOut, guests }) {
  const getGuestDisplay = () => {
    try {
      const g = guests ? JSON.parse(guests) : { adults: 2, rooms: 1 };
      let display = `${g.adults || 0} Guest${(g.adults || 0) !== 1 ? 's' : ''}`;
      if (g.children && g.children > 0) {
        display += ` · ${g.children} Child${g.children > 1 ? 'ren' : ''}`;
      }
      return display;
    } catch {
      return '2 Guests';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const metaDisplay = checkIn && checkOut
    ? `${formatDate(checkIn)} - ${formatDate(checkOut)} · ${getGuestDisplay()}`
    : '14 May - 7 Jun · 2 Guests';

  return (
    <div className="mobile-shell">
      <div className="m-top">
        <button className="m-back">{I.chevronL}</button>
        <div className="m-title">
          <div className="m-loc">Udaipur, India</div>
          <div className="m-meta">{metaDisplay}</div>
        </div>
        <button className="m-edit">EDIT</button>
      </div>
      <div className="m-actions">
        <button className="m-action" onClick={onOpenFilter}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/></svg>
          Filters
        </button>
        <button className="m-action">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M6 12h12M10 18h4"/></svg>
          Sort
        </button>
        <button className="m-action">
          {I.pin} Map
        </button>
      </div>
      <div className="m-result-h">{hotels.length} Properties in Udaipur</div>
      <div className="m-list">
        {hotels.map(h => (
          <article key={h.id} className="m-card" onClick={() => onSelectHotel && onSelectHotel(h)} style={{ cursor: 'pointer' }}>
            <div className="m-photo">
              <img src={`https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=390&h=180&q=80&sig=${h.id}`} alt=""/>
              <button className={"m-wl" + (wishlist.has(h.id) ? " on" : "")} onClick={(e) => { e.stopPropagation(); toggleWishlist(h.id); }}>
                {I.heart(wishlist.has(h.id))}
              </button>
              {h.starHost && <div className="m-star-host">★ STAR HOST</div>}
              <div className="m-photo-count">{I.photo} {h.photos} Photos</div>
            </div>
            <div className="m-body">
              <div className="m-rating-row">
                <span className="m-rating">{h.rating.toFixed(1)}</span>
                <span className="m-rating-l">{h.ratingLabel}</span>
                <span className="m-rev">({h.reviews})</span>
              </div>
              <div className="m-name">{h.name}</div>
              <div className="m-loc-r">{h.locality} · {h.distance}</div>
              <div className="m-room">{h.roomType}</div>
              {h.coupleFriendly && <div className="m-couple">Couple Friendly</div>}
              <div className="m-price-row">
                {h.strike > h.price && <span className="m-strike">₹{h.strike.toLocaleString("en-IN")}</span>}
                <span className="m-price">₹{h.price.toLocaleString("en-IN")}</span>
                <span className="m-pn">/ night</span>
              </div>
              <div className="m-taxes">+ ₹{h.taxes} taxes</div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  className="hp-hc-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectHotel && onSelectHotel(h);
                  }}
                  style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '6px', background: '#eb2026', border: 'none', color: '#fff', fontWeight: 800 }}
                >
                  Book Stay
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

/* ─────────── Main HotelListingPage ─────────── */
const generateHotels = (cityName) => {
  const imgUrls = [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&h=400&q=80',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&h=400&q=80',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&h=400&q=80',
    'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=600&h=400&q=80',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&h=400&q=80'
  ]
  const localities = ['Downtown', 'Near Beach Road', 'Lakeside View', 'City Center', 'Old Haveli Street']
  return Array.from({ length: 12 }).map((_, i) => ({
    id: `hotel-${cityName.toLowerCase().trim()}-${i}`,
    name: `${i % 2 === 0 ? 'The Grand' : 'Heritage'} ${cityName} ${['Palace', 'Resort', 'Villa', 'Suites'][i % 4]}`,
    locality: localities[i % localities.length],
    distance: `${(0.5 + i * 0.8).toFixed(1)} km from City Center`,
    rating: 4.0 + (i % 10) * 0.1,
    ratingLabel: ['Excellent', 'Very Good', 'Good'][i % 3],
    reviews: 100 + i * 45,
    price: 3000 + i * 800,
    strike: 4500 + i * 900,
    taxes: 450 + i * 120,
    type: i % 3 === 0 ? 'Apartment' : i % 3 === 1 ? 'Villa' : 'Hotel',
    roomType: 'Entire 2-Bedroom Apartment',
    amenities: ['Airport Transfer', 'Free WiFi', 'Swimming Pool'],
    review: "Stunning lake view from balcony, hosts were warm and the rooftop sunset is unreal.",
    longStay: ["Complimentary Breakfast", "Free Laundry"],
    seed: [
      "1542314831-c53cd4b85d05", "1566073771259-6a8506099945", "1582719478250-c89cae4dc85b", "1512918728675-ed5a9ecdebfd", "1520250497591-112f2f40a3f4", "1540541338287-41700207dee6", "1611892440504-42a792e24d32", "1590050752117-238cb061271f", "1578683010236-d716f9a3f461", "1551882547-ff40c0d589rx", "1535827841776-24afc1e255ac", "1445019980597-93fa8acb246c"
    ].sort(() => Math.random() - 0.5).slice(0, 5),
    photos: 234,
    starHost: i % 4 === 0,
    coupleFriendly: true,
    promo: i % 5 === 0 ? "MMT LUXE SELECTION" : ""
  }))
}

export default function HotelListingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const cityQuery = searchParams.get('city') || 'Udaipur';
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const guests = searchParams.get('guests');

  const [realHotels, setRealHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    const fetchRealHotels = async () => {
      try {
        setLoading(true);
        setApiError(null);
        const res = await searchHotels({ city: cityQuery, checkIn, checkOut, guests });

        // Map backend response to match expected frontend structure if needed
        const mapped = (res.data || []).map((h, i) => ({
          ...h,
          id: h.id,
          locality: h.location || h.city,
          distance: '2.0 km from City Center',
          ratingLabel: h.rating >= 4.5 ? 'Excellent' : h.rating >= 4 ? 'Very Good' : 'Good',
          strike: h.price + 1000,
          taxes: h.price * 0.18,
          roomType: 'Deluxe Room',
          amenities: h.amenities || ['Free WiFi'],
          review: h.description || "A wonderful stay.",
          longStay: [],
          seed: h.images?.length > 0 ? h.images : [
            "1542314831-c53cd4b85d05", "1566073771259-6a8506099945", "1582719478250-c89cae4dc85b", "1512918728675-ed5a9ecdebfd", "1520250497591-112f2f40a3f4", "1540541338287-41700207dee6", "1611892440504-42a792e24d32", "1590050752117-238cb061271f", "1578683010236-d716f9a3f461", "1551882547-ff40c0d589rx", "1535827841776-24afc1e255ac", "1445019980597-93fa8acb246c"
          ].sort(() => Math.random() - 0.5).slice(0, 5),
          photos: 10,
          starHost: h.rating >= 4.5,
          coupleFriendly: true,
          promo: ""
        }));

        if (mapped.length > 0) {
          setRealHotels(mapped);
        } else {
          setRealHotels(generateHotels(cityQuery));
        }
      } catch (err) {
        setApiError(err.message || 'Failed to load hotels. Using fallback properties.');
        setRealHotels(generateHotels(cityQuery));
      } finally {
        setLoading(false);
      }
    };
    fetchRealHotels();
  }, [cityQuery, checkIn, checkOut, guests]);

  const DYNAMIC_HOTELS = useMemo(() => realHotels, [realHotels]);


  const { user, verifyOtpLogin } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [mobilePhone, setMobilePhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [selectedHotel, setSelectedHotel] = useState(null)
  const [loginError, setLoginError] = useState('')
  const [showCustomAlert, setShowCustomAlert] = useState(false)
  const [alertMsg, setAlertMsg] = useState('')

  const handleSelectHotel = (hotel) => {
    if (!user) {
      setAlertMsg("Please login to continue booking this stay")
      setShowCustomAlert(true)
      setSelectedHotel(hotel)
      return
    }
    navigate(`/hotels/detail/${hotel.id}`, {
      state: {
        hotel,
        checkIn,
        checkOut,
        guests
      }
    })
  }

  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (!mobilePhone || mobilePhone.length < 10) {
      setLoginError('Please enter a valid 10-digit mobile number')
      return
    }
    setLoginError('')
    try {
      const res = await authService.sendMobileOtp(mobilePhone)
      if (res && (res.data || res.message)) {
        setOtpSent(true)
      } else {
        setLoginError('Failed to send OTP. Please try again.')
      }
    } catch (err) {
      setLoginError(err.message || 'Failed to send OTP. Please try again.')
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (!otpCode || otpCode.length < 6) {
      setLoginError('Please enter a valid 6-digit OTP (e.g., 123456)')
      return
    }
    setLoginError('')
    try {
      await verifyOtpLogin(mobilePhone, otpCode)
      setShowLoginModal(false)
      if (selectedHotel) {
        navigate(`/hotels/detail/${selectedHotel.id}`, { state: { hotel: selectedHotel, checkIn, checkOut, guests } })
      }
    } catch (err) {
      setLoginError(err.message || 'Verification failed. Try 123456.')
    }
  }

  // State configurations drive our premium layout density & viewport simulator
  const [density, setDensity] = useState('comfortable'); // compact, comfortable, spacious
  const [view, setView] = useState('desktop'); // desktop, mobile

  const [filters, setFilters] = useState({
    suggested: [],
    pricePref: "night",
    price: [],
    minBudget: "",
    maxBudget: "",
    rating: [],
    bedrooms: [],
    type: [],
    areas: [],
    views: [],
    chains: [],
    luxe: false,
    amenities: [],
  });

  const [sort, setSort] = useState("popular");
  const [wishlist, setWishlist] = useState(new Set());
  const [mapOpen, setMapOpen] = useState(false);
  const [page, setPage] = useState(1);

  // Helper filters state functions
  const setFilter = useMemo(() => ({
    set: (k, v) => setFilters(f => ({...f, [k]: v})),
    toggle: (k, v) => setFilters(f => ({
      ...f,
      [k]: f[k].includes(v) ? f[k].filter(x => x !== v) : [...f[k], v]
    })),
  }), []);

  const toggleWishlist = (id) => {
    setWishlist(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Filter & sort logic applied dynamically
  const filtered = useMemo(() => {
    let list = [...DYNAMIC_HOTELS];
    
    if (filters.price.length) {
      list = list.filter(h => {
        return filters.price.some(p => {
          if (p === "under2k") return h.price < 2000;
          if (p === "2to4") return h.price >= 2000 && h.price < 4000;
          if (p === "4to6") return h.price >= 4000 && h.price < 6000;
          if (p === "over6k") return h.price >= 6000;
          return true;
        });
      });
    }

    if (filters.minBudget) list = list.filter(h => h.price >= Number(filters.minBudget));
    if (filters.maxBudget) list = list.filter(h => h.price <= Number(filters.maxBudget));
    
    if (filters.rating.length) {
      const min = Math.min(...filters.rating.map(r => Number(r)));
      list = list.filter(h => h.rating >= min);
    }
    
    if (filters.type.length) list = list.filter(h => filters.type.includes(h.type));
    
    if (filters.areas.length) {
      list = list.filter(h => filters.areas.includes(h.locality) || filters.areas.includes(h.area));
    }

    if (filters.chains.length) {
      list = list.filter(h => h.chain && filters.chains.includes(h.chain));
    }

    if (filters.suggested.includes("Last Minute Deals")) {
      list = list.filter(h => h.strike > h.price * 1.5); // High discount
    }

    if (filters.suggested.includes("5 Star")) {
      list = list.filter(h => h.rating >= 4.8);
    }

    if (filters.suggested.includes("4 Star")) {
      list = list.filter(h => h.rating >= 4.5 && h.rating < 4.8);
    }

    if (filters.suggested.includes("3 Star")) {
      list = list.filter(h => h.rating >= 4.0 && h.rating < 4.5);
    }

    if (filters.amenities.length) {
      list = list.filter(h => {
        return filters.amenities.every(amen => {
          if (amen === 'Pool') return h.roomType.toLowerCase().includes('pool') || h.review.toLowerCase().includes('pool');
          if (amen === 'Balcony') return h.review.toLowerCase().includes('balcony');
          return true;
        });
      });
    }

    if (filters.luxe) {
      list = list.filter(h => h.promo === "MMT LUXE SELECTION" || h.rating >= 4.7);
    }

    // Sort order logic
    if (sort === "low") list.sort((a,b) => a.price - b.price);
    else if (sort === "high") list.sort((a,b) => b.price - a.price);
    else if (sort === "rating") list.sort((a,b) => b.rating - a.rating);
    else if (sort === "best") list.sort((a,b) => (b.rating - a.rating) || (a.price - b.price));

    return list;
  }, [filters, sort, DYNAMIC_HOTELS]);

  const perPage = 6;
  const visible = filtered.slice(0, page * perPage);

  // Scroll pagination simulation
  useEffect(() => {
    const onScroll = () => {
      const root = document.querySelector(".results-list");
      if (!root) return;
      const r = root.getBoundingClientRect();
      if (r.bottom < window.innerHeight + 600 && visible.length < filtered.length) {
        setPage(p => p + 1);
      }
    };
    window.addEventListener("scroll", onScroll, {passive: true});
    return () => window.removeEventListener("scroll", onScroll);
  }, [visible.length, filtered.length]);

  useEffect(() => { setPage(1); }, [filters, sort]);

  return (
    <div className="udaipur-page-wrapper">
      {/* Searchbar row on Top */}
      <div className="search-wrap">
        <SearchBar 
          city={cityQuery} 
          checkIn={checkIn} 
          checkOut={checkOut} 
          guests={guests}
          onSearch={(c, i, o) => {
            const newParams = new URLSearchParams(searchParams);
            newParams.set('city', c);
            if (i) newParams.set('checkIn', i);
            if (o) newParams.set('checkOut', o);
            navigate({ search: newParams.toString() });
          }} 
        />
      </div>

      {/* Main Container */}
      <div className="page-layout">
        
        {/* Left Filter Sidebar */}
        <FilterSidebar 
          filters={filters} 
          setFilter={setFilter} 
          pins={HOTEL_PINS} 
          onOpenMap={() => setMapOpen(true)}
        />

        {/* Right Search Results Column */}
        <main className="results">

          {/* Error Banner */}
          {apiError && (
            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '4px',
              padding: '12px 16px',
              marginBottom: '16px',
              fontSize: '14px',
              color: '#856404',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>⚠️ {apiError}</span>
              <button onClick={() => setApiError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>
          )}

          {/* Breadcrumbs */}
          <div className="breadcrumb">
            <span style={{ cursor: 'pointer' }} onClick={() => navigate('/hotels')}>Hotels</span> 
            <span>›</span> 
            <span style={{ cursor: 'pointer' }} onClick={() => navigate('/hotels')}>Rajasthan</span>
            <span>›</span> 
            <span style={{ color: '#222', fontWeight: 600 }}>Hotels in {cityQuery}</span>
          </div>

          {/* Results Heading Area */}
          <div className="results-head">
            <h1>{filtered.length.toLocaleString("en-IN")}{filtered.length === UDAIPUR_HOTELS.length ? ",278" : ""} Properties in {cityQuery}</h1>
            <button className="travel-tips">💡 Explore Travel Tips →</button>
            
            {/* Design Controls floating widget inside search area for incredible Premium feel */}
            <div className="control-capsule" style={{ marginLeft: 'auto' }}>
              <span>Density:</span>
              <button className={`control-btn ${density === 'compact' ? 'active' : ''}`} onClick={() => setDensity('compact')}>Compact</button>
              <button className={`control-btn ${density === 'comfortable' ? 'active' : ''}`} onClick={() => setDensity('comfortable')}>Comfortable</button>
              <button className={`control-btn ${density === 'spacious' ? 'active' : ''}`} onClick={() => setDensity('spacious')}>Spacious</button>
              
              <div className="control-divider" />
              
              <span>View:</span>
              <button className={`control-btn ${view === 'desktop' ? 'active' : ''}`} onClick={() => setView('desktop')}>Desktop</button>
              <button className={`control-btn ${view === 'mobile' ? 'active' : ''}`} onClick={() => setView('mobile')}>Mobile</button>
            </div>
          </div>

          {/* View simulator container */}
          {view === 'mobile' ? (
            <div className="mobile-wrap">
              <div className="mobile-frame">
                <MobileApp
                  hotels={filtered}
                  wishlist={wishlist}
                  toggleWishlist={toggleWishlist}
                  onOpenFilter={() => {}}
                  onSelectHotel={handleSelectHotel}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  guests={guests}
                />
              </div>
            </div>
          ) : (
            <>
              {/* Sort Tabs navigation strip */}
              <SortTabs sort={sort} setSort={setSort}/>

              <div className="showing-h">Showing Stays in {cityQuery}</div>

              {/* Active Results List */}
              <div className="results-list">
                {visible.map((h, idx) => (
                  <div key={h.id} data-aos="fade-up" data-aos-delay={idx * 50}>
                    <HotelCard
                      h={h}
                      density={density}
                      wishlist={wishlist}
                      toggleWishlist={toggleWishlist}
                      onSelectHotel={handleSelectHotel}
                    />
                  </div>
                ))}

                {/* Shimmer loading list items */}
                {visible.length < filtered.length && (
                  <div className="loading-card">
                    <div className="lc-photo"/>
                    <div className="lc-body">
                      <div className="lc-line w70"/>
                      <div className="lc-line w50"/>
                      <div className="lc-line w40"/>
                    </div>
                  </div>
                )}

                {visible.length === filtered.length && filtered.length > 0 && (
                  <div className="end-card">You've reached the end of the list.</div>
                )}

                {filtered.length === 0 && (
                  <div className="empty">No properties match your active filters. Try removing some to see more stays.</div>
                )}
              </div>
            </>
          )}

        </main>
      </div>

      {/* Map Overlay modal popup */}
      <MapOverlay 
        open={mapOpen} 
        onClose={() => setMapOpen(false)} 
        pins={HOTEL_PINS} 
        hotels={UDAIPUR_HOTELS} 
        wishlist={wishlist} 
        toggleWishlist={toggleWishlist} 
      />

      {showLoginModal && (
        <div className="custom-modal-overlay">
          <div className="custom-login-card">
            <button className="custom-modal-close" onClick={() => setShowLoginModal(false)}>✕</button>

            <div className="custom-login-header">
              <span className="custom-login-icon">🔐</span>
              <h3>Login to Continue</h3>
              <p>MakeMyTrip requires verification before booking. Enter your mobile number to instantly login.</p>
            </div>

            {loginError && <div className="custom-login-error">{loginError}</div>}

            {!otpSent ? (
              <form onSubmit={handleSendOtp}>
                <div className="custom-input-group">
                  <label>MOBILE NUMBER</label>
                  <div className="custom-phone-input">
                    <span className="custom-country-code">+91</span>
                    <input
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={mobilePhone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setMobilePhone(val);
                      }}
                      maxLength="10"
                      inputMode="numeric"
                      autoFocus
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="custom-login-btn">GET ONE TIME PASSWORD (OTP)</button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <div className="custom-input-group">
                  <div className="custom-otp-header">
                    <label>ENTER 6-DIGIT OTP</label>
                    <button type="button" onClick={() => setOtpSent(false)}>Change Number</button>
                  </div>
                  <input
                    type="text"
                    maxLength="6"
                    placeholder="Enter 6-digit OTP"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="custom-otp-input"
                    autoFocus
                    required
                  />
                </div>
                <button type="submit" className="custom-verify-btn">VERIFY & RESUME BOOKING</button>
              </form>
            )}
          </div>
        </div>
      )}

      {showCustomAlert && (
        <div className="custom-modal-overlay" style={{ zIndex: 10000 }}>
          <div className="custom-alert-card">
            <div className="custom-alert-icon">⚠️</div>
            <h3 className="custom-alert-title">Authentication Required</h3>
            <p className="custom-alert-msg">{alertMsg}</p>
            <div className="custom-alert-actions">
              <button 
                className="custom-alert-btn-cancel" 
                onClick={() => setShowCustomAlert(false)}
              >
                CANCEL
              </button>
              <button 
                className="custom-alert-btn-confirm" 
                onClick={() => {
                  setShowCustomAlert(false)
                  setShowLoginModal(true)
                }}
              >
                LOGIN NOW
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
