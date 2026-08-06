import { photo } from '../utils/images'

/**
 * Home page promotions, and the detail behind each one.
 *
 * These used to be two arrays declared inside HomePage.jsx with nothing but a
 * title, a blurb and a dead button. The card is an advert; a visitor clicking it
 * expects the offer, and there was nowhere for them to land.
 *
 * `action` is the important field: every offer ends in a real part of the site
 * (a search, a vertical landing page), so the detail page is a step towards
 * booking rather than a leaflet. `id` is the URL slug — keep them stable, they
 * are linkable.
 */
export const OFFERS = [
  {
    id: 'flat-25-domestic-flights',
    type: 'flight',
    tag: 'FLIGHTS',
    title: 'Flat 25% off domestic flights',
    desc: 'Save up to ₹3,000 on bookings made with HDFC credit cards. Code: MMTHDFC',
    cta: 'Book Now',
    image: photo('flight-airplane'),
    code: 'MMTHDFC',
    validity: 'Valid on departures up to 31 March',
    highlights: [
      'Up to 25% off the base fare, capped at ₹3,000 per booking',
      'Applies to every domestic route across all partner airlines',
      'Stacks with Student and Armed Forces special fares',
      'One redemption per card per calendar month'
    ],
    terms: [
      'Discount applies to the base fare only, not to taxes or the convenience fee.',
      'Payment must be made with an eligible HDFC credit card.',
      'Cancellation returns the fare per the airline policy; the discount is not refunded separately.',
      'Cannot be combined with another coupon on the same booking.'
    ],
    action: { label: 'Search flights', to: '/flights' }
  },
  {
    id: 'hotels-from-999',
    type: 'hotel',
    tag: 'HOTELS',
    title: 'Hotels at ₹999 per night',
    desc: 'Verified 3-star+ stays across 80 Indian cities. Free cancellation included.',
    cta: 'View Deals',
    image: photo('hotel-luxury-exterior'),
    validity: 'Limited rooms per property, per night',
    highlights: [
      'Every property rated 3 stars and above, with verified guest reviews',
      'Free cancellation up to 24 hours before check-in',
      'Pay at hotel available on selected properties',
      'Available in 80 cities'
    ],
    terms: [
      'The ₹999 rate is the lead-in price and depends on the city, the date and availability.',
      'Taxes and fees are shown separately at checkout.',
      'Free cancellation windows vary by property and are stated on the room before you pay.'
    ],
    action: { label: 'Browse hotels', to: '/hotels' }
  },
  {
    id: 'premium-escapes',
    type: 'luxury',
    tag: 'LUXURY',
    title: 'Premium escapes, up to 40% off',
    desc: 'Curated 5-star resorts in Maldives, Bali, and the Andamans for your dream getaway.',
    cta: 'Explore',
    image: photo('hotel-rooftop'),
    validity: 'Selected resorts, subject to availability',
    highlights: [
      'Hand-picked 5-star resorts and private villas',
      'Breakfast included at every property in the collection',
      'Complimentary airport transfer on stays of 3 nights or more',
      'Late checkout where the property allows it'
    ],
    terms: [
      'The 40% figure is the maximum across the collection; the discount varies by resort and date.',
      'Minimum stay requirements apply at some properties.',
      'Peak-season dates may be excluded.'
    ],
    action: { label: 'Browse stays', to: '/hotels' }
  },
  {
    id: 'goa-long-weekend',
    type: 'beach',
    tag: 'PACKAGES',
    title: 'Goa long weekend bundle',
    desc: 'Flights + hotel + airport transfer from ₹14,499 per person. 3N / 4D.',
    cta: 'Book Now',
    image: photo('dest-goa'),
    validity: '3 nights / 4 days',
    highlights: [
      'Return flights from your nearest metro',
      '3 nights at a 4-star beach property',
      'Airport transfers both ways',
      'Daily breakfast'
    ],
    terms: [
      'The lead-in price is per person on twin sharing.',
      'Flight timings are allocated at the time of booking and are not selectable.',
      'Package rates change with the departure city and the travel dates.'
    ],
    action: { label: 'Find hotels in Goa', to: '/hotels/results?city=Goa' }
  },
  {
    id: 'airport-cabs-200-off',
    type: 'cab',
    tag: 'CABS',
    title: 'Flat ₹200 off airport cabs',
    desc: 'Reliable airport transfers in 60+ cities. Pay only when you ride.',
    cta: 'Book Cab',
    image: photo('cab-taxi'),
    code: 'AIRPORT200',
    validity: 'Airport pickups and drops only',
    highlights: [
      'Flat ₹200 off every airport transfer',
      'Available in more than 60 cities',
      'Fare is fixed at booking — no surge, no meter',
      'Free waiting time of 45 minutes on airport pickups'
    ],
    terms: [
      'Valid on airport pickups and drops only, not on outstation or hourly rentals.',
      'The discount applies to the base fare before taxes.',
      'One redemption per user per day.'
    ],
    action: { label: 'Book a cab', to: '/cabs' }
  }
]

export const PICKS = [
  {
    id: 'kerala-spice-route',
    cls: 'hp-pick-1',
    eyebrow: "EDITOR'S PICK",
    tag: 'HOLIDAYS',
    title: 'Spice route through Kerala',
    desc: '10-day curated journey through tea plantations, backwaters, and coastal towns.',
    from: '₹42,999',
    image: photo('dest-kerala'),
    validity: '10 days / 9 nights',
    highlights: [
      'Munnar tea estates, Thekkady spice plantations and an Alleppey houseboat night',
      'Ends with three nights on the Kochi coast',
      'Private vehicle and driver throughout',
      'Small groups — maximum 12 travellers'
    ],
    terms: [
      'Lead-in price is per person on twin sharing and excludes flights.',
      'Departures are fixed-date; the itinerary is not customisable.',
      'Monsoon departures between June and August run at a reduced rate.'
    ],
    action: { label: 'Browse stays in Kerala', to: '/hotels/results?city=Kochi' }
  },
  {
    id: 'northeast-escapes',
    cls: 'hp-pick-2',
    eyebrow: 'NEW',
    tag: 'HOLIDAYS',
    title: 'Northeast escapes',
    desc: 'Tawang & Shillong · 6N',
    image: photo('dest-manali'),
    validity: '6 nights',
    highlights: [
      'Tawang monastery and the Sela Pass',
      'Shillong and the Cherrapunji living root bridges',
      'Inner Line Permit arranged for you',
      'Best between October and April'
    ],
    terms: [
      'Requires an Inner Line Permit for Arunachal Pradesh; processing takes up to five working days.',
      'Mountain roads can close at short notice in winter.'
    ],
    action: { label: 'Browse stays in Shillong', to: '/hotels/results?city=Shillong' }
  },
  {
    id: 'yoga-retreats',
    cls: 'hp-pick-3',
    eyebrow: 'WELLNESS',
    tag: 'WELLNESS',
    title: 'Yoga retreats',
    desc: 'Rishikesh & Pondicherry',
    image: photo('dest-rishikesh'),
    validity: 'Retreats run 5 to 14 nights',
    highlights: [
      'Daily ashtanga and hatha sessions with certified teachers',
      'All meals included, vegetarian',
      'Riverside accommodation in Rishikesh, beachside in Pondicherry',
      'Suitable for complete beginners'
    ],
    terms: [
      'Retreats have fixed start dates and a minimum stay.',
      'Not suitable during the Rishikesh monsoon between July and August.'
    ],
    action: { label: 'Browse stays in Rishikesh', to: '/hotels/results?city=Rishikesh' }
  },
  {
    id: 'royal-rajasthan',
    cls: 'hp-pick-4',
    eyebrow: 'LUXURY',
    tag: 'LUXURY',
    title: 'Royal Rajasthan',
    desc: 'Heritage palace stays',
    image: photo('dest-udaipur'),
    validity: 'Year round, best October to March',
    highlights: [
      'Converted palaces and havelis in Udaipur, Jaipur and Jodhpur',
      'Lake Pichola views on selected properties',
      'Private heritage walks with a local historian',
      'Airport transfers included'
    ],
    terms: [
      'Heritage properties have limited rooms; book well ahead for winter dates.',
      'Some palaces close selected wings for private events.'
    ],
    action: { label: 'Browse stays in Udaipur', to: '/hotels/results?city=Udaipur' }
  },
  {
    id: 'himalayan-treks',
    cls: 'hp-pick-5',
    eyebrow: 'ADVENTURE',
    tag: 'ADVENTURE',
    title: 'Himalayan treks',
    desc: 'Beginner to expert routes',
    image: photo('dest-ladakh'),
    validity: 'Season runs May to October',
    highlights: [
      'Graded routes from a 2-day beginner walk to a 12-day high pass crossing',
      'Certified mountain guides and a support team on every departure',
      'Tents, sleeping bags and cooking equipment provided',
      'Acclimatisation days built into every itinerary above 4,000m'
    ],
    terms: [
      'A medical declaration is required for routes above 4,000m.',
      'Itineraries can change on the mountain; the guide’s decision on weather is final.'
    ],
    action: { label: 'Browse stays in Leh', to: '/hotels/results?city=Leh' }
  }
]

/** Both lists share one detail page, so it looks the offer up across them. */
export const findPromotion = (id) =>
  OFFERS.find(o => o.id === id) || PICKS.find(p => p.id === id) || null
