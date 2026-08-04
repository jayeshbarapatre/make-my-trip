import { useLocation, useNavigate } from 'react-router-dom';
import ConfirmationTicket from '../components/ConfirmationTicket';
import downloadElementAsPdf from '../utils/pdfDownload';
import '../styles/ConfirmationTicket.css';

export default function FlightSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const booking = location.state?.booking || null;
  const flight = booking?.flight || {};

  const handleDownloadPDF = () =>
    downloadElementAsPdf('flight-ticket-content', `FlightTicket_${booking.pnr || 'Booking'}.pdf`);

  if (!booking?.bookingId) {
    return <ConfirmationTicket missing onMyTrips={() => navigate('/my-trips')} />;
  }

  return (
    <ConfirmationTicket
      title="Flight Ticket Confirmed!"
      subtitle={<>Your flight from <strong>{flight.departure?.city || booking.fromCity || '—'}</strong> to <strong>{flight.arrival?.city || booking.toCity || '—'}</strong> is confirmed.</>}
      referenceLabel="PNR"
      referenceValue={booking.pnr}
      bookingId={booking.bookingId}
      printableId="flight-ticket-content"
      totalAmount={booking.totalAmount}
      footnote={'* Valid Government ID required during check-in. Reach airport 2-3 hours before departure.\nSupport: 1800 102 8747'}
      downloadLabel="📥 DOWNLOAD PDF TICKET"
      onDownloadPDF={handleDownloadPDF}
      onMyTrips={() => navigate('/my-trips')}
      onHome={() => navigate('/')}
      journeyCard={
        <div className="ct-info-card">
          <div className="ct-info-headline">{flight.airline || booking.airlineName || 'Flight'} {flight.flightNumber || booking.flightNumber || ''}</div>
          <div className="ct-info-route">{flight.departure?.city || booking.fromCity} → {flight.arrival?.city || booking.toCity}</div>
          <div className="ct-times">
            <div>
              <div className="ct-time-lbl">Departure</div>
              <div className="ct-time-val">{flight.departure?.time || booking.departureTime || '—'}</div>
              <div className="ct-time-sub">{booking.departureDate}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="ct-time-lbl">Arrival</div>
              <div className="ct-time-val">{flight.arrival?.time || booking.arrivalTime || '—'}</div>
              <div className="ct-time-sub">{flight.arrival?.date || booking.returnDate || 'Same Day'}</div>
            </div>
          </div>
        </div>
      }
      passengers={(booking.passengers || []).map((p) => ({
        name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.name || 'Passenger',
        meta: [p.dob && `DOB: ${p.dob}`, p.nationality, p.nationality && p.nationality].filter(Boolean).join(' · '),
      }))}
    />
  );
}
