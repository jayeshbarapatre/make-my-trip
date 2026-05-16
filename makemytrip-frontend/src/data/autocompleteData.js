export const cities = [
  { name: 'Delhi', code: 'DEL' },
  { name: 'Mumbai', code: 'BOM' },
  { name: 'Bangalore', code: 'BLR' },
  { name: 'Hyderabad', code: 'HYD' },
  { name: 'Chennai', code: 'MAA' },
  { name: 'Kolkata', code: 'CCU' },
  { name: 'Pune', code: 'PNQ' },
  { name: 'Goa', code: 'GOA' },
  { name: 'Jaipur', code: 'JAI' },
  { name: 'Ahmedabad', code: 'AMD' },
  { name: 'Lucknow', code: 'LKO' },
  { name: 'Kochi', code: 'COK' },
  { name: 'Indore', code: 'IDR' },
  { name: 'Srinagar', code: 'SXR' },
  { name: 'Thiruvananthapuram', code: 'TRV' },
]

export const airports = [
  { name: 'Indira Gandhi International Airport', code: 'DEL', city: 'Delhi' },
  { name: 'Chhatrapati Shivaji Maharaj International Airport', code: 'BOM', city: 'Mumbai' },
  { name: 'Kempegowda International Airport', code: 'BLR', city: 'Bangalore' },
  { name: 'Rajiv Gandhi International Airport', code: 'HYD', city: 'Hyderabad' },
  { name: 'Chennai International Airport', code: 'MAA', city: 'Chennai' },
  { name: 'Netaji Subhas Chandra Bose International Airport', code: 'CCU', city: 'Kolkata' },
  { name: 'Pune Airport', code: 'PNQ', city: 'Pune' },
  { name: 'Dabolim Airport', code: 'GOA', city: 'Goa' },
  { name: 'Jaipur International Airport', code: 'JAI', city: 'Jaipur' },
  { name: 'Sardar Vallabhbhai Patel International Airport', code: 'AMD', city: 'Ahmedabad' },
  { name: 'Amausi Airport', code: 'LKO', city: 'Lucknow' },
  { name: 'Cochin International Airport', code: 'COK', city: 'Kochi' },
  { name: 'Devi Ahilya Bai Holkar Airport', code: 'IDR', city: 'Indore' },
  { name: 'Sheikh ul-Alam International Airport', code: 'SXR', city: 'Srinagar' },
  { name: 'Trivandrum International Airport', code: 'TRV', city: 'Thiruvananthapuram' },
]

export const airlines = [
  { name: 'Air India', code: 'AI' },
  { name: 'IndiGo', code: '6E' },
  { name: 'SpiceJet', code: 'SG' },
  { name: 'Vistara', code: 'UK' },
  { name: 'GoAir', code: 'G8' },
  { name: 'Alliance Air', code: '9I' },
  { name: 'AirAsia India', code: 'I5' },
  { name: 'Air India Express', code: 'IX' },
  { name: 'Akasa Air', code: 'QP' },
]

export const aircrafts = [
  { name: 'Boeing 737', manufacturer: 'Boeing' },
  { name: 'Boeing 777', manufacturer: 'Boeing' },
  { name: 'Boeing 787', manufacturer: 'Boeing' },
  { name: 'Airbus A320', manufacturer: 'Airbus' },
  { name: 'Airbus A330', manufacturer: 'Airbus' },
  { name: 'Airbus A350', manufacturer: 'Airbus' },
  { name: 'Airbus A380', manufacturer: 'Airbus' },
  { name: 'Embraer E190', manufacturer: 'Embraer' },
  { name: 'Bombardier CRJ', manufacturer: 'Bombardier' },
  { name: 'ATR 72', manufacturer: 'ATR' },
]

export const getAutocompleteSuggestions = (type, query) => {
  const q = query.toLowerCase()

  switch (type) {
    case 'city':
      return cities.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
    case 'airport':
      return airports.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q)
      )
    case 'airline':
      return airlines.filter(a => a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q))
    case 'aircraft':
      return aircrafts.filter(a => a.name.toLowerCase().includes(q) || a.manufacturer.toLowerCase().includes(q))
    case 'flightNumber':
      const codes = airlines.map(a => a.code).join('|')
      const num = query.replace(/[^\w]/g, '').toUpperCase()
      return airlines
        .filter(a => a.code.toUpperCase().includes(num) || a.name.toLowerCase().includes(q))
        .map(a => ({ ...a, sample: `${a.code} ${100 + Math.floor(Math.random() * 900)}` }))
    default:
      return []
  }
}
