import { useLocation, useNavigate } from 'react-router-dom';
import ConfirmationTicket from '../components/ConfirmationTicket';
import downloadElementAsPdf from '../utils/pdfDownload';
import '../styles/ConfirmationTicket.css';

export default function CabSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const booking = location.state?.booking || {};
  const cab = location.state?.cab || { type: 'Sedan', driver: 'Driver' };
  const pickupLocation = location.state?.pickupLocation || booking.fromCity || '—';
  const dropLocation = location.state?.dropLocation || booking.toCity || '—';
  const distance = location.state?.distance || '—';
  const estimatedTime = location.state?.estimatedTime || '—';
  const totalAmount = location.state?.totalAmount || booking.totalAmount || 0;
  const bookingId = booking.bookingId || null;
  const pnr = booking.pnr || null;

  const handleDownloadPDF = () =>
    downloadElementAsPdf('cab-ticket-content', `CabTicket_${pnr || bookingId}.pdf`);

  if (!bookingId) {
    return <ConfirmationTicket missing onMyTrips={() => navigate('/my-trips')} />;
  }

  return (
    <ConfirmationTicket
      title="Cab Booking Confirmed!"
      subtitle="Your cab is booked. Driver details will be shared shortly."
      referenceLabel="CONFIRMATION ID"
      referenceValue={pnr}
      bookingId={bookingId}
      printableId="cab-ticket-content"
      totalAmount={totalAmount}
      footnote={'* Driver will contact you shortly. Keep your phone on for driver updates.\nSupport: 1800 102 8747 | support@tripora.com'}
      downloadLabel="📥 DOWNLOAD RECEIPT"
      onDownloadPDF={handleDownloadPDF}
      onMyTrips={() => navigate('/my-trips')}
      onHome={() => navigate('/')}
      journeyCard={
        <div className="ct-info-card">
          <div className="ct-info-headline">🚖 {cab.type} - {cab.model || 'Standard'}</div>
          <div className="ct-info-route">{pickupLocation} → {dropLocation}</div>
          <div className="ct-meta-chips">
            <span className="ct-meta-chip">📏 {distance}</span>
            <span className="ct-meta-chip">⏱️ {estimatedTime}</span>
            <span className="ct-meta-chip">🚘 {cab.licensePlate || cab.vehicleNumber || '—'}</span>
          </div>
        </div>
      }
      passengers={[
        { name: cab.driver || 'Assigned Driver', meta: `Verified Driver${cab.rating ? ` · ⭐ ${cab.rating}` : ''}${cab.phone ? ` · ${cab.phone}` : ''}` },
      ]}
    />
  );
}
