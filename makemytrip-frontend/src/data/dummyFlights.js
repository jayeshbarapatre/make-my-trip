const makeDateTime = (offsetDays, time, durationMinutes) => {
  const [hours, minutes] = time.split(':').map(Number)
  const departure = new Date()
  departure.setDate(departure.getDate() + offsetDays)
  departure.setHours(hours, minutes, 0, 0)
  const arrival = new Date(departure.getTime() + durationMinutes * 60000)
  return { departure: departure.toISOString(), arrival: arrival.toISOString() }
}

const createFlight = ({
  id, airline, airlineCode, flightNumber, source, destination,
  offsetDays, departureTime, duration, price, stops = 0, seats = 72, refundable = true,
}) => ({
  id, airline, airlineCode, flightNumber, source, destination,
  duration, price, stops, seats,
  class: 'Economy',
  baggage: '15 Kg',
  refundable,
  ...makeDateTime(offsetDays, departureTime, duration),
})

export const dummyFlights = [
  // ── Other routes ──────────────────────────────────────────────────────────
  createFlight({ id: 'demo-del-mum-6e-302', airline: 'IndiGo', airlineCode: '6E', flightNumber: '6E 302', source: 'Delhi', destination: 'Mumbai', offsetDays: 0, departureTime: '07:20', duration: 125, price: 3899, seats: 92 }),
  createFlight({ id: 'demo-mum-goa-sg-515', airline: 'SpiceJet', airlineCode: 'SG', flightNumber: 'SG 515', source: 'Mumbai', destination: 'Goa', offsetDays: 1, departureTime: '12:10', duration: 65, price: 2499, seats: 77 }),
  createFlight({ id: 'demo-blr-hyd-qp-620', airline: 'Akasa Air', airlineCode: 'QP', flightNumber: 'QP 620', source: 'Bengaluru', destination: 'Hyderabad', offsetDays: 1, departureTime: '15:35', duration: 65, price: 2199, seats: 70 }),
  createFlight({ id: 'demo-del-goa-ai-441', airline: 'Air India', airlineCode: 'AI', flightNumber: 'AI 441', source: 'Delhi', destination: 'Goa', offsetDays: 2, departureTime: '09:05', duration: 150, price: 5799, seats: 58, stops: 1 }),
  createFlight({ id: 'demo-kol-del-ix-730', airline: 'Air India Express', airlineCode: 'IX', flightNumber: 'IX 730', source: 'Kolkata', destination: 'Delhi', offsetDays: 2, departureTime: '20:40', duration: 145, price: 4399, seats: 81 }),

  // ── New Delhi → Bengaluru (23 flights) ────────────────────────────────────
  createFlight({ id: 'del-blr-sg-311', airline: 'SpiceJet', airlineCode: 'SG', flightNumber: 'SG 311', source: 'New Delhi', destination: 'Bengaluru', offsetDays: 0, departureTime: '06:00', duration: 170, price: 3499, stops: 0, seats: 92, refundable: false }),
  createFlight({ id: 'del-blr-ix-2401', airline: 'Air India Express', airlineCode: 'IX', flightNumber: 'IX 2401', source: 'New Delhi', destination: 'Bengaluru', offsetDays: 0, departureTime: '06:10', duration: 180, price: 4199, stops: 0, seats: 88, refundable: false }),
  createFlight({ id: 'del-blr-6e-101', airline: 'IndiGo', airlineCode: '6E', flightNumber: '6E 101', source: 'New Delhi', destination: 'Bengaluru', offsetDays: 0, departureTime: '06:15', duration: 165, price: 4599, stops: 0, seats: 86, refundable: false }),
  createFlight({ id: 'del-blr-qp-1201', airline: 'Akasa Air', airlineCode: 'QP', flightNumber: 'QP 1201', source: 'New Delhi', destination: 'Bengaluru', offsetDays: 0, departureTime: '07:00', duration: 170, price: 4299, stops: 0, seats: 70, refundable: false }),
  createFlight({ id: 'del-blr-uk-812', airline: 'Vistara', airlineCode: 'UK', flightNumber: 'UK 812', source: 'New Delhi', destination: 'Bengaluru', offsetDays: 0, departureTime: '07:30', duration: 170, price: 6199, stops: 0, seats: 48, refundable: true }),
  createFlight({ id: 'del-blr-6e-202', airline: 'IndiGo', airlineCode: '6E', flightNumber: '6E 202', source: 'New Delhi', destination: 'Bengaluru', offsetDays: 0, departureTime: '08:30', duration: 165, price: 5099, stops: 0, seats: 32, refundable: false }),
  createFlight({ id: 'del-blr-ai-203', airline: 'Air India', airlineCode: 'AI', flightNumber: 'AI 203', source: 'New Delhi', destination: 'Bengaluru', offsetDays: 0, departureTime: '09:15', duration: 175, price: 5499, stops: 0, seats: 64, refundable: true }),
  createFlight({ id: 'del-blr-6e-303', airline: 'IndiGo', airlineCode: '6E', flightNumber: '6E 303', source: 'New Delhi', destination: 'Bengaluru', offsetDays: 0, departureTime: '09:45', duration: 165, price: 4799, stops: 0, seats: 64, refundable: false }),
  createFlight({ id: 'del-blr-6e-404', airline: 'IndiGo', airlineCode: '6E', flightNumber: '6E 404', source: 'New Delhi', destination: 'Bengaluru', offsetDays: 0, departureTime: '10:50', duration: 165, price: 5299, stops: 0, seats: 18, refundable: false }),
  createFlight({ id: 'del-blr-uk-614', airline: 'Vistara', airlineCode: 'UK', flightNumber: 'UK 614', source: 'New Delhi', destination: 'Bengaluru', offsetDays: 0, departureTime: '11:15', duration: 170, price: 6799, stops: 0, seats: 36, refundable: true }),
  createFlight({ id: 'del-blr-ai-507', airline: 'Air India', airlineCode: 'AI', flightNumber: 'AI 507', source: 'New Delhi', destination: 'Bengaluru', offsetDays: 0, departureTime: '11:45', duration: 175, price: 6299, stops: 0, seats: 40, refundable: false }),
  createFlight({ id: 'del-blr-6e-505', airline: 'IndiGo', airlineCode: '6E', flightNumber: '6E 505', source: 'New Delhi', destination: 'Bengaluru', offsetDays: 0, departureTime: '12:20', duration: 165, price: 5799, stops: 0, seats: 72, refundable: false }),
  createFlight({ id: 'del-blr-sg-523', airline: 'SpiceJet', airlineCode: 'SG', flightNumber: 'SG 523', source: 'New Delhi', destination: 'Bengaluru', offsetDays: 0, departureTime: '13:15', duration: 330, price: 3999, stops: 1, seats: 78, refundable: false }),
  createFlight({ id: 'del-blr-6e-606', airline: 'IndiGo', airlineCode: '6E', flightNumber: '6E 606', source: 'New Delhi', destination: 'Bengaluru', offsetDays: 0, departureTime: '13:30', duration: 285, price: 4299, stops: 1, seats: 55, refundable: false }),
  createFlight({ id: 'del-blr-ai-815', airline: 'Air India', airlineCode: 'AI', flightNumber: 'AI 815', source: 'New Delhi', destination: 'Bengaluru', offsetDays: 0, departureTime: '14:00', duration: 210, price: 5799, stops: 1, seats: 58, refundable: true }),
  createFlight({ id: 'del-blr-6e-707', airline: 'IndiGo', airlineCode: '6E', flightNumber: '6E 707', source: 'New Delhi', destination: 'Bengaluru', offsetDays: 0, departureTime: '14:30', duration: 165, price: 6499, stops: 0, seats: 7, refundable: false }),
  createFlight({ id: 'del-blr-qp-1305', airline: 'Akasa Air', airlineCode: 'QP', flightNumber: 'QP 1305', source: 'New Delhi', destination: 'Bengaluru', offsetDays: 0, departureTime: '15:45', duration: 170, price: 5199, stops: 0, seats: 56, refundable: false }),
  createFlight({ id: 'del-blr-uk-416', airline: 'Vistara', airlineCode: 'UK', flightNumber: 'UK 416', source: 'New Delhi', destination: 'Bengaluru', offsetDays: 0, departureTime: '17:00', duration: 170, price: 8299, stops: 0, seats: 12, refundable: true }),
  createFlight({ id: 'del-blr-6e-808', airline: 'IndiGo', airlineCode: '6E', flightNumber: '6E 808', source: 'New Delhi', destination: 'Bengaluru', offsetDays: 0, departureTime: '17:45', duration: 165, price: 7299, stops: 0, seats: 48, refundable: false }),
  createFlight({ id: 'del-blr-6e-909', airline: 'IndiGo', airlineCode: '6E', flightNumber: '6E 909', source: 'New Delhi', destination: 'Bengaluru', offsetDays: 0, departureTime: '18:55', duration: 165, price: 7799, stops: 0, seats: 36, refundable: false }),
  createFlight({ id: 'del-blr-ai-921', airline: 'Air India', airlineCode: 'AI', flightNumber: 'AI 921', source: 'New Delhi', destination: 'Bengaluru', offsetDays: 0, departureTime: '19:30', duration: 175, price: 7999, stops: 0, seats: 24, refundable: true }),
  createFlight({ id: 'del-blr-ix-2513', airline: 'Air India Express', airlineCode: 'IX', flightNumber: 'IX 2513', source: 'New Delhi', destination: 'Bengaluru', offsetDays: 0, departureTime: '20:00', duration: 185, price: 4899, stops: 0, seats: 62, refundable: false }),
  createFlight({ id: 'del-blr-6e-1010', airline: 'IndiGo', airlineCode: '6E', flightNumber: '6E 1010', source: 'New Delhi', destination: 'Bengaluru', offsetDays: 0, departureTime: '22:10', duration: 175, price: 4999, stops: 0, seats: 82, refundable: false }),
]

const cityAliases = {
  bangalore: 'bengaluru',
  'new delhi': 'delhi',
}

const normalizeCity = (value = '') => {
  const v = value.toLowerCase().trim()
  return cityAliases[v] || v
}

// Date filter intentionally removed — demo data shows all matching-route flights
export const searchDummyFlights = ({ from, to } = {}) =>
  dummyFlights
    .filter((flight) => {
      const matchesFrom = from ? normalizeCity(flight.source).includes(normalizeCity(from)) : true
      const matchesTo = to ? normalizeCity(flight.destination).includes(normalizeCity(to)) : true
      return matchesFrom && matchesTo
    })
    .sort((a, b) => a.price - b.price)

export const getDummyFlightById = (id) => dummyFlights.find((flight) => flight.id === id)
