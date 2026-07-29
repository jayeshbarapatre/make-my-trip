// Local photo registry — every image is a real photograph downloaded from Unsplash
// and stored under public/images/. See PHOTO_CREDITS.md for full attribution.
// Generated asset set: WebP (primary) + JPG (fallback) at the widths listed per entry.

const BASE = '/images'

export const PHOTOS = {
  'hero-home': { dir: 'hero', w: [1920,1280,768], alt: 'Airplane wing above white clouds during daytime' },
  'hero-login': { dir: 'hero', w: [1920,1280,768], alt: 'Aerial view of green palms on a tropical seashore' },
  'phero-flights': { dir: 'hero', w: [1920,1280,768], alt: 'Commercial airplane landing on an airport runway' },
  'phero-hotels': { dir: 'hero', w: [1920,1280,768], alt: 'Beach resort overlooking the blue sea' },
  'phero-trains': { dir: 'hero', w: [1920,1280,768], alt: 'Modern high-speed bullet train at a station' },
  'phero-buses': { dir: 'hero', w: [1920,1280,768], alt: 'Long-distance coach bus on a mountain highway' },
  'phero-cabs': { dir: 'hero', w: [1920,1280,768], alt: 'Yellow taxi cab on a city road during daytime' },
  'phero-holidays': { dir: 'hero', w: [1920,1280,768], alt: 'Tropical seashore at golden hour' },
  'phero-homestays': { dir: 'hero', w: [1920,1280,768], alt: 'Modern villa living space' },
  'phero-cruise': { dir: 'hero', w: [1920,1280,768], alt: 'Aerial view of cruise ships docked on blue water' },
  'phero-forex': { dir: 'hero', w: [1920,1280,768], alt: 'Assorted foreign currency banknotes on a wooden table' },
  'phero-insurance': { dir: 'hero', w: [1920,1280,768], alt: 'Documents and paperwork on a desk' },
  'phero-tours': { dir: 'hero', w: [1920,1280,768], alt: 'Sightseeing landmark on a guided tour' },
  'phero-visa': { dir: 'hero', w: [1920,1280,768], alt: 'Passports laid out for international travel' },
  'flight-airplane': { dir: 'flights', w: [800,400], alt: 'White commercial airplane in mid air' },
  'flight-terminal': { dir: 'flights', w: [800,400], alt: 'Passengers walking through an airport terminal hallway' },
  'flight-boarding-gate': { dir: 'flights', w: [800,400], alt: 'Travellers walking to the boarding gate with luggage' },
  'flight-cabin': { dir: 'flights', w: [800,400], alt: 'Airline cabin interior with blue seats' },
  'flight-cabin-aisle': { dir: 'flights', w: [800,400], alt: 'View down the aisle of a commercial airplane cabin' },
  'flight-runway': { dir: 'flights', w: [800,400], alt: 'White airliner on the runway' },
  'flight-passenger': { dir: 'flights', w: [800,400], alt: 'Passenger waiting at the airport watching an airplane' },
  'flight-jetbridge': { dir: 'flights', w: [800,400], alt: 'Airplane parked at the terminal jet bridge' },
  'flight-terminal-window': { dir: 'flights', w: [800,400], alt: 'Sunset through the windows of an airport terminal' },
  'hotel-luxury-exterior': { dir: 'hotels', w: [800,400], alt: 'Luxury hotel building with an infinity pool' },
  'hotel-resort': { dir: 'hotels', w: [800,400], alt: 'Beach resort overlooking the blue sea' },
  'hotel-room': { dir: 'hotels', w: [800,400], alt: 'Hotel room with white bed linen and throw pillows' },
  'hotel-room-2': { dir: 'hotels', w: [800,400], alt: 'Neatly made hotel bed with white linen' },
  'hotel-room-3': { dir: 'hotels', w: [800,400], alt: 'Hotel bedroom with a wooden bed frame' },
  'hotel-suite': { dir: 'hotels', w: [800,400], alt: 'Hotel suite with a sectional sofa and bed' },
  'hotel-pool': { dir: 'hotels', w: [800,400], alt: 'Infinity pool at a luxury hotel' },
  'hotel-pool-2': { dir: 'hotels', w: [800,400], alt: 'Hotel pool with lounge chairs and umbrellas' },
  'hotel-lobby': { dir: 'hotels', w: [800,400], alt: 'Modern hotel lobby with designer furniture' },
  'hotel-reception': { dir: 'hotels', w: [800,400], alt: 'Hotel reception lounge with sofas and plants' },
  'hotel-restaurant': { dir: 'hotels', w: [800,400], alt: 'Hotel restaurant with wooden tables and chairs' },
  'hotel-restaurant-2': { dir: 'hotels', w: [800,400], alt: 'Hotel restaurant with a waterfront view' },
  'hotel-rooftop': { dir: 'hotels', w: [800,400], alt: 'Rooftop pool deck with loungers and palm trees' },
  'hotel-bathroom': { dir: 'hotels', w: [800,400], alt: 'Hotel suite seating area' },
  'train-modern': { dir: 'trains', w: [800,400], alt: 'Modern high-speed bullet train' },
  'train-station': { dir: 'trains', w: [800,400], alt: 'Red train at a railway station platform' },
  'train-station-india': { dir: 'trains', w: [800,400], alt: 'Train waiting alongside an Indian railway station platform' },
  'train-platform': { dir: 'trains', w: [800,400], alt: 'Passengers waiting on a railway platform' },
  'train-interior': { dir: 'trains', w: [800,400], alt: 'Train coach interior with red seats' },
  'train-coach-premium': { dir: 'trains', w: [800,400], alt: 'Premium train coach with a long row of seats' },
  'train-track': { dir: 'trains', w: [800,400], alt: 'Train on a steel railway track' },
  'bus-volvo': { dir: 'buses', w: [800,400], alt: 'Parked blue and black long-distance coach' },
  'bus-luxury': { dir: 'buses', w: [800,400], alt: 'Luxury coach bus on a mountain road' },
  'bus-coach': { dir: 'buses', w: [800,400], alt: 'Grey and black coach bus parked during daytime' },
  'bus-tour': { dir: 'buses', w: [800,400], alt: 'White and black intercity bus on the road during daytime' },
  'bus-interior': { dir: 'buses', w: [800,400], alt: 'Padded reclining bus seats' },
  'bus-interior-2': { dir: 'buses', w: [800,400], alt: 'Interior aisle of a passenger bus' },
  'bus-terminal': { dir: 'buses', w: [800,400], alt: 'Modern bus terminal with passengers' },
  'bus-passengers': { dir: 'buses', w: [800,400], alt: 'Passengers riding a long-distance bus during daytime' },
  'cab-sedan': { dir: 'cabs', w: [800,400], alt: 'Black sedan car' },
  'cab-sedan-2': { dir: 'cabs', w: [800,400], alt: 'Premium crossover car on the road during daytime' },
  'cab-suv': { dir: 'cabs', w: [800,400], alt: 'Parked white SUV' },
  'cab-suv-2': { dir: 'cabs', w: [800,400], alt: 'White SUV on a grey floor' },
  'cab-taxi': { dir: 'cabs', w: [800,400], alt: 'Yellow taxi cab on a city road' },
  'cab-taxi-night': { dir: 'cabs', w: [800,400], alt: 'Taxi cab on the road at night' },
  'cab-chauffeur': { dir: 'cabs', w: [800,400], alt: 'Chauffeur driving a car' },
  'cab-interior': { dir: 'cabs', w: [800,400], alt: 'Clean rear seats inside a car' },
  'dest-goa': { dir: 'destinations', w: [800,400], alt: 'Blue sea under a sunny sky in Goa' },
  'dest-jaipur': { dir: 'destinations', w: [800,400], alt: 'Hawa Mahal palace in Jaipur, India' },
  'dest-delhi': { dir: 'destinations', w: [800,400], alt: 'India Gate arch in Delhi under a blue sky' },
  'dest-mumbai': { dir: 'destinations', w: [800,400], alt: 'Sea bridge in Mumbai during golden hour' },
  'dest-udaipur': { dir: 'destinations', w: [800,400], alt: 'Boat on the lake beside a palace in Udaipur' },
  'dest-manali': { dir: 'destinations', w: [800,400], alt: 'Aerial view of a town near snow-covered mountains in Manali' },
  'dest-shimla': { dir: 'destinations', w: [800,400], alt: 'Hillside town of Shimla under a blue sky' },
  'dest-kerala': { dir: 'destinations', w: [800,400], alt: 'Houseboat on the Kerala backwaters' },
  'dest-kashmir': { dir: 'destinations', w: [800,400], alt: 'Wooden houseboat on a lake below snow-capped mountains in Kashmir' },
  'dest-dubai': { dir: 'destinations', w: [800,400], alt: 'Aerial view of a Dubai highway surrounded by high-rise buildings' },
  'dest-singapore': { dir: 'destinations', w: [800,400], alt: 'Marina Bay Sands in Singapore' },
  'dest-bali': { dir: 'destinations', w: [800,400], alt: 'Temple beside water and trees in Bali' },
  'dest-maldives': { dir: 'destinations', w: [800,400], alt: 'Aerial view of overwater resort villas in the Maldives' },
  'dest-thailand': { dir: 'destinations', w: [800,400], alt: 'Orange temples in Thailand during daytime' },
  'dest-ladakh': { dir: 'destinations', w: [800,400], alt: 'Lake surrounded by mountains in Ladakh' },
  'dest-rishikesh': { dir: 'destinations', w: [800,400], alt: 'Suspension bridge over the river at Rishikesh' },
  'dest-andaman': { dir: 'destinations', w: [800,400], alt: 'Palm trees on a white sand beach in the Andamans' },
  'dest-bengaluru': { dir: 'destinations', w: [800,400], alt: 'High-rise city buildings during daytime' },
  'dest-ooty': { dir: 'destinations', w: [800,400], alt: 'Green pine trees on a hillside during daytime' },
  'dest-auli': { dir: 'destinations', w: [800,400], alt: 'Snow-covered mountain during daytime' },
  'dest-saputara': { dir: 'destinations', w: [800,400], alt: 'River running through a lush green forest' },
  'dest-mandarmani': { dir: 'destinations', w: [800,400], alt: 'Beach with a fishing boat and trees' },
  'dest-northeast': { dir: 'destinations', w: [800,400], alt: 'Snowy field with trees and mountains' },
  'dest-hills': { dir: 'destinations', w: [800,400], alt: 'Hill town nestled in a mountain range' },
  'state-success': { dir: 'states', w: [800,400], alt: 'Passport and boarding pass resting on a travel bag' },
  'state-success-2': { dir: 'states', w: [800,400], alt: 'Traveller holding a passport beside an airplane window' },
  'state-empty-trips': { dir: 'states', w: [800,400], alt: 'Traveller reading the flight schedule board at an airport' },
  'state-error': { dir: 'states', w: [800,400], alt: 'Traveller walking through an airport concourse' },
  'state-no-results': { dir: 'states', w: [800,400], alt: 'Traveller holding passports and travel documents' },
}

const entry = (key) => PHOTOS[key] || PHOTOS['dest-goa']

export const photo = (key, width) => {
  const e = entry(key)
  const w = width && e.w.includes(width) ? width : e.w[0]
  return `${BASE}/${e.dir}/${key}-${w}.webp`
}

export const photoJpg = (key, width) => {
  const e = entry(key)
  const w = width && e.w.includes(width) ? width : e.w[0]
  return `${BASE}/${e.dir}/${key}-${w}.jpg`
}

export const photoSrcSet = (key, ext = 'webp') =>
  entry(key).w.map((w) => `${BASE}/${entry(key).dir}/${key}-${w}.${ext} ${w}w`).join(', ')

export const photoAlt = (key) => entry(key).alt

// Ready-to-spread props for a plain <img>: responsive, lazy, correctly described.
export const imgProps = (key, sizes = '100vw') => ({
  src: photoJpg(key),
  srcSet: photoSrcSet(key, 'jpg'),
  sizes,
  alt: photoAlt(key),
  loading: 'lazy',
  decoding: 'async',
})

// CSS background shorthand, e.g. style={{ backgroundImage: bg('dest-goa') }}
export const bg = (key, width) => `url(${photo(key, width)})`
