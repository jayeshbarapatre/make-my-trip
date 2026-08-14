import { useLocation, useNavigate } from 'react-router-dom';
import ConfirmationTicket from '../components/ConfirmationTicket';
import downloadElementAsPdf from '../utils/pdfDownload';
import '../styles/ConfirmationTicket.css';

export default function HotelSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const booking = location.state?.booking || {};
  const hotel = location.state?.hotel || null;
  const roomName = location.state?.roomName || booking.travellers?.roomName || 'Deluxe Room';
  const checkIn = location.state?.checkIn || booking.departureDate || '—';
  const checkOut = location.state?.checkOut || booking.returnDate || '—';
  const guests = location.state?.guests || booking.travellers?.guests || '—';
  const nights = location.state?.nights || booking.nights || '—';
  const rooms = location.state?.rooms || booking.travellers?.rooms || 1;
  const totalAmount = location.state?.totalAmount || booking.totalAmount || 0;
  const hotelName = hotel?.name || booking.fromCity || '—';
  const hotelLocality = hotel?.locality || hotel?.location || booking.toCity || '';
  const confirmationId = booking.pnr || null;
  const bookingId = booking.bookingId || null;
  const paymentMethod = booking.travellers?.method || 'UPI';

  const handleDownloadPDF = () =>
    downloadElementAsPdf('hotel-ticket-content', `HotelTicket_${confirmationId || bookingId}.pdf`);

  if (!bookingId) {
    return <ConfirmationTicket missing onMyTrips={() => navigate('/my-trips')} />;
  }

  return (
    <ConfirmationTicket
      title="Booking Confirmed!"
      subtitle={<>Your stay at <strong>{hotelName}</strong> is confirmed.</>}
      referenceLabel="CONFIRMATION ID"
      referenceValue={confirmationId}
      bookingId={bookingId}
      printableId="hotel-ticket-content"
      totalAmount={totalAmount}
      footnote={`* Please present this voucher at the time of check-in.\nPayment: ${paymentMethod} · Support: 1800 102 8747 | support@tripora.com`}
      downloadLabel="📥 DOWNLOAD PDF VOUCHER"
      onDownloadPDF={handleDownloadPDF}
      onMyTrips={() => navigate('/my-trips')}
      onHome={() => navigate('/')}
      journeyCard={
        <div className="ct-info-card">
          <div className="ct-info-headline">{hotelName}</div>
          {hotelLocality && <div className="ct-info-route">📍 {hotelLocality}</div>}
          <div className="ct-info-route">📅 {checkIn} — {checkOut}</div>
          <div className="ct-meta-chips">
            <span className="ct-meta-chip">🌙 {nights} Night{nights !== 1 ? 's' : ''}</span>
            <span className="ct-meta-chip">🛏️ {rooms} Room{rooms !== 1 ? 's' : ''}</span>
            <span className="ct-meta-chip">👥 {guests}</span>
            <span className="ct-meta-chip">🏷️ {roomName}</span>
          </div>
        </div>
      }
      passengers={[
        { name: roomName, meta: `${rooms} Room${rooms !== 1 ? 's' : ''} · ${guests} guest${guests !== 1 ? 's' : ''}` },
      ]}
    />
  );
}
