// ─── High-quality Unsplash Image Helpers ─────────────────────────────────────
const img = (id, w = 800, h = 500) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`

// ─── Service Tabs Data ────────────────────────────────────────────────────────
export const SERVICE_TABS = [
  { id: 'flights',   icon: '✈️',  label: 'Flights' },
  { id: 'hotels',    icon: '🏨',  label: 'Hotels' },
  { id: 'villas',    icon: '🏡',  label: 'Villas &\nHomestays' },
  { id: 'holidays',  icon: '🧳',  label: 'Holiday\nPackages' },
  { id: 'trains',    icon: '🚆',  label: 'Trains' },
  { id: 'buses',     icon: '🚌',  label: 'Buses' },
  { id: 'cabs',      icon: '🚖',  label: 'Cabs' },
  { id: 'tours',     icon: '🎡',  label: 'Tours &\nAttractions' },
  { id: 'visa',      icon: '🛂',  label: 'Visa' },
  { id: 'cruise',    icon: '🚢',  label: 'Cruise', isNew: true },
  { id: 'forex',     icon: '💳',  label: 'Forex Card\n& Currency' },
  { id: 'insurance', icon: '🛡️', label: 'Travel\nInsurance' },
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
    img: img('1436491865332-7a61a109cc05', 260, 200),
  },
  {
    cat: 'DOM HOTELS',
    icon: '🏨',
    color: 'linear-gradient(140deg, #f97316 0%, #ef4444 100%)',
    title: "Discover India's finest luxury stays",
    desc: 'Explore MMT Luxe Selections — curated stays with signature amenities.',
    cta: 'VIEW DEALS',
    img: img('1566073771259-1b7e4634a69b', 260, 200),
  },
  {
    cat: 'LUXURY',
    icon: '⭐',
    color: 'linear-gradient(140deg, #111827 0%, #1e3a5f 100%)',
    title: 'Exclusive Business Class fares',
    desc: 'Up to ₹15,000 OFF on international business class bookings.',
    cta: 'EXPLORE',
    img: img('1529070538774-1843cb3265df', 260, 200),
  },
  {
    cat: 'HOLIDAYS',
    icon: '🌴',
    color: 'linear-gradient(140deg, #059669 0%, #10b981 100%)',
    title: 'Summer holiday packages from ₹8,999',
    desc: 'All-inclusive beach & mountain packages with flights + hotel + meals.',
    cta: 'BOOK NOW',
    img: img('1507525428034-b723cf961d3e', 260, 200),
  },
  {
    cat: 'CABS',
    icon: '🚖',
    color: 'linear-gradient(140deg, #7c3aed 0%, #a855f7 100%)',
    title: 'Summer-special: Fixed fares on outstation cabs',
    desc: 'Also, enjoy up to ₹1,000 OFF on your outstation cab booking.',
    cta: 'BOOK NOW',
    img: img('1503376780353-7e6692767b70', 260, 200),
  },
  {
    cat: 'BUS',
    icon: '🚌',
    color: 'linear-gradient(140deg, #0891b2 0%, #06b6d4 100%)',
    title: '10% off on summer bus tickets',
    desc: 'Flat ₹50 off on every ride. Offer valid for limited period.',
    cta: 'BOOK NOW',
    img: img('1544620347-c4fd4a3d5957', 260, 200),
  },
  {
    cat: 'TRAINS',
    icon: '🚆',
    color: 'linear-gradient(140deg, #d97706 0%, #f59e0b 100%)',
    title: 'Book train tickets & save big',
    desc: 'Get ₹200 instant cashback on first train booking with MMT Pay.',
    cta: 'BOOK NOW',
    img: img('1501785888041-af3ef285b470', 260, 200),
  },
  {
    cat: 'BANK OFFERS',
    icon: '💳',
    color: 'linear-gradient(140deg, #4f46e5 0%, #7c3aed 100%)',
    title: 'SBI card: flat ₹2,000 off on flights',
    desc: 'Use code MMTSBI at checkout. Valid on round-trip bookings above ₹8,000.',
    cta: 'GRAB OFFER',
    img: img('1529253355930-ddbe423a2ac7', 260, 200),
  },
]

// ─── Airlines Partners Data ──────────────────────────────────────────────────
export const AIRLINES = [
  { name: 'Air India',         color: '#c41e3a', img: img('1436491865332-7a61a109cc05', 600, 300) },
  { name: 'Etihad Airways',    color: '#b8973a', img: img('1544735716-392fe2489ffa', 600, 300) },
  { name: 'Malaysia Airlines', color: '#003087', img: img('1569629743817-70d8db6c323b', 600, 300) },
]

// ─── Hotel Brands Data ───────────────────────────────────────────────────────
export const HOTEL_BRANDS = [
  { name: 'ITC Hotels Limited',           color: '#8B6914', img: img('1520250497591-112f2f40a3f4', 400, 250) },
  { name: 'Sterling Hotels & Resorts',    color: '#1565C0', img: img('1582719478250-c89cae4dc85b', 400, 250) },
  { name: 'CGH Earth Experience Hotels', color: '#2E7D32', img: img('1571896349842-33c89424de2d', 400, 250) },
  { name: 'Royal Orchid Hotels',          color: '#6A1B9A', img: img('1542314831-068cd1dbfeeb', 400, 250) },
]

// ─── Destination Collections Data ────────────────────────────────────────────
export const COLLECTIONS = [
  { rank: 'TOP 8',  title: 'Stays In & Around Delhi for a Weekend Getaway',     sub: 'Delhi NCR',    img: img('1520250497591-112f2f40a3f4', 300, 220) },
  { rank: 'TOP 8',  title: 'Stays In & Around Mumbai for a Weekend',             sub: 'Mumbai',       img: img('1529253355930-ddbe423a2ac7', 300, 220) },
  { rank: 'TOP 9',  title: 'Stays In & Around Bangalore for a Weekend Getaway', sub: 'Bengaluru',    img: img('1542314831-068cd1dbfeeb', 300, 220) },
  { rank: 'TOP 11', title: 'Beach Destinations',                                  sub: 'Goa & More',   img: img('1507525428034-b723cf961d3e', 300, 220) },
  { rank: 'TOP 11', title: 'Weekend Getaways',                                    sub: 'Quick Escapes', img: img('1501854140801-50d01698950b', 300, 220) },
  { rank: 'TOP 11', title: 'Hill Station Escapes',                                sub: 'Mountains',    img: img('1464822759023-fed622ff2c3b', 300, 220) },
]

// ─── Lesser-Known Wonders Data ───────────────────────────────────────────────
export const WONDERS = [
  { title: "Shimla's Best Kept Secret",              sub: 'Himachal Pradesh',  img: img('1506905925346-21bda4d32df4', 300, 220) },
  { title: "Tamil Nadu's Charming Hill Town",        sub: 'Ooty & Kodaikanal', img: img('1543731068-7e0f5beff43a', 300, 220) },
  { title: 'Picturesque Gateway to Himalayas',       sub: 'Manali & Kasol',   img: img('1454496522488-7a8e488e8606', 300, 220) },
  { title: 'Quaint Little Hill Station in Gujarat',  sub: 'Saputara',         img: img('1501785888041-af3ef285b470', 300, 220) },
  { title: 'A pleasant summer retreat & snowy winter wonderland!', sub: 'Auli, Uttarakhand', img: img('1482862549707-f63cb32c5fd9', 300, 220) },
  { title: 'Seaside Magic of West Bengal',           sub: 'Mandarmani',       img: img('1507525428034-b723cf961d3e', 300, 220) },
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
