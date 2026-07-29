// ─── Image Helper ─────────────────────────────────────────────────────────────
// Real photographs stored locally under public/images — see src/utils/images.js
import { photo } from '../utils/images'

// ─── Hotels Page Data ─────────────────────────────────────────────────────────
export const HOTELS_OFFERS = [
  {
    cat: 'HOTELS',
    title: "For Your Summer Trips: Get Up to 50% OFF*",
    desc: 'on Flights, Stays, Packages & More.',
    cta: 'BOOK NOW',
    img: photo('hotel-luxury-exterior'),
  },
  {
    cat: 'HOTELS',
    title: 'Catch 6-9 PM Drop Hour Deals',
    desc: 'with Vacation Ka Occasion Sale',
    cta: 'BOOK NOW',
    img: photo('hotel-room'),
  },
  {
    cat: 'HOTELS',
    title: 'DISCOVER LUXURY STAYS',
    desc: 'Explore MMT Luxe Selections for curated stays with signature amenities.',
    cta: 'BOOK NOW',
    img: photo('hotel-pool'),
  },
  {
    cat: 'HOTELS',
    title: 'A FERNTASTIC STAY AWAITS YOU',
    desc: 'Book a stay at select hotels & get complimentary breakfast.',
    cta: 'BOOK NOW',
    img: photo('hotel-lobby'),
  },
  {
    cat: 'HOTELS',
    title: 'Grab EPIC Discounts',
    desc: 'with select* stays, airlines & other partners',
    cta: 'BOOK NOW',
    img: photo('hotel-restaurant'),
  },
]

export const HOTELS_OFFER_TABS = ['Hotels', 'All Offers', 'Flights', 'Holidays', 'Trains', 'Cabs', 'Bank Offers']

export const POPULAR_HOTEL_DESTINATIONS = [
  { city: 'Goa', hotels: '1,543 Hotels', img: photo('dest-goa') },
  { city: 'Mumbai', hotels: '2,120 Hotels', img: photo('dest-mumbai') },
  { city: 'Delhi', hotels: '1,890 Hotels', img: photo('dest-delhi') },
  { city: 'Jaipur', hotels: '987 Hotels', img: photo('dest-jaipur') },
  { city: 'Manali', hotels: '456 Hotels', img: photo('dest-manali') },
  { city: 'Shimla', hotels: '312 Hotels', img: photo('dest-shimla') },
]

export const TOP_RATED_HOTELS = [
  {
    name: 'The Grand Hyatt',
    location: 'Mumbai',
    rating: '4.8',
    reviews: '2,143',
    price: '₹8,500',
    originalPrice: '₹14,000',
    discount: '39% off',
    img: photo('hotel-luxury-exterior'),
    amenities: ['Pool', 'Spa', 'Free Breakfast', 'Free WiFi'],
  },
  {
    name: 'Taj Lake Palace',
    location: 'Udaipur',
    rating: '4.9',
    reviews: '3,567',
    price: '₹22,000',
    originalPrice: '₹38,000',
    discount: '42% off',
    img: photo('dest-udaipur'),
    amenities: ['Pool', 'Restaurant', 'Spa', 'Free Breakfast'],
  },
  {
    name: 'Leela Palace',
    location: 'Bangalore',
    rating: '4.7',
    reviews: '1,892',
    price: '₹12,000',
    originalPrice: '₹20,000',
    discount: '40% off',
    img: photo('hotel-lobby'),
    amenities: ['Pool', 'Gym', 'Bar', 'Free WiFi'],
  },
]

// ─── Homestays Page Data ──────────────────────────────────────────────────────
export const HOMESTAY_TYPES = [
  { label: 'Farmstays', icon: '🌾', count: '1,234' },
  { label: 'Beach Cottages', icon: '🏖️', count: '876' },
  { label: 'Mountain Retreats', icon: '⛰️', count: '543' },
  { label: 'Riverside Villas', icon: '🏞️', count: '321' },
  { label: 'Heritage Havelis', icon: '🏯', count: '234' },
  { label: 'Treehouse Stays', icon: '🌳', count: '156' },
]

export const HOMESTAYS_FEATURED = [
  {
    name: 'The Misty Valley Cottage',
    location: 'Coorg, Karnataka',
    rating: '4.9',
    reviews: '342',
    price: '₹3,500',
    originalPrice: '₹5,000',
    img: photo('dest-ooty'),
    tags: ['Pet Friendly', 'Pool'],
  },
  {
    name: 'Sunrise Beach Villa',
    location: 'Gokarna, Karnataka',
    rating: '4.7',
    reviews: '218',
    price: '₹5,200',
    originalPrice: '₹7,500',
    img: photo('dest-goa'),
    tags: ['Beach Access', 'Kitchen'],
  },
  {
    name: 'Pine & Dine Farmstay',
    location: 'Kasauli, HP',
    rating: '4.8',
    reviews: '189',
    price: '₹2,800',
    originalPrice: '₹4,200',
    img: photo('dest-shimla'),
    tags: ['Organic Farm', 'Bonfire'],
  },
  {
    name: 'Heritage Haveli Retreat',
    location: 'Jaisalmer, Rajasthan',
    rating: '4.6',
    reviews: '156',
    price: '₹4,500',
    originalPrice: '₹7,000',
    img: photo('dest-jaipur'),
    tags: ['Heritage', 'Cultural Experience'],
  },
]

// ─── Holidays Page Data ───────────────────────────────────────────────────────
export const HOLIDAY_TABS = ['Search', 'Honeymoon', 'Visa Free Packages', 'Group Tour Packages', 'Disney Cruise', 'Last Minute Deals']

export const HOLIDAY_THEMES = [
  { label: 'Beach', icon: '🏖️', img: photo('dest-goa') },
  { label: 'Hill Stations', icon: '⛰️', img: photo('dest-manali') },
  { label: 'Wildlife', icon: '🦁', img: photo('dest-saputara') },
  { label: 'Heritage', icon: '🏯', img: photo('dest-jaipur') },
  { label: 'Adventure', icon: '🧗', img: photo('dest-ladakh') },
  { label: 'Pilgrimage', icon: '🕌', img: photo('dest-rishikesh') },
]

export const POPULAR_HOLIDAY_PACKAGES = [
  {
    destination: 'Bali',
    country: 'Indonesia',
    duration: '5N/6D',
    price: '₹32,000',
    rating: '4.7',
    reviews: '1,234',
    img: photo('dest-bali'),
    highlights: ['4-Star Hotel', 'Daily Breakfast', 'Airport Transfer'],
  },
  {
    destination: 'Maldives',
    country: 'Maldives',
    duration: '4N/5D',
    price: '₹65,000',
    rating: '4.9',
    reviews: '876',
    img: photo('dest-maldives'),
    highlights: ['Water Villa', 'All Inclusive', 'Snorkeling'],
  },
  {
    destination: 'Manali',
    country: 'Himachal Pradesh',
    duration: '5N/6D',
    price: '₹18,500',
    rating: '4.6',
    reviews: '2,341',
    img: photo('dest-manali'),
    highlights: ['3-Star Hotel', 'Sightseeing', 'Snow Activities'],
  },
  {
    destination: 'Kerala',
    country: 'God\'s Own Country',
    duration: '5N/6D',
    price: '₹25,000',
    rating: '4.8',
    reviews: '1,567',
    img: photo('dest-kerala'),
    highlights: ['Houseboat Stay', 'Spice Plantation Tour', 'Ayurvedic Spa'],
  },
]

// ─── Railways Page Data ───────────────────────────────────────────────────────
export const TRAIN_CLASSES = ['All Class', 'Sleeper', '3A', '2A', '1A', 'CC', 'EC']

export const POPULAR_TRAIN_ROUTES = [
  { from: 'Delhi', to: 'Mumbai', train: 'Rajdhani Express', duration: '15h 35m', price: '₹1,320' },
  { from: 'Kolkata', to: 'Chennai', train: 'Coromandel Express', duration: '26h 20m', price: '₹2,150' },
  { from: 'Delhi', to: 'Kolkata', train: 'Duronto Express', duration: '17h 05m', price: '₹1,680' },
  { from: 'Mumbai', to: 'Goa', train: 'Mandovi Express', duration: '11h 50m', price: '₹890' },
  { from: 'Bangalore', to: 'Mysore', train: 'Chamundi Express', duration: '2h 30m', price: '₹245' },
  { from: 'Delhi', to: 'Agra', train: 'Shatabdi Express', duration: '2h 00m', price: '₹535' },
]

export const TRAINS_OFFERS = [
  {
    cat: 'TRAINS',
    title: "For Your Summer Trip: Up to ₹500 OFF* on Alternate Trains",
    desc: 'on Trains.',
    code: 'MMTVACATION',
    cta: 'BOOK NOW',
    img: photo('train-modern'),
  },
  {
    cat: 'TRAINS',
    title: 'From 6-9 PM Daily: Up to ₹600 OFF* on Alternate Trains',
    desc: 'on Trains.',
    code: 'DROPDEALS',
    cta: 'BOOK NOW',
    img: photo('train-coach-premium'),
  },
  {
    cat: 'TRAINS',
    title: 'For Your Char Dham Journey: Up to 40% OFF*',
    desc: 'on stays, packages, buses, cabs, trains & flights.',
    code: '',
    cta: 'BOOK NOW',
    img: photo('train-station-india'),
  },
  {
    cat: 'TRAINS',
    title: 'For You: Up to ₹40 OFF* on Train Bookings.',
    desc: 'on Train Bookings.',
    code: '',
    cta: 'BOOK NOW',
    img: photo('train-platform'),
  },
]

export const TRAIN_OFFER_TABS = ['Trains', 'All Offers', 'Hotels', 'Flights', 'Holidays', 'Bus', 'Cabs']
