const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const reqCheckIn = '2026-05-25';
  const reqCheckOut = '2026-05-26';
  const hotelNameCheck = 'Dwij Palace';
  
  const existingBookings = await prisma.booking.findMany({
    where: { type: 'hotel', fromCity: hotelNameCheck, status: 'confirmed' }
  });
  
  console.log('Existing bookings:', existingBookings.length);
  
  const reqStart = new Date(reqCheckIn).getTime();
  const reqEnd = new Date(reqCheckOut).getTime();
  
  const overlappingBookings = existingBookings.filter(b => {
    const bStart = new Date(b.departureDate).getTime();
    const bEnd = new Date(b.returnDate || b.departureDate).getTime();
    return reqStart < bEnd && reqEnd > bStart;
  });
  
  console.log('Overlapping bookings:', overlappingBookings.length);
  
  const isEntireHotelBooked = overlappingBookings.some(b => {
    try {
      const bTrav = typeof b.travellers === 'string' ? JSON.parse(b.travellers) : b.travellers;
      return bTrav?.bookEntireHotel === true;
    } catch(e) { return false; }
  });
  
  console.log('isEntireHotelBooked:', isEntireHotelBooked);
}

check();
