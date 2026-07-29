// ─── Local photograph helpers ────────────────────────────────────────────────
// Real photographs stored locally under public/images — see src/utils/images.js
import { photo } from '../utils/images'

// ─── Service Tabs Data ────────────────────────────────────────────────────────
export const SERVICE_TABS = [
  { id: 'flights',   icon: 'flights',   label: 'Flights' },
  { id: 'hotels',    icon: 'hotels',    label: 'Hotels' },
  { id: 'villas',    icon: 'villas',    label: 'Villas &\nHomestays' },
  { id: 'holidays',  icon: 'holidays',  label: 'Holiday\nPackages' },
  { id: 'trains',    icon: 'trains',    label: 'Trains' },
  { id: 'buses',     icon: 'buses',     label: 'Buses' },
  { id: 'cabs',      icon: 'cabs',      label: 'Cabs' },
  { id: 'tours',     icon: 'tours',     label: 'Tours &\nAttractions' },
  { id: 'visa',      icon: 'visa',      label: 'Visa' },
  { id: 'cruise',    icon: 'cruise',    label: 'Cruise', isNew: true },
  { id: 'forex',     icon: 'forex',     label: 'Forex Card\n& Currency' },
  { id: 'insurance', icon: 'insurance', label: 'Travel\nInsurance' },
]

// ─── Special Fares Data ───────────────────────────────────────────────────────
export const SPECIAL_FARES = [
  { id: 'regular', label: 'Regular',           sub: 'Regular fares' },
  { id: 'student', label: 'Student',            sub: 'Extra discounts/baggage' },
  { id: 'armed',   label: 'Armed Forces',       sub: 'Up to ₹ 600 off' },
  { id: 'gst',     label: 'Have a GST number?', sub: 'Upto 10% Extra Savings!', isNew: true },
  { id: 'senior',  label: 'Senior Citizen',     sub: 'Up to ₹ 600 off' },
  { id: 'doctor',  label: 'Doctor and Nurses',  sub: 'Up to ₹ 600 off' },
]

// ─── Quick Links Data ─────────────────────────────────────────────────────────
export const QUICK_LINKS = [
  { icon: '🌍', title: 'Where2Go',                     sub: 'Explore top destinations' },
  { icon: '🧭', title: 'How2Go',                        sub: 'Find routes to anywhere', isNew: true },
  { icon: '💳', title: 'MMT ICICI Credit Card',  sub: 'Never-expiring rewards & big benefits' },
  { icon: '🤝', title: 'MICE Services',                 sub: 'Offsites, Corporate Events & Meetings' },
  { icon: '🎁', title: 'Gift Cards',                    sub: 'Spread joy of travel' },
]

// ─── Offers Categories & Tabs ────────────────────────────────────────────────
export const OFFER_TABS = [
  'All Offers',
  'Bank Offers',
  'Flights',
  'Hotels',
  'Holidays',
  'Trains',
  'Cabs',
  'Bus',
  'Forex'
]

// ─── Offers Data ─────────────────────────────────────────────────────────────
export const OFFERS = [
  {
    cat: 'DOM FLIGHTS',
    icon: '✈',
    color: 'linear-gradient(140deg, #1a6ef8 0%, #00c4e0 100%)',
    title: 'Flat 25% off on domestic flights',
    desc: 'Save up to ₹3,000 on bookings made with HDFC credit cards.',
    cta: 'BOOK NOW',
    img: photo('flight-airplane'),
  },
  {
    cat: 'DOM HOTELS',
    icon: '🏨',
    color: 'linear-gradient(140deg, #f97316 0%, #ef4444 100%)',
    title: "Discover India's finest luxury stays",
    desc: 'Explore MMT Luxe Selections — curated stays with signature amenities.',
    cta: 'VIEW DEALS',
    img: photo('hotel-luxury-exterior'),
  },
  {
    cat: 'LUXURY',
    icon: '⭐',
    color: 'linear-gradient(140deg, #111827 0%, #1e3a5f 100%)',
    title: 'Exclusive Business Class fares',
    desc: 'Up to ₹15,000 OFF on international business class bookings.',
    cta: 'EXPLORE',
    img: photo('hotel-rooftop'),
  },
  {
    cat: 'HOLIDAYS',
    icon: '🌴',
    color: 'linear-gradient(140deg, #059669 0%, #10b981 100%)',
    title: 'Summer holiday packages from ₹8,999',
    desc: 'All-inclusive beach & mountain packages with flights + hotel + meals.',
    cta: 'BOOK NOW',
    img: photo('dest-goa'),
  },
  {
    cat: 'CABS',
    icon: '🚖',
    color: 'linear-gradient(140deg, #7c3aed 0%, #a855f7 100%)',
    title: 'Summer-special: Fixed fares on outstation cabs',
    desc: 'Also, enjoy up to ₹1,000 OFF on your outstation cab booking.',
    cta: 'BOOK NOW',
    img: photo('cab-taxi'),
  },
  {
    cat: 'BUS',
    icon: '🚌',
    color: 'linear-gradient(140deg, #0891b2 0%, #06b6d4 100%)',
    title: '10% off on summer bus tickets',
    desc: 'Flat ₹50 off on every ride. Offer valid for limited period.',
    cta: 'BOOK NOW',
    img: photo('bus-luxury'),
  },
  {
    cat: 'TRAINS',
    icon: '🚆',
    color: 'linear-gradient(140deg, #d97706 0%, #f59e0b 100%)',
    title: 'Book train tickets & save big',
    desc: 'Get ₹200 instant cashback on first train booking with MMT Pay.',
    cta: 'BOOK NOW',
    img: photo('train-modern'),
  },
  {
    cat: 'BANK OFFERS',
    icon: '💳',
    color: 'linear-gradient(140deg, #4f46e5 0%, #7c3aed 100%)',
    title: 'SBI card: flat ₹2,000 off on flights',
    desc: 'Use code MMTSBI at checkout. Valid on round-trip bookings above ₹8,000.',
    cta: 'GRAB OFFER',
    img: photo('flight-jetbridge'),
  },
]

// ─── Airlines Partners Data ──────────────────────────────────────────────────
export const AIRLINES = [
  { name: 'Air India',         color: '#c41e3a', img: photo('flight-airplane') },
  { name: 'Etihad Airways',    color: '#b8973a', img: photo('flight-runway') },
  { name: 'Malaysia Airlines', color: '#003087', img: photo('flight-cabin') },
]

// ─── Hotel Brands Data ───────────────────────────────────────────────────────
export const HOTEL_BRANDS = [
  { name: 'ITC Hotels Limited',           color: '#8B6914', img: photo('hotel-luxury-exterior') },
  { name: 'Sterling Hotels & Resorts',    color: '#1565C0', img: photo('hotel-resort') },
  { name: 'CGH Earth Experience Hotels', color: '#2E7D32', img: photo('hotel-pool') },
  { name: 'Royal Orchid Hotels',          color: '#6A1B9A', img: photo('hotel-lobby') },
]

// ─── Destination Collections Data ────────────────────────────────────────────
export const COLLECTIONS = [
  { rank: 'TOP 8',  title: 'Stays In & Around Delhi for a Weekend Getaway',     sub: 'Delhi NCR',    img: photo('dest-delhi') },
  { rank: 'TOP 8',  title: 'Stays In & Around Mumbai for a Weekend',             sub: 'Mumbai',       img: photo('dest-mumbai') },
  { rank: 'TOP 9',  title: 'Stays In & Around Bangalore for a Weekend Getaway', sub: 'Bengaluru',    img: photo('dest-bengaluru') },
  { rank: 'TOP 11', title: 'Beach Destinations',                                  sub: 'Goa & More',   img: photo('dest-goa') },
  { rank: 'TOP 11', title: 'Weekend Getaways',                                    sub: 'Quick Escapes', img: photo('dest-hills') },
  { rank: 'TOP 11', title: 'Hill Station Escapes',                                sub: 'Mountains',    img: photo('dest-shimla') },
]

// ─── Lesser-Known Wonders Data ───────────────────────────────────────────────
export const WONDERS = [
  { title: "Shimla's Best Kept Secret",              sub: 'Himachal Pradesh',  img: photo('dest-shimla') },
  { title: "Tamil Nadu's Charming Hill Town",        sub: 'Ooty & Kodaikanal', img: photo('dest-ooty') },
  { title: 'Picturesque Gateway to Himalayas',       sub: 'Manali & Kasol',   img: photo('dest-manali') },
  { title: 'Quaint Little Hill Station in Gujarat',  sub: 'Saputara',         img: photo('dest-saputara') },
  { title: 'A pleasant summer retreat & snowy winter wonderland!', sub: 'Auli, Uttarakhand', img: photo('dest-auli') },
  { title: 'Seaside Magic of West Bengal',           sub: 'Mandarmani',       img: photo('dest-mandarmani') },
]

// ─── Information Cards Data ──────────────────────────────────────────────────
export const INFO_CARDS = [
  { icon: '📊', title: 'Check out our Indian Travel Trends Report', desc: "Our trends report is live! Read on for top travel insights.", link: 'Read More' },
  { icon: '🍛', title: 'Finding Indian Food just got easier!',      desc: 'Like newly launched filters for exploring International travel', link: 'Know More' },
  { icon: '✈️', title: 'Planning to book an International flight?', desc: 'Check our comprehensive Travel Guidelines before you fly.', link: 'Check Now' },
]

// ─── SEO Text Block Data ─────────────────────────────────────────────────────
export const SEO_SECTIONS = [
  {
    title: 'Why MakeMyTrip?',
    content: 'Established in 2000, MakeMyTrip has since positioned itself as one of the leading online travel companies in India. Providing great offers, competitive airfares, exclusive discounts, and a seamless online booking experience to many of its customers. Over the years, MakeMyTrip has revolutionized the Indian travel industry by introducing innovative, user-friendly booking technologies and building an extensive network of flights, hotels, and holiday partners. Whether you are planning a domestic weekend getaway or a long international holiday, MakeMyTrip makes trip planning simpler and more affordable.'
  },
  {
    title: 'Booking Flights with MakeMyTrip',
    content: 'At MakeMyTrip, you can find low-cost air tickets for all major airlines operating globally. We bring you real-time seat availability, flight status tracking, multi-city route options, and unique features like Zero Cancellation and Instant Refunds. With our smart calendar tool, you can compare flight prices across different dates to locate the cheapest flights easily. Enjoy extra benefits such as extra baggage allowances, meal selections, and special student or senior citizen discount fares to secure maximum value on every booking.'
  },
  {
    title: 'Domestic Flights with MakeMyTrip',
    content: 'MakeMyTrip connects you to over 100 domestic destinations within India, covering both busy metros and offbeat regions. Book direct or connection flights with IndiGo, Air India, SpiceJet, Akasa Air, and more. From popular tourist corridors like Delhi to Goa or Mumbai to Bengaluru, to lesser-known local travel routes, find flights with detailed itinerary options. You can easily sort and filter flights by departure timings, layovers, duration, prices, and carrier preferences for a tailored travel planning experience.'
  }
]
