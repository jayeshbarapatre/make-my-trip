import { useLocation, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../styles/HotelSuccessPage.css';

export default function HotelSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve confirmed booking payload
  const booking = location.state?.booking || {
    id: "bkg_hotel_default",
    pnr: "HTL-857888",
    bookingId: "MMT-HT-246214",
    fromCity: "Axiom Resort Luxury Cottages, Arambol - Premium room with Pool view",
    toCity: "Arambol, Goa",
    departureDate: "2026-05-15",
    returnDate: "2026-05-16",
    travellers: { guests: "2 Adults | 1 Room", method: "UPI / Google Pay" },
    totalAmount: 4760
  };
  const hotel = {
    name: "Axiom Resort Luxury Cottages, Arambol"
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('hotel-ticket-content');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`HotelTicket_${booking.pnr || 'Booking'}.pdf`);
    } catch (error) {
      console.error('PDF Error:', error);
      alert('Failed to generate PDF');
    }
  };

  return (
    <div className="succ-wrapper">
      <div className="succ-container">
        
        <div id="hotel-ticket-content" className="succ-ticket-outer">
          <div className="succ-premium-header">
            <div className="succ-icon-glow">✓</div>
            <h1 className="succ-title">Booking Confirmed!</h1>
            <p className="succ-subtitle">Your stay at <strong>{hotel.name}</strong> is confirmed.</p>
            
            <div className="succ-pnr-ribbon">
              <div className="succ-ribbon-item">
                <span className="succ-ribbon-lbl">CONFIRMATION ID</span>
                <span className="succ-ribbon-val">{booking.pnr}</span>
              </div>
              <div className="succ-ribbon-sep" />
              <div className="succ-ribbon-item">
                <span className="succ-ribbon-lbl">BOOKING ID</span>
                <span className="succ-ribbon-val">{booking.bookingId}</span>
              </div>
            </div>
          </div>

          <div className="succ-ticket-body">
            <div className="succ-sec">
              <h3 className="succ-sec-title">Property Details</h3>
              <div className="succ-prop-card">
                <div className="succ-prop-name">{hotel.name}</div>
                <div className="succ-prop-loc">📍 {booking.toCity}</div>
                <div className="succ-prop-dates">
                  📅 {booking.departureDate} — {booking.returnDate}
                </div>
              </div>
            </div>

            <div className="succ-info-grid">
              <div className="succ-info-item">
                <span className="succ-info-lbl">Guests & Rooms</span>
                <span className="succ-info-val">{booking.travellers?.guests || "2 Adults | 1 Room"}</span>
              </div>
              <div className="succ-info-item">
                <span className="succ-info-lbl">Payment Status</span>
                <span className="succ-info-val" style={{ color: '#059669' }}>SUCCESS</span>
              </div>
              <div className="succ-info-item">
                <span className="succ-info-lbl">Total Amount Paid</span>
                <span className="succ-info-val" style={{ fontWeight: 900 }}>₹ {booking.totalAmount?.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="succ-ticket-footer">
              <p>* Please present this voucher at the time of check-in.</p>
              <p>Support: 1800 102 8747 | support@makemytrip.com</p>
            </div>
          </div>
        </div>

        <div className="succ-actions-row">
          <button 
            className="btn-primary succ-action-main"
            onClick={handleDownloadPDF}
          >
            📥 DOWNLOAD PDF TICKET
          </button>
          <button 
            className="succ-action-sec"
            onClick={() => navigate('/my-trips')}
          >
            🧳 MY BOOKINGS
          </button>
          <button 
            className="succ-action-home"
            onClick={() => navigate('/')}
          >
            🏠 GO HOME
          </button>
        </div>

      </div>
    </div>
  );
}
