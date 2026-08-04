import { useLocation, useNavigate } from 'react-router-dom';
import ConfirmationTicket from '../components/ConfirmationTicket';
import downloadElementAsPdf from '../utils/pdfDownload';
import '../styles/ConfirmationTicket.css';

export default function TrainSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const booking = location.state?.booking || null;
  const train = location.state?.train || booking?.trainDetails || {};

  const handleDownloadPDF = () =>
    downloadElementAsPdf('train-ticket-content', `TrainTicket_${booking?.pnr || 'Booking'}.pdf`);

  if (!booking?.bookingId) {
    return <ConfirmationTicket missing onMyTrips={() => navigate('/my-trips')} />;
  }

  const trainName = train.name || train.operatorName || 'Train';
  const trainNumber = train.number || train.trainNumber;

  return (
    <ConfirmationTicket
      title="Train Ticket Confirmed!"
      subtitle={<>Your journey from <strong>{booking.fromCity || train.from || '—'}</strong> is confirmed.</>}
      referenceLabel="IRCTC PNR"
      referenceValue={booking.pnr}
      bookingId={booking.bookingId}
      printableId="train-ticket-content"
      totalAmount={booking.totalAmount}
      footnote={'* Valid Identity Proof required during travel.\nSupport: 1800 102 8747'}
      downloadLabel="📥 DOWNLOAD PDF TICKET"
      onDownloadPDF={handleDownloadPDF}
      onMyTrips={() => navigate('/my-trips')}
      onHome={() => navigate('/')}
      journeyCard={
        <div className="ct-info-card">
          <div className="ct-info-headline">{trainName} {trainNumber ? `(${trainNumber})` : ''}</div>
          <div className="ct-info-route">{booking.fromCity || train.from} → {booking.toCity || train.to}</div>
          <div className="ct-times">
            <div>
              <div className="ct-time-lbl">Departure</div>
              <div className="ct-time-val">{train.depTime || booking.departureTime || '—'}</div>
              <div className="ct-time-sub">{booking.departureDate}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="ct-time-lbl">Arrival</div>
              <div className="ct-time-val">{train.arrTime || train.arrivalTime || '—'}</div>
              <div className="ct-time-sub">{train.arrivalDate || train.arrival?.date || booking.returnDate || ''}</div>
            </div>
          </div>
        </div>
      }
      passengers={(booking.travellers?.passengers || booking.passengers || []).map((p) => ({
        name: p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Passenger',
        meta: [p.age && `Age: ${p.age}`, p.berth || p.seat, booking.travellers?.classCode || p.classCode].filter(Boolean).join(' · '),
      }))}
    />
  );
}
