import { brand } from '../brand.js'
import {
  renderLayout, heroBanner, card, row, badge, button, journeyStrip,
  travellerTable, fareTable, note, money, dateLong, dateTimeLong, clock, esc
} from '../layout.js'

const LABELS = {
  flight: { noun: 'Flight', hero: 'Your flight is booked', ref: 'PNR', icon: '✈' },
  hotel: { noun: 'Hotel', hero: 'Your stay is confirmed', ref: 'Confirmation No.', icon: '🏨' },
  train: { noun: 'Train', hero: 'Your train ticket is booked', ref: 'PNR', icon: '🚆' },
  bus: { noun: 'Bus', hero: 'Your bus ticket is booked', ref: 'Ticket No.', icon: '🚌' },
  cab: { noun: 'Cab', hero: 'Your cab is booked', ref: 'Trip ID', icon: '🚕' }
}

const first = (...vals) => vals.find(v => v !== undefined && v !== null && v !== '' )

/**
 * Booking payloads reach us from five different frontend pages with inconsistent
 * field names, so every read goes through an alias list rather than a fixed key.
 */
const normalise = (b = {}) => {
  const t = (b.type || 'flight').toLowerCase()
  const travellers = b.travellers || {}
  const detail = b.flight || b.hotel || b.bus || b.train || b.cab || {}

  const rawPeople = first(
    Array.isArray(b.passengers) ? b.passengers : null,
    Array.isArray(travellers.passengers) ? travellers.passengers : null,
    Array.isArray(b.guests) ? b.guests : null,
    Array.isArray(b.guestDetails) ? b.guestDetails : null,
    Array.isArray(travellers.guests) ? travellers.guests : null,
    []
  )

  const people = (rawPeople || []).map(p =>
    typeof p === 'string' ? { name: p } : p
  )

  const totalAmount = Number(first(b.totalAmount, b.amount, 0)) || 0

  return {
    type: t,
    label: LABELS[t] || { noun: 'Booking', hero: 'Your booking is confirmed', ref: 'Reference', icon: '🎫' },
    bookingId: first(b.bookingId, b.id, '—'),
    reference: first(b.pnr, b.confirmationNumber, b.ticketNumber, ''),
    status: first(b.status, 'confirmed'),
    bookedAt: first(b.createdAt, new Date().toISOString()),

    customerName: first(b.contact?.name, people[0]?.name, people[0]?.firstName, b.userName, 'Guest'),
    customerEmail: first(b.userEmail, b.email, b.contact?.email, ''),
    customerPhone: first(b.userPhone, b.phone, b.contact?.phone, travellers.contact?.phone, ''),

    from: first(b.fromCity, b.pickupLocation, b.from, b.source, detail.from, detail.source, b.hotelName, ''),
    to: first(b.toCity, b.dropLocation, b.to, b.destination, detail.to, detail.destination, b.hotelLocality, ''),
    travelDate: first(b.departureDate, b.checkIn, b.travelDate, b.journeyDate, detail.date, ''),
    returnDate: first(b.returnDate, b.checkOut, ''),
    departTime: first(b.departureTime, detail.departureTime, detail.departure?.time, ''),
    arriveTime: first(b.arrivalTime, detail.arrivalTime, detail.arrival?.time, ''),
    duration: first(b.duration, detail.duration, b.estimatedTime, ''),

    people,
    paxCount: people.length || Number(first(travellers.passengers, travellers.adults, b.rooms, 1)) || 1,

    totalAmount,
    baseFare: Number(first(b.baseFare, 0)) || 0,
    taxes: Number(first(b.taxes, 0)) || 0,
    convenience: Number(first(b.convenience, 0)) || 0,
    gst: Number(first(b.gst, 0)) || 0,
    discount: Number(first(b.discount, 0)) || 0,

    paymentStatus: first(b.paymentStatus, 'completed'),
    paymentMethod: first(b.paymentMethod, travellers.method, 'Online Payment'),
    transactionId: first(b.transactionId, b.paymentId, ''),

    raw: b,
    detail,
    travellers
  }
}

const prettyMethod = (m) => {
  const map = {
    credit_card: 'Credit Card', debit_card: 'Debit Card', razorpay: 'Razorpay',
    upi: 'UPI', netbanking: 'Net Banking', wallet: 'Wallet', cod: 'Pay at Destination'
  }
  return map[String(m).toLowerCase()] || String(m).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

/** Category-specific block placed between the journey strip and the traveller list. */
const serviceCard = (v) => {
  const d = v.detail
  const b = v.raw

  if (v.type === 'flight') {
    return card('Flight Details', [
      row('Airline', first(b.airlineName, d.airline, d.airlineName, d.name)),
      row('Flight Number', first(b.flightNumber, d.flightNumber, d.number)),
      row('Cabin Class', first(b.fareClass, b.cabinClass, v.travellers.searchParams?.cabinClass, d.cabinClass)),
      row('Baggage', first(b.baggage, d.baggage)),
      row('Duration', v.duration)
    ])
  }

  if (v.type === 'hotel') {
    const nights = first(b.nights, v.travellers.nights)
    return card('Stay Details', [
      row('Hotel', first(b.hotelName, d.name, v.from)),
      row('Location', first(b.hotelLocality, b.hotelAddress, d.address, v.to)),
      row('Room Type', first(b.roomName, v.travellers.roomName, d.roomType)),
      row('Rooms', first(b.rooms, v.travellers.rooms)),
      row('Guests', first(v.travellers.guests, v.travellers.adults, v.paxCount)),
      row('Nights', nights),
      row('Check-in', v.travelDate ? dateLong(v.travelDate) : '', { strong: true }),
      row('Check-out', v.returnDate ? dateLong(v.returnDate) : '', { strong: true })
    ])
  }

  if (v.type === 'train') {
    return card('Train Details', [
      row('Train', first(b.trainName, d.trainName, d.name)),
      row('Train Number', first(b.trainNumber, d.trainNumber, d.number)),
      row('Class', first(b.travelClass, b.coachClass, d.class)),
      row('Quota', first(b.quota, d.quota)),
      row('Duration', v.duration)
    ])
  }

  if (v.type === 'bus') {
    return card('Bus Details', [
      row('Operator', first(b.busOperator, d.operatorName, d.operator)),
      row('Bus Type', first(b.busType, d.type)),
      row('Boarding Point', first(b.boardingPoint, d.boardingPoint)),
      row('Dropping Point', first(b.droppingPoint, d.droppingPoint)),
      row('Duration', v.duration)
    ])
  }

  if (v.type === 'cab') {
    return card('Cab Details', [
      row('Cab Type', first(b.cabType, d.type)),
      row('Vehicle', first(b.cabModel, d.model)),
      row('Licence Plate', first(b.licensePlate, d.licensePlate)),
      row('Driver', first(b.driverName, d.driver)),
      row('Distance', first(b.distance, d.distance)),
      row('Estimated Time', first(b.estimatedTime, d.estimatedTime))
    ])
  }

  return ''
}

const journeyFor = (v) => {
  if (v.type === 'hotel') {
    return journeyStrip({
      from: 'Check-in',
      to: 'Check-out',
      fromTime: v.travelDate ? dateLong(v.travelDate) : '',
      toTime: v.returnDate ? dateLong(v.returnDate) : '',
      fromSub: first(v.raw.checkInTime, '2:00 PM onwards'),
      toSub: first(v.raw.checkOutTime, 'by 11:00 AM'),
      middle: first(v.raw.nights, v.travellers.nights) ? `${first(v.raw.nights, v.travellers.nights)} night(s)` : ''
    })
  }
  if (!v.from && !v.to) return ''
  return journeyStrip({
    from: v.from,
    to: v.to,
    fromTime: v.departTime ? clock(v.departTime) : '',
    toTime: v.arriveTime ? clock(v.arriveTime) : '',
    fromSub: v.travelDate ? dateLong(v.travelDate) : '',
    toSub: v.arriveTime ? '' : (v.travelDate ? dateLong(v.travelDate) : ''),
    middle: v.duration || ''
  })
}

const travelTips = (type) => {
  const tips = {
    flight: ['Reach the airport at least 2 hours before departure for domestic flights.', 'Carry a government-issued photo ID matching the name on your ticket.'],
    hotel: ['Carry a valid photo ID for all guests at check-in.', 'Early check-in and late check-out are subject to availability.'],
    train: ['Carry the original photo ID used during booking.', 'Reach the station at least 30 minutes before departure.'],
    bus: ['Reach the boarding point 15 minutes before departure.', 'Keep this ticket handy — the operator may ask for it.'],
    cab: ['Your driver will contact you shortly before pickup.', 'Verify the licence plate before starting your trip.']
  }
  const list = tips[type] || []
  if (!list.length) return ''
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background:${brand.wash};border-radius:10px;margin:0 0 16px;">
    <tr><td style="padding:16px 18px;font:400 13px/1.7 Arial,Helvetica,sans-serif;color:${brand.ink};">
      <strong style="color:${brand.primary};">Before you go</strong>
      <ul style="margin:8px 0 0;padding-left:18px;color:${brand.muted};">
        ${list.map(t => `<li style="margin:0 0 4px;">${esc(t)}</li>`).join('')}
      </ul>
    </td></tr></table>`
}

export const renderBookingConfirmation = (booking, opts = {}) => {
  const v = normalise(booking)
  const paid = String(v.paymentStatus).toLowerCase()
  const paidOk = ['completed', 'paid', 'success', 'captured'].includes(paid)

  const viewUrl = opts.viewUrl || `${brand.appUrl}/my-trips`
  const pdfUrl = opts.pdfUrl || ''

  const subject = `${v.label.noun} Booking Confirmed — ${v.bookingId}`
  const preheader = `${v.label.noun} booking ${v.bookingId} confirmed${v.from && v.to ? ` · ${v.from} to ${v.to}` : ''} · ${money(v.totalAmount)} paid`

  const hero = heroBanner({
    title: 'Booking Confirmed',
    subtitle: `${v.label.icon}  ${v.label.hero}`
  })

  // Only show a fare breakdown when the components actually add up to the total;
  // several pages send synthetic 80/15/5 splits that would otherwise mislead.
  const components = v.baseFare + v.taxes + v.convenience + v.gst - v.discount
  const breakdownIsReal = v.baseFare > 0 && Math.abs(components - v.totalAmount) <= Math.max(2, v.totalAmount * 0.02)

  const fare = breakdownIsReal
    ? fareTable([
        { label: `Base Fare${v.paxCount > 1 ? ` (${v.paxCount} × )` : ''}`, amount: v.baseFare },
        { label: 'Taxes & Surcharges', amount: v.taxes },
        { label: 'Convenience Fee', amount: v.convenience },
        { label: 'GST', amount: v.gst },
        { label: 'Discount', amount: -Math.abs(v.discount) }
      ], v.totalAmount)
    : fareTable([{ label: 'Booking Amount', amount: v.totalAmount }], v.totalAmount)

  const body = `
    <p style="margin:0 0 6px;font:400 15px/1.6 Arial,Helvetica,sans-serif;color:${brand.ink};">
      Hi <strong>${esc(v.customerName)}</strong>,
    </p>
    <p style="margin:0 0 20px;font:400 14px/1.7 Arial,Helvetica,sans-serif;color:${brand.muted};">
      Great news — your ${esc(v.label.noun.toLowerCase())} booking is confirmed. Keep this email handy;
      it is your proof of booking.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="border:2px solid ${brand.primary};border-radius:10px;margin:0 0 16px;">
      <tr><td style="padding:16px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td class="stack" style="font-family:Arial,Helvetica,sans-serif;">
            <div style="font:400 11px/1 Arial,Helvetica,sans-serif;color:${brand.muted};
              text-transform:uppercase;letter-spacing:.8px;">Booking ID</div>
            <div style="font:700 19px/1.4 Arial,Helvetica,sans-serif;color:${brand.primary};
              letter-spacing:.5px;">${esc(v.bookingId)}</div>
          </td>
          ${v.reference ? `<td class="stack" align="right" style="font-family:Arial,Helvetica,sans-serif;">
            <div style="font:400 11px/1 Arial,Helvetica,sans-serif;color:${brand.muted};
              text-transform:uppercase;letter-spacing:.8px;">${esc(v.label.ref)}</div>
            <div style="font:700 19px/1.4 Arial,Helvetica,sans-serif;color:${brand.ink};
              letter-spacing:.5px;">${esc(v.reference)}</div>
          </td>` : ''}
        </tr></table>
      </td></tr>
    </table>

    ${journeyFor(v)}
    ${serviceCard(v)}
    ${travellerTable(v.people)}

    ${card('Booking Summary', [
      row('Category', v.label.noun),
      row('Booking Status', badge(v.status, brand.success), { raw: true }),
      row('Booked On', dateTimeLong(v.bookedAt)),
      row('Travel Date', v.travelDate ? dateLong(v.travelDate) : ''),
      row('Origin', v.type === 'hotel' ? '' : v.from),
      row('Destination', v.type === 'hotel' ? '' : v.to),
      row('Traveller(s)', v.paxCount)
    ])}

    ${fare}

    ${card('Payment', [
      row('Payment Status', badge(paidOk ? 'Paid' : v.paymentStatus, paidOk ? brand.success : '#f59e0b'), { raw: true }),
      row('Payment Method', prettyMethod(v.paymentMethod)),
      row('Transaction ID', v.transactionId),
      row('Amount Paid', money(v.totalAmount), { strong: true })
    ])}

    ${card('Contact Details', [
      row('Name', v.customerName),
      row('Email', v.customerEmail),
      row('Mobile', v.customerPhone)
    ])}

    <div style="margin:4px 0 18px;">
      ${button('View Booking', viewUrl)}
      ${pdfUrl ? button('Download Ticket (PDF)', pdfUrl, brand.primary) : ''}
    </div>

    ${travelTips(v.type)}
    ${note('Cancellation & changes', 'Cancellation charges depend on the operator\'s fare rules. Manage or cancel this booking any time from My Trips.')}
  `

  return {
    subject,
    html: renderLayout({
      preheader,
      hero,
      body,
      footerNote: `Sent to ${v.customerEmail || 'your registered email'} for booking ${v.bookingId}.`
    }),
    text: [
      `${v.label.noun} Booking Confirmed`,
      `Booking ID: ${v.bookingId}`,
      v.reference ? `${v.label.ref}: ${v.reference}` : '',
      `Customer: ${v.customerName} (${v.customerEmail})`,
      v.from && v.to ? `Route: ${v.from} → ${v.to}` : '',
      v.travelDate ? `Travel Date: ${dateLong(v.travelDate)}` : '',
      `Travellers: ${v.paxCount}`,
      `Status: ${v.status}`,
      `Total Paid: ${money(v.totalAmount)} via ${prettyMethod(v.paymentMethod)}`,
      v.transactionId ? `Transaction: ${v.transactionId}` : '',
      ``,
      `View your booking: ${viewUrl}`,
      `Support: ${brand.supportEmail} · ${brand.supportPhone}`
    ].filter(Boolean).join('\n'),
    meta: v
  }
}

export default { renderBookingConfirmation }
