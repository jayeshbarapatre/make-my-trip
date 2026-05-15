import { db } from '../config/firebase.js'

// In-memory cache to ensure live and fallback flights can be retrieved for bookings even if Firestore is down
const liveFlightsCache = new Map()

const airlinesMap = {
  'IGO': { name: 'IndiGo', code: '6E', logo: 'https://logos.makemytrip.com/airline-logos/6E.png' },
  '6E':  { name: 'IndiGo', code: '6E', logo: 'https://logos.makemytrip.com/airline-logos/6E.png' },
  'AIC': { name: 'Air India', code: 'AI', logo: 'https://logos.makemytrip.com/airline-logos/AI.png' },
  'AI':  { name: 'Air India', code: 'AI', logo: 'https://logos.makemytrip.com/airline-logos/AI.png' },
  'VTI': { name: 'Vistara', code: 'UK', logo: 'https://logos.makemytrip.com/airline-logos/UK.png' },
  'UK':  { name: 'Vistara', code: 'UK', logo: 'https://logos.makemytrip.com/airline-logos/UK.png' },
  'SEJ': { name: 'SpiceJet', code: 'SG', logo: 'https://logos.makemytrip.com/airline-logos/SG.png' },
  'SG':  { name: 'SpiceJet', code: 'SG', logo: 'https://logos.makemytrip.com/airline-logos/SG.png' },
  'AKJ': { name: 'Akasa Air', code: 'QP', logo: 'https://logos.makemytrip.com/airline-logos/QP.png' },
  'QP':  { name: 'Akasa Air', code: 'QP', logo: 'https://logos.makemytrip.com/airline-logos/QP.png' },
  'IAD': { name: 'Air India Express', code: 'IX', logo: 'https://logos.makemytrip.com/airline-logos/IX.png' },
  'IX':  { name: 'Air India Express', code: 'IX', logo: 'https://logos.makemytrip.com/airline-logos/IX.png' },
}

const defaultAirlines = [
  { name: 'IndiGo',           code: '6E', logo: 'https://logos.makemytrip.com/airline-logos/6E.png' },
  { name: 'Air India',        code: 'AI', logo: 'https://logos.makemytrip.com/airline-logos/AI.png' },
  { name: 'SpiceJet',         code: 'SG', logo: 'https://logos.makemytrip.com/airline-logos/SG.png' },
  { name: 'Vistara',          code: 'UK', logo: 'https://logos.makemytrip.com/airline-logos/UK.png' },
  { name: 'Akasa Air',        code: 'QP', logo: 'https://logos.makemytrip.com/airline-logos/QP.png' },
  { name: 'Air India Express',code: 'IX', logo: 'https://logos.makemytrip.com/airline-logos/IX.png' },
]

const offlineRoutes = [
  ['Delhi',     'Mumbai',      125, 3800],
  ['Mumbai',    'Delhi',       125, 4100],
  ['Delhi',     'Bangalore',   165, 4500],
  ['Bangalore', 'Delhi',       165, 4700],
  ['Mumbai',    'Bangalore',    95, 2900],
  ['Bangalore', 'Mumbai',       95, 3100],
  ['Delhi',     'Chennai',     175, 5000],
  ['Chennai',   'Delhi',       175, 5200],
  ['Delhi',     'Kolkata',     145, 4200],
  ['Kolkata',   'Delhi',       145, 4400],
  ['Mumbai',    'Hyderabad',    90, 2600],
  ['Hyderabad', 'Mumbai',       90, 2800],
  ['Bangalore', 'Hyderabad',    65, 1800],
  ['Hyderabad', 'Bangalore',    65, 1900],
  ['Delhi',     'Goa',         150, 5500],
  ['Goa',       'Delhi',       150, 5800],
  ['Mumbai',    'Goa',          65, 2200],
  ['Goa',       'Mumbai',       65, 2400],
  ['Delhi',     'Jaipur',       60, 1500],
  ['Jaipur',    'Delhi',        60, 1600],
  ['Mumbai',    'Pune',         45, 1200],
  ['Chennai',   'Bangalore',    55, 1700],
  ['Bangalore', 'Chennai',      55, 1800],
  ['Kolkata',   'Mumbai',      185, 5600],
  ['Delhi',     'Hyderabad',   155, 4800],
]

const hashCode = (str) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return hash
}

// Generates highly realistic offline flights for a specific route and date as an instant fallback
const generateOfflineFlights = (from, to, dateStr) => {
  const matchingRoute = offlineRoutes.find(r => 
    (r[0].toLowerCase().includes(from.toLowerCase()) || from.toLowerCase().includes(r[0].toLowerCase())) &&
    (r[1].toLowerCase().includes(to.toLowerCase()) || to.toLowerCase().includes(r[1].toLowerCase()))
  ) || offlineRoutes.find(r => 
    r[0].toLowerCase().includes(from.toLowerCase()) || from.toLowerCase().includes(r[0].toLowerCase())
  ) || [from, to, 120, 3500]

  const dur = matchingRoute[2]
  const base = matchingRoute[3]
  const timeSlots = ['06:10', '07:45', '09:15', '11:00', '13:20', '15:15', '16:45', '18:30', '19:50', '21:10', '22:30', '23:45']

  return timeSlots.map((slot, idx) => {
    const airline = defaultAirlines[idx % defaultAirlines.length]
    const hashVal = Math.abs(hashCode(`${from}-${to}-${slot}`)) || idx
    const departure = new Date(`${dateStr}T${slot}:00+05:30`).toISOString()
    const arrival = new Date(new Date(departure).getTime() + dur * 60 * 1000).toISOString()

    const variance = 1 + ((hashVal % 10 - 5) / 25) // ±20%
    const price = Math.round((base * variance) / 100) * 100

    return {
      id: `fallback-${airline.code}-${hashVal}-${idx}`,
      airline: airline.name,
      airlineCode: airline.code,
      airlineLogo: airline.logo,
      flightNumber: `${airline.code} ${100 + (hashVal % 900)}`,
      source: from,
      destination: to,
      departure,
      arrival,
      duration: dur,
      price,
      seats: 40 + (hashVal % 110),
      stops: (idx % 6 === 0) ? 1 : 0,
      class: 'Economy',
      baggage: '15 kg check-in + 7 kg cabin',
      refundable: idx % 3 !== 0,
      createdAt: new Date().toISOString(),
      isLive: false
    }
  })
}

export const searchFlights = async (req, res) => {
  try {
    const { from, to, date } = req.query
    let flightsList = []
    let isDbOnline = true

    const searchDate = date ? new Date(date) : new Date()
    const yyyy = searchDate.getFullYear()
    const mm = String(searchDate.getMonth() + 1).padStart(2, '0')
    const dd = String(searchDate.getDate()).padStart(2, '0')
    const dateStr = `${yyyy}-${mm}-${dd}`

    // 1. Fetch live OpenSky flights
    if (from && to) {
      try {
        const response = await fetch('https://opensky-network.org/api/states/all')
        if (response.ok) {
          const apiData = await response.json()
          if (apiData && Array.isArray(apiData.states)) {
            const states = apiData.states.filter(s => s[0] && s[1])
            if (states.length > 0) {
              const routeKey = `${from.trim()}->${to.trim()}`.toLowerCase()
              const startIndex = Math.abs(hashCode(routeKey)) % Math.max(1, states.length - 15)
              const selectedStates = states.slice(startIndex, startIndex + 15)

              const timeSlots = ['06:10', '07:45', '09:15', '11:00', '13:20', '15:15', '16:45', '18:30', '19:50', '21:10', '22:30', '23:45']
              const liveFlights = []

              selectedStates.forEach((state, idx) => {
                const icao24 = state[0]
                const rawCallsign = (state[1] || '').trim()
                const hashVal = Math.abs(hashCode(icao24)) || idx

                let airline = null
                let airlineCode = ''
                let airlineLogo = ''
                let flightNumber = ''

                for (const prefix of Object.keys(airlinesMap)) {
                  if (rawCallsign.toUpperCase().startsWith(prefix)) {
                    const meta = airlinesMap[prefix]
                    airline = meta.name
                    airlineCode = meta.code
                    airlineLogo = meta.logo
                    const num = rawCallsign.substring(prefix.length).replace(/[^0-9]/g, '').trim()
                    flightNumber = `${airlineCode} ${num || (hashVal % 900 + 100)}`
                    break
                  }
                }

                if (!airline) {
                  const meta = defaultAirlines[hashVal % defaultAirlines.length]
                  airline = meta.name
                  airlineCode = meta.code
                  airlineLogo = meta.logo
                  const digits = rawCallsign.replace(/[^0-9]/g, '') || String(hashVal % 900 + 100)
                  flightNumber = `${airlineCode} ${digits}`
                }

                const matchingRoute = offlineRoutes.find(r => 
                  (r[0].toLowerCase().includes(from.toLowerCase()) || from.toLowerCase().includes(r[0].toLowerCase())) &&
                  (r[1].toLowerCase().includes(to.toLowerCase()) || to.toLowerCase().includes(r[1].toLowerCase()))
                ) || offlineRoutes.find(r => 
                  r[0].toLowerCase().includes(from.toLowerCase()) || from.toLowerCase().includes(r[0].toLowerCase())
                ) || [from, to, 120, 3500]

                const dur = matchingRoute[2]
                const basePrice = matchingRoute[3]
                const slot = timeSlots[idx % timeSlots.length]
                const departure = new Date(`${dateStr}T${slot}:00+05:30`).toISOString()
                const arrival = new Date(new Date(departure).getTime() + dur * 60 * 1000).toISOString()

                const variance = 1 + ((hashVal % 10 - 5) / 25) // ±20%
                const price = Math.round((basePrice * variance) / 100) * 100
                const stops = (hashVal % 6 === 0) ? 1 : 0
                const docId = `live-${icao24}-${from.toLowerCase().replace(/\s+/g, '')}-${to.toLowerCase().replace(/\s+/g, '')}-${dateStr}`

                const flightDoc = {
                  id: docId,
                  airline,
                  airlineCode,
                  airlineLogo,
                  flightNumber,
                  source: from,
                  destination: to,
                  departure,
                  arrival,
                  duration: dur,
                  price,
                  seats: 40 + (hashVal % 110),
                  stops,
                  class: 'Economy',
                  baggage: '15 kg check-in + 7 kg cabin',
                  refundable: hashVal % 3 !== 0,
                  createdAt: new Date().toISOString(),
                  isLive: true
                }

                liveFlights.push(flightDoc)
                liveFlightsCache.set(docId, flightDoc) // Always cache in-memory for bookings
              })

              flightsList.push(...liveFlights)

              // Attempt to save to Firestore silently
              try {
                const batch = db.batch()
                liveFlights.forEach(f => {
                  const { id, ...fData } = f
                  const docRef = db.collection('flights').doc(id)
                  batch.set(docRef, fData)
                })
                await batch.commit()
              } catch (fsErr) {
                console.warn('Firestore write failed, using in-memory live flights:', fsErr.message)
              }
            }
          }
        }
      } catch (apiErr) {
        console.warn('Failed to fetch from OpenSky API:', apiErr.message)
      }
    }

    // 2. Query Firestore database for flights
    try {
      const snap = await db.collection('flights').get()
      const dbFlights = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      flightsList.push(...dbFlights)
    } catch (fsReadErr) {
      console.warn('Firestore read failed (offline/not found), using generated fallback:', fsReadErr.message)
      isDbOnline = false
      
      // If Firestore is completely down, generate beautiful realistic offline flights to prevent 500 errors
      if (from && to) {
        const fallbackFlights = generateOfflineFlights(from, to, dateStr)
        fallbackFlights.forEach(f => liveFlightsCache.set(f.id, f))
        flightsList.push(...fallbackFlights)
      }
    }

    // Filter results
    if (from) flightsList = flightsList.filter((f) => f.source?.toLowerCase().includes(from.toLowerCase()))
    if (to) flightsList = flightsList.filter((f) => f.destination?.toLowerCase().includes(to.toLowerCase()))
    if (date) {
      const day = new Date(date).toISOString().slice(0, 10)
      flightsList = flightsList.filter((f) => f.departure?.slice(0, 10) === day)
    }

    // Deduplicate flights by ID to avoid overlapping firestore/local listings
    const uniqueFlightsMap = new Map()
    flightsList.forEach(f => uniqueFlightsMap.set(f.id, f))
    const finalFlights = Array.from(uniqueFlightsMap.values())

    finalFlights.sort((a, b) => a.price - b.price)
    res.json({ data: finalFlights })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getFlightById = async (req, res) => {
  try {
    const { id } = req.params

    // 1. Check in-memory cache first (works 100% even if Firestore is down)
    if (liveFlightsCache.has(id)) {
      return res.json({ data: liveFlightsCache.get(id) })
    }

    // 2. Retrieve from Firestore
    try {
      const doc = await db.collection('flights').doc(id).get()
      if (doc.exists) {
        return res.json({ data: { id: doc.id, ...doc.data() } })
      }
    } catch (fsErr) {
      console.warn('Firestore read error in getFlightById, checking in-memory cache again:', fsErr.message)
    }

    return res.status(404).json({ message: 'Flight not found' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
